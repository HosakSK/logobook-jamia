"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import {
  DimensionMatrixConfig,
  DimensionMatrixResult,
} from "@/lib/types/wizard";
import { dimensionMatrixSchema } from "@/lib/validations/wizard";
import { seedSystemTemplatesAction } from "@/actions/templates";
import { DEFAULT_SYSTEM_TEMPLATES } from "@/lib/constants/default-templates";
import { PageTemplateStructure } from "@/lib/types/template";
import { ContainerLayoutType } from "@/types/pocketbase-types";

// Helper: verify user permissions for a brand
async function verifyBrandAccess(pb: any, brandId: string, userId: string) {
  const brand = await pb.collection("brands").getOne(brandId);
  const isOwner = brand.user === userId;

  if (isOwner) return { brand, role: "OWNER" };

  try {
    const tm = await pb.collection("teamMembers").getFirstListItem(
      `brand = "${brandId}" && user = "${userId}"`
    );
    if (tm.role === "VIEWER") {
      throw new Error("Čitatelia (VIEWER) nemajú oprávnenie upravovať manuál.");
    }
    return { brand, role: tm.role };
  } catch {
    throw new Error("Nemáte prístup k tomuto brand projektu.");
  }
}

/**
 * Replaces {{brand_name}} tokens in serialized strings or i18n records
 */
function replaceBrandTokens(val: any, brandName: string): any {
  if (typeof val === "string") {
    return val.replace(/\{\{brand_name\}\}/g, brandName);
  }
  if (Array.isArray(val)) {
    return val.map((item) => replaceBrandTokens(item, brandName));
  }
  if (typeof val === "object" && val !== null) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = replaceBrandTokens(v, brandName);
    }
    return res;
  }
  return val;
}

/**
 * Generates the full brand manual page tree and populates pages with blueprints
 * (Dimension Matrix Engine) following combinatorial rules and incremental safety.
 */
export async function generateBrandTreeAction(
  brandId: string,
  rawConfig: DimensionMatrixConfig
): Promise<DimensionMatrixResult> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, createdPagesCount: 0, createdModulesCount: 0, skippedPagesCount: 0, error: "Neautorizovaná relácia." };
    }

    const { brand } = await verifyBrandAccess(pb, brandId, user.id);
    const brandName = brand.name || "Brand";

    const config = dimensionMatrixSchema.parse(rawConfig);

    // 1. Ensure system templates exist
    await seedSystemTemplatesAction();

    // 2. Fetch system templates
    const systemTemplateRecords = await pb.collection("pageTemplates").getFullList({
      filter: "isSystem = true",
    });

    const getTemplateByCategoryOrName = (category: string, fallbackKeywords: string[]): PageTemplateStructure => {
      const found = systemTemplateRecords.find(
        (t: any) =>
          t.category === category ||
          fallbackKeywords.some((kw) => t.name?.en?.toLowerCase().includes(kw) || t.name?.sk?.toLowerCase().includes(kw))
      );
      if (found && found.structure) {
        return found.structure;
      }
      const defaultFound = DEFAULT_SYSTEM_TEMPLATES.find((t) => t.category === category);
      return defaultFound?.structure || { containers: [] };
    };

    const logoBlueprintStructure = getTemplateByCategoryOrName("Logo", ["logo", "presentation", "blueprint"]);
    const colorsBlueprintStructure = getTemplateByCategoryOrName("Farby", ["color", "swatches", "farby"]);
    const typographyBlueprintStructure = getTemplateByCategoryOrName("Typografia", ["typography", "fonts", "písmo"]);

    // 3. Fetch existing brand pages to ensure incremental safety (skip existing slugs!)
    const existingPages = await pb.collection("pages").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    const existingSlugMap = new Map<string, any>(existingPages.map((p: any) => [p.slug, p]));

    let createdPagesCount = 0;
    let createdModulesCount = 0;
    let skippedPagesCount = 0;
    let firstCreatedPageId: string | undefined = undefined;

    // Helper: Ensure page exists or create it
    const ensurePage = async (
      title: Record<string, string>,
      slug: string,
      parentId: string | null = null,
      menuStyle: "main" | "submenu" | "hidden" = "main",
      order: number = 0
    ): Promise<{ page: any; isNew: boolean }> => {
      if (existingSlugMap.has(slug)) {
        skippedPagesCount++;
        return { page: existingSlugMap.get(slug), isNew: false };
      }

      const newPage = await pb.collection("pages").create({
        brand: brandId,
        title,
        slug,
        parent: parentId || null,
        isInMenu: !parentId,
        menuStyle,
        order,
      });

      existingSlugMap.set(slug, newPage);
      createdPagesCount++;
      if (!firstCreatedPageId) {
        firstCreatedPageId = newPage.id;
      }
      return { page: newPage, isNew: true };
    };

    // Helper: Apply a blueprint structure to a page
    const applyStructure = async (
      pageId: string,
      structure: PageTemplateStructure,
      overrideLinkGroupId?: string
    ) => {
      if (!structure || !Array.isArray(structure.containers)) return;

      for (let cIdx = 0; cIdx < structure.containers.length; cIdx++) {
        const tContainer = structure.containers[cIdx];
        const processedH2Title = tContainer.h2Title
          ? replaceBrandTokens(tContainer.h2Title, brandName)
          : null;

        const createdContainer = await pb.collection("containers").create({
          page: pageId,
          order: tContainer.order ?? cIdx,
          layoutType: tContainer.layoutType || "FULL",
          showH2: !!tContainer.showH2,
          h2Title: processedH2Title,
        });

        const columnsList = tContainer.columns || [{ order: 0, modules: [] }];
        for (let colIdx = 0; colIdx < columnsList.length; colIdx++) {
          const tCol = columnsList[colIdx];
          const createdColumn = await pb.collection("columns").create({
            container: createdContainer.id,
            order: tCol.order ?? colIdx,
          });

          if (Array.isArray(tCol.modules)) {
            for (let mIdx = 0; mIdx < tCol.modules.length; mIdx++) {
              const tModule = tCol.modules[mIdx];
              const processedH3Title = tModule.h3Title
                ? replaceBrandTokens(tModule.h3Title, brandName)
                : null;
              const processedConfig = tModule.config
                ? replaceBrandTokens(tModule.config, brandName)
                : {};

              let activeLinkGroupId = tModule.linkGroupId || "";
              if (overrideLinkGroupId && tModule.moduleType === "M08_OchrannaZonaLoga") {
                activeLinkGroupId = overrideLinkGroupId;
              }

              await pb.collection("modules").create({
                column: createdColumn.id,
                order: tModule.order ?? mIdx,
                moduleType: tModule.moduleType,
                showH3: !!tModule.showH3,
                h3Title: processedH3Title,
                config: processedConfig,
                linkGroupId: activeLinkGroupId,
              });
              createdModulesCount++;
            }
          }
        }
      }
    };

    // Helper: Inject M04 Button Box into a category page pointing to its child pages
    const brandSlugOrId = brand.slug || brandId;
    const injectCategoryM04 = async (
      pageId: string,
      titleRecord: Record<string, string>,
      children: Array<{ id: string; slug?: string; title: Record<string, string> }>
    ) => {
      // Check if page already has containers
      const existingConts = await pb.collection("containers").getList(1, 1, { filter: `page = "${pageId}"` });
      if (existingConts.totalItems > 0) return; // already has content

      const createdContainer = await pb.collection("containers").create({
        page: pageId,
        order: 0,
        layoutType: "FULL",
        showH2: false,
      });

      const createdColumn = await pb.collection("columns").create({
        container: createdContainer.id,
        order: 0,
      });

      // Module 1: M01 Nadpis
      await pb.collection("modules").create({
        column: createdColumn.id,
        order: 0,
        moduleType: "M01_Nadpis",
        showH3: false,
        config: {
          title: replaceBrandTokens(titleRecord, brandName),
          level: "h1",
        },
      });
      createdModulesCount++;

      // Module 2: M04 Razcestnik pointing to children
      const m04Items = children.map((child, idx) => {
        const childSlugOrId = child.slug || child.id;
        return {
          id: `link-item-${child.id}-${idx}`,
          title: child.title,
          description: { en: "Explore chapter", sk: "Zobraziť kapitolu", cs: "Zobrazit kapitolu" },
          targetPageId: child.id,
          targetUrl: `/admin/brand/${brandSlugOrId}/builder/${childSlugOrId}`,
          button: {
            label: { en: "Explore section", sk: "Prejsť do sekcie", cs: "Přejít do sekce" },
            style: "primary" as const,
          },
        };
      });

      // Layout rule: 1 to 3 items -> 1 row (columns = items count), 4 to 5 items -> 2 rows (columns = 3)
      const m04Cols = children.length >= 4 ? 3 : Math.min(3, Math.max(1, children.length));

      await pb.collection("modules").create({
        column: createdColumn.id,
        order: 1,
        moduleType: "M04_Razcestnik",
        showH3: true,
        h3Title: { en: "Select Variant", sk: "Vyberte variant", cs: "Vyberte variant" },
        config: {
          columns: m04Cols,
          clickableEntireCard: true,
          items: m04Items,
        },
      });
      createdModulesCount++;
    };

    let globalOrder = existingPages.length > 0 ? Math.max(...existingPages.map((p: any) => p.order ?? 0)) + 1 : 0;

    // -------------------------------------------------------------------------
    // STEP A: Optional Intro Page (Úvod a poslanie)
    // -------------------------------------------------------------------------
    if (config.includeIntroPage) {
      const { page: introPage, isNew } = await ensurePage(
        {
          en: "Overview & Mission",
          sk: "Úvod a poslanie",
          cs: "Úvod a poslání",
        },
        "uvod",
        null,
        "main",
        globalOrder++
      );

      if (isNew) {
        // Create 2 containers: Banner + Mission text
        const c1 = await pb.collection("containers").create({ page: introPage.id, order: 0, layoutType: "FULL", showH2: false });
        const col1 = await pb.collection("columns").create({ container: c1.id, order: 0 });
        await pb.collection("modules").create({
          column: col1.id,
          order: 0,
          moduleType: "M03_Banner",
          showH3: true,
          h3Title: { en: "Official Brand Manual", sk: "Oficiálny dizajn manuál", cs: "Oficiální design manuál" },
          config: {
            bannerText: {
              en: `Official Visual Identity System & Design Standards for ${brandName}.`,
              sk: `Oficiálny systém vizuálnej identity a dizajnérskych štandardov značky ${brandName}.`,
              cs: `Oficiální systém vizuální identity a designérských standardů značky ${brandName}.`,
            },
            variant: "accent",
          },
        });
        createdModulesCount++;

        const c2 = await pb.collection("containers").create({ page: introPage.id, order: 1, layoutType: "FULL", showH2: true, h2Title: { en: "Brand Mission & Purpose", sk: "Poslanie a vízia značky", cs: "Poslání a vize značky" } });
        const col2 = await pb.collection("columns").create({ container: c2.id, order: 0 });
        await pb.collection("modules").create({
          column: col2.id,
          order: 0,
          moduleType: "M02_RichText",
          showH3: false,
          config: {
            content: {
              en: `<p>Vitajte v oficiálnom dizajn manuáli značky <strong>${brandName}</strong>. Tento dokument definuje jednotné pravidlá používania loga, farebnej palety, typografie a prezentačných materiálov.</p>`,
              sk: `<p>Vitajte v oficiálnom dizajn manuáli značky <strong>${brandName}</strong>. Tento dokument definuje jednotné pravidlá používania loga, farebnej palety, typografie a prezentačných materiálov.</p>`,
            },
          },
        });
        createdModulesCount++;
      }
    }

    // -------------------------------------------------------------------------
    // STEP B: Root Logo Category (/logo)
    // -------------------------------------------------------------------------
    const { page: rootLogoPage } = await ensurePage(
      { en: "Logo & Symbol", sk: "Logo a symbol", cs: "Logo a symbol" },
      "logo",
      null,
      "main",
      globalOrder++
    );

    const mediaNodesForRootM04: Array<{ id: string; slug?: string; title: Record<string, string> }> = [];

    // -------------------------------------------------------------------------
    // STEP C: Combinatorial Loop (Media -> Orientations -> Claims -> Backgrounds)
    // -------------------------------------------------------------------------
    const mediaLabels: Record<string, { en: string; sk: string; cs: string; slug: string }> = {
      cmyk: { en: "Print (CMYK)", sk: "Tlač (CMYK)", cs: "Tisk (CMYK)", slug: "logo-tlac" },
      rgb: { en: "Digital (RGB)", sk: "Digitál (RGB)", cs: "Digitál (RGB)", slug: "logo-digital" },
      special: { en: "Special & Monochrome", sk: "Špeciálne & Monochróm", cs: "Speciální & Monochrom", slug: "logo-special" },
    };

    const compositionLabels: Record<
      string,
      { en: string; sk: string; cs: string; slugSuffix: string; syncBase: string }
    > = {
      horizontal: {
        en: "Horizontal",
        sk: "Na šírku",
        cs: "Na šířku",
        slugSuffix: "sirka",
        syncBase: "horizontal",
      },
      vertical: {
        en: "Vertical",
        sk: "Na výšku",
        cs: "Na výšku",
        slugSuffix: "vyska",
        syncBase: "vertical",
      },
      symbol: {
        en: "Symbol & Monogram",
        sk: "Symbol a monogram",
        cs: "Symbol a monogram",
        slugSuffix: "symbol",
        syncBase: "symbol",
      },
      horizontal_claim: {
        en: "Horizontal with Claim",
        sk: "Na šírku s claimom",
        cs: "Na šířku s claimem",
        slugSuffix: "sirka-claim",
        syncBase: "horizontal_claim",
      },
      vertical_claim: {
        en: "Vertical with Claim",
        sk: "Na výšku s claimom",
        cs: "Na výšku s claimem",
        slugSuffix: "vyska-claim",
        syncBase: "vertical_claim",
      },
    };

    // Determine normalized compositions list (supports new compositions or legacy orientations + hasClaimOption)
    let activeCompositions: string[] = [];
    if (config.compositions && config.compositions.length > 0) {
      activeCompositions = config.compositions;
    } else if (config.orientations && config.orientations.length > 0) {
      for (const ori of config.orientations) {
        activeCompositions.push(ori);
        if (ori !== "symbol" && config.hasClaimOption) {
          activeCompositions.push(`${ori}_claim`);
        }
      }
    } else {
      activeCompositions = ["horizontal", "vertical", "symbol"];
    }

    for (let mIdx = 0; mIdx < config.media.length; mIdx++) {
      const medKey = config.media[mIdx];
      const medMeta = mediaLabels[medKey];

      // 1. Medium Category Page (e.g. /logo-tlac)
      const { page: medPage } = await ensurePage(
        { en: medMeta.en, sk: medMeta.sk, cs: medMeta.cs },
        medMeta.slug,
        rootLogoPage.id,
        "submenu",
        mIdx
      );
      mediaNodesForRootM04.push({ id: medPage.id, slug: medMeta.slug, title: { en: medMeta.en, sk: medMeta.sk, cs: medMeta.cs } });

      const compositionNodesForMedM04: Array<{ id: string; slug?: string; title: Record<string, string> }> = [];

      for (let cIdx = 0; cIdx < activeCompositions.length; cIdx++) {
        const compKey = activeCompositions[cIdx];
        const compMeta = compositionLabels[compKey] || {
          en: compKey,
          sk: compKey,
          cs: compKey,
          slugSuffix: compKey,
          syncBase: compKey,
        };
        const compSlug = `${medMeta.slug}-${compMeta.slugSuffix}`;

        // 2. Composition Page (e.g. /logo-tlac-sirka, /logo-tlac-sirka-claim, /logo-tlac-symbol)
        const { page: compPage } = await ensurePage(
          { en: `${compMeta.en} (${medMeta.en})`, sk: `${compMeta.sk} (${medMeta.sk})`, cs: `${compMeta.cs} (${medMeta.cs})` },
          compSlug,
          medPage.id,
          "submenu",
          cIdx
        );
        compositionNodesForMedM04.push({ id: compPage.id, slug: compSlug, title: { en: compMeta.en, sk: compMeta.sk, cs: compMeta.cs } });

        // Linked Sync ID for this composition & media
        const syncGroupId = `linkGroup-m08-${compMeta.syncBase}-${medKey}`;

        // 3. Direct 2 background leaves under each composition (Light Canvas, Dark Canvas)
        const leavesDirect: Array<{ id: string; slug?: string; title: Record<string, string> }> = [];
        for (const bg of ["light", "dark"] as const) {
          const isLight = bg === "light";
          const bgSlug = `${compSlug}-${isLight ? "svetle" : "tmave"}`;
          const bgTitle = {
            en: `${compMeta.en} - ${isLight ? "Light Canvas" : "Dark Canvas"}`,
            sk: `${compMeta.sk} - ${isLight ? "Svetlý podklad" : "Tmavý podklad"}`,
            cs: `${compMeta.cs} - ${isLight ? "Světlý podklad" : "Tmavý podklad"}`,
          };
          const { page: leafPage, isNew } = await ensurePage(bgTitle, bgSlug, compPage.id, "submenu", isLight ? 0 : 1);
          leavesDirect.push({ id: leafPage.id, slug: bgSlug, title: bgTitle });
          if (isNew) {
            await applyStructure(leafPage.id, logoBlueprintStructure, syncGroupId);
          }
        }

        // Inject M04 on the composition page pointing to light/dark backgrounds
        await injectCategoryM04(compPage.id, { en: "Background Canvas", sk: "Výber podkladu", cs: "Výběr podkladu" }, leavesDirect);
      }

      // Inject M04 for medium category page (linking to compositions)
      await injectCategoryM04(
        medPage.id,
        { en: `${brandName} - ${medMeta.en}`, sk: `${brandName} - ${medMeta.sk}`, cs: `${brandName} - ${medMeta.cs}` },
        compositionNodesForMedM04
      );
    }

    // Inject M04 for root /logo page (linking to media categories)
    await injectCategoryM04(
      rootLogoPage.id,
      { en: `${brandName} - Logo System`, sk: `${brandName} - Systém logotypu`, cs: `${brandName} - Systém logotypu` },
      mediaNodesForRootM04
    );

    // -------------------------------------------------------------------------
    // STEP D: Optional Core Identity Chapters (Farby & Typografia)
    // -------------------------------------------------------------------------
    if (config.includeColorsPage) {
      const { page: colorsPage, isNew } = await ensurePage(
        { en: "Colors & Palette", sk: "Farby a paleta", cs: "Barvy a paleta" },
        "farby",
        null,
        "main",
        globalOrder++
      );
      if (isNew) {
        await applyStructure(colorsPage.id, colorsBlueprintStructure);
      }
    }

    if (config.includeTypographyPage) {
      const { page: typoPage, isNew } = await ensurePage(
        { en: "Typography & Fonts", sk: "Typografia a písmo", cs: "Typografie a písmo" },
        "typografia",
        null,
        "main",
        globalOrder++
      );
      if (isNew) {
        await applyStructure(typoPage.id, typographyBlueprintStructure);
      }
    }

    revalidatePath(`/admin/brand/${brandId}/builder`);

    return {
      success: true,
      createdPagesCount,
      createdModulesCount,
      skippedPagesCount,
      firstPageId: firstCreatedPageId || existingPages[0]?.id,
    };
  } catch (err) {
    console.error("Error executing Dimension Matrix Engine:", err);
    return {
      success: false,
      createdPagesCount: 0,
      createdModulesCount: 0,
      skippedPagesCount: 0,
      error: err instanceof Error ? err.message : "Chyba pri generovaní stromu stránok.",
    };
  }
}
