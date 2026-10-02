"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import {
  PageTemplateItem,
  PageTemplateStructure,
  TemplateContainerItem,
} from "@/lib/types/template";
import {
  SavePageAsTemplateInput,
  savePageAsTemplateSchema,
} from "@/lib/validations/template";
import {
  ContainerLayoutType,
  Collections,
} from "@/types/pocketbase-types";
import { DEFAULT_SYSTEM_TEMPLATES } from "@/lib/constants/default-templates";

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
 * Ensures system templates are present in PocketBase
 */
export async function seedSystemTemplatesAction(): Promise<{ success: boolean; seededCount: number; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, seededCount: 0, error: "Unauthorized session." };
    }

    const existingSystemTemplates = await pb.collection("pageTemplates").getFullList({
      filter: "isSystem = true",
    });

    let seededCount = 0;
    for (const defaultTpl of DEFAULT_SYSTEM_TEMPLATES) {
      const alreadyExists = existingSystemTemplates.some(
        (t: any) => t.name?.en === defaultTpl.name.en || t.name?.sk === defaultTpl.name.sk
      );
      if (!alreadyExists) {
        await pb.collection("pageTemplates").create({
          user: null,
          isSystem: true,
          name: defaultTpl.name,
          description: defaultTpl.description,
          category: defaultTpl.category,
          structure: defaultTpl.structure,
        });
        seededCount++;
      }
    }

    return { success: true, seededCount };
  } catch (err) {
    console.error("Error seeding system templates:", err);
    return { success: false, seededCount: 0, error: err instanceof Error ? err.message : "Chyba pri inicializácii šablón." };
  }
}

/**
 * Fetches all available templates (system templates + current user's personal templates)
 */
export async function getPageTemplatesAction(): Promise<{
  success: boolean;
  templates: PageTemplateItem[];
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, templates: [], error: "Unauthorized session." };
    }

    // Auto-seed system templates if table is empty
    const systemCount = await pb.collection("pageTemplates").getList(1, 1, { filter: "isSystem = true" });
    if (systemCount.totalItems === 0) {
      await seedSystemTemplatesAction();
    }

    const records = await pb.collection("pageTemplates").getFullList({
      filter: `isSystem = true || user = "${user.id}"`,
      sort: "-isSystem,category,name",
    });

    const templates: PageTemplateItem[] = records.map((rec: any) => ({
      id: rec.id,
      user: rec.user || undefined,
      isSystem: !!rec.isSystem,
      name: typeof rec.name === "object" && rec.name !== null ? rec.name : { en: String(rec.name), sk: String(rec.name) },
      description: typeof rec.description === "object" && rec.description !== null ? rec.description : undefined,
      category: rec.category || "Všeobecné",
      structure: rec.structure || { containers: [] },
      created: rec.created,
      updated: rec.updated,
    }));

    return { success: true, templates };
  } catch (err) {
    console.error("Error fetching page templates:", err);
    return { success: false, templates: [], error: err instanceof Error ? err.message : "Chyba pri načítavaní šablón." };
  }
}

/**
 * Saves current page structure as a new personal template in `pageTemplates`
 */
export async function savePageAsTemplateAction(
  pageId: string,
  input: SavePageAsTemplateInput
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const validated = savePageAsTemplateSchema.parse(input);

    // 1. Fetch page and verify user access
    const pageRecord = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, pageRecord.brand, user.id);

    // 2. Fetch all containers for the page
    const containerRecords = await pb.collection("containers").getFullList({
      filter: `page = "${pageId}"`,
      sort: "order",
    });

    if (containerRecords.length === 0) {
      return { success: false, error: "Prázdnu stránku bez kontajnerov nie je možné uložiť ako šablónu." };
    }

    // 3. Serialize hierarchy into abstract snapshot (stripping DB IDs)
    const structureContainers: TemplateContainerItem[] = [];

    for (let cIdx = 0; cIdx < containerRecords.length; cIdx++) {
      const cRec = containerRecords[cIdx];
      const colRecords = await pb.collection("columns").getFullList({
        filter: `container = "${cRec.id}"`,
        sort: "order",
      });

      const templateCols = [];
      for (let colIdx = 0; colIdx < colRecords.length; colIdx++) {
        const colRec = colRecords[colIdx];
        const moduleRecords = await pb.collection("modules").getFullList({
          filter: `column = "${colRec.id}"`,
          sort: "order",
        });

        const templateModules = moduleRecords.map((mRec: any, mIdx: number) => ({
          order: mRec.order ?? mIdx,
          moduleType: mRec.moduleType,
          showH3: !!mRec.showH3,
          h3Title: typeof mRec.h3Title === "object" ? mRec.h3Title : undefined,
          config: typeof mRec.config === "object" ? mRec.config : {},
          linkGroupId: mRec.linkGroupId || undefined,
        }));

        templateCols.push({
          order: colRec.order ?? colIdx,
          modules: templateModules,
        });
      }

      structureContainers.push({
        order: cRec.order ?? cIdx,
        layoutType: cRec.layoutType as ContainerLayoutType,
        showH2: !!cRec.showH2,
        h2Title: typeof cRec.h2Title === "object" ? cRec.h2Title : undefined,
        columns: templateCols,
      });
    }

    const structure: PageTemplateStructure = {
      containers: structureContainers,
    };

    // 4. Save into pageTemplates
    const createdRecord = await pb.collection("pageTemplates").create({
      user: user.id,
      isSystem: false,
      name: validated.name,
      description: validated.description,
      category: validated.category,
      structure: structure,
    });

    return { success: true, templateId: createdRecord.id };
  } catch (err) {
    console.error("Error saving page as template:", err);
    return { success: false, error: err instanceof Error ? err.message : "Chyba pri ukladaní šablóny." };
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
 * Applies a template to an existing page (either replacing all content or appending to the bottom)
 */
export async function applyTemplateToPageAction(
  pageId: string,
  templateId: string,
  mode: "replace" | "append" = "replace"
): Promise<{ success: boolean; containersCount?: number; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    // 1. Fetch page and verify user access
    const pageRecord = await pb.collection("pages").getOne(pageId);
    const { brand } = await verifyBrandAccess(pb, pageRecord.brand, user.id);
    const brandName = brand.name || "Brand";

    // 2. Fetch template
    const templateRecord = await pb.collection("pageTemplates").getOne(templateId);
    const structure: PageTemplateStructure = templateRecord.structure;

    if (!structure || !Array.isArray(structure.containers) || structure.containers.length === 0) {
      return { success: false, error: "Zvolená šablóna neobsahuje žiadne kontajnery." };
    }

    // 3. Handle Replace vs Append
    let startingOrder = 0;
    if (mode === "replace") {
      // Find and delete all existing containers on this page
      const existingContainers = await pb.collection("containers").getFullList({
        filter: `page = "${pageId}"`,
      });

      for (const cont of existingContainers) {
        const columns = await pb.collection("columns").getFullList({
          filter: `container = "${cont.id}"`,
        });
        for (const col of columns) {
          const modules = await pb.collection("modules").getFullList({
            filter: `column = "${col.id}"`,
          });
          for (const m of modules) {
            await pb.collection("modules").delete(m.id);
          }
          await pb.collection("columns").delete(col.id);
        }
        await pb.collection("containers").delete(cont.id);
      }
    } else {
      // Append mode: calculate maximum existing order
      const existingContainers = await pb.collection("containers").getFullList({
        filter: `page = "${pageId}"`,
        sort: "-order",
      });
      if (existingContainers.length > 0) {
        startingOrder = (existingContainers[0].order ?? 0) + 1;
      }
    }

    // 4. Instantiate template into database
    let createdContainersCount = 0;

    for (let cIdx = 0; cIdx < structure.containers.length; cIdx++) {
      const tContainer = structure.containers[cIdx];
      const processedH2Title = tContainer.h2Title
        ? replaceBrandTokens(tContainer.h2Title, brandName)
        : null;

      const createdContainer = await pb.collection("containers").create({
        page: pageId,
        order: startingOrder + (tContainer.order ?? cIdx),
        layoutType: tContainer.layoutType || "FULL",
        showH2: !!tContainer.showH2,
        h2Title: processedH2Title,
      });

      createdContainersCount++;

      // Create Columns
      const columnsList = tContainer.columns || [{ order: 0, modules: [] }];
      for (let colIdx = 0; colIdx < columnsList.length; colIdx++) {
        const tCol = columnsList[colIdx];
        const createdColumn = await pb.collection("columns").create({
          container: createdContainer.id,
          order: tCol.order ?? colIdx,
        });

        // Create Modules
        if (Array.isArray(tCol.modules)) {
          for (let mIdx = 0; mIdx < tCol.modules.length; mIdx++) {
            const tModule = tCol.modules[mIdx];
            const processedH3Title = tModule.h3Title
              ? replaceBrandTokens(tModule.h3Title, brandName)
              : null;
            const processedConfig = tModule.config
              ? replaceBrandTokens(tModule.config, brandName)
              : {};

            await pb.collection("modules").create({
              column: createdColumn.id,
              order: tModule.order ?? mIdx,
              moduleType: tModule.moduleType,
              showH3: !!tModule.showH3,
              h3Title: processedH3Title,
              config: processedConfig,
              linkGroupId: tModule.linkGroupId || "",
            });
          }
        }
      }
    }

    revalidatePath(`/admin/brand/${pageRecord.brand}/builder/${pageId}`);
    return { success: true, containersCount: createdContainersCount };
  } catch (err) {
    console.error("Error applying template to page:", err);
    return { success: false, error: err instanceof Error ? err.message : "Chyba pri aplikovaní šablóny." };
  }
}

/**
 * Deletes a personal template (system templates are protected)
 */
export async function deletePageTemplateAction(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const tpl = await pb.collection("pageTemplates").getOne(templateId);
    if (tpl.isSystem) {
      return { success: false, error: "Systémové šablóny nie je možné vymazať." };
    }

    if (tpl.user !== user.id) {
      return { success: false, error: "Môžete mazať iba vlastné uložené šablóny." };
    }

    await pb.collection("pageTemplates").delete(templateId);
    return { success: true };
  } catch (err) {
    console.error("Error deleting template:", err);
    return { success: false, error: err instanceof Error ? err.message : "Chyba pri odstraňovaní šablóny." };
  }
}
