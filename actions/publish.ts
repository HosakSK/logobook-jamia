"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";

export interface PublishedModuleItem {
  id: string;
  moduleType: string;
  order: number;
  showH3?: boolean;
  h3Title?: Record<string, string>;
  config: Record<string, unknown>;
  linkGroupId?: string; // Informative only pre debug (renderer linkGroupId ignoruje)
}

export interface PublishedColumnItem {
  id: string;
  order: number;
  backgroundColor?: string;
  modules: PublishedModuleItem[];
}

export interface PublishedContainerItem {
  id: string;
  order: number;
  layoutType: string;
  columnCount: number;
  columnWidths?: number[];
  showH2?: boolean;
  h2Title?: Record<string, string>;
  backgroundColor?: string;
  heightMode?: string;
  fixedHeight?: number;
  columns: PublishedColumnItem[];
}

export interface PublishedPageItem {
  id: string;
  slug: string;
  title: Record<string, string>;
  parent?: string;
  isInMenu: boolean;
  menuStyle: string;
  order: number;
  templateId?: string;
  containers: PublishedContainerItem[];
}

export interface PublishedBrandSnapshot {
  brandId: string;
  publishedAt: string;
  version: number;
  brand: {
    id: string;
    name: string;
    slug: string;
    customDomain?: string;
    description?: Record<string, string>;
    defaultLocale?: string;
    enabledLocales?: string[];
    headerLogo?: string;
    headerLogoUrl?: string;
    headerLogoHeight?: number;
    showHeaderBrandName?: boolean;
    favicon?: string;
    hideLogobookBadge?: boolean;
  };
  pages: PublishedPageItem[];
}

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
      throw new Error("Čitatelia (VIEWER) nemajú oprávnenie publikovať zmeny manuálu.");
    }
    return { brand, role: tm.role };
  } catch {
    throw new Error("Nemáte prístup k tomuto brand projektu.");
  }
}

/**
 * 16.01 Server Action: publishBrandAction
 * 
 * Zostaví kompletný hierarchický strom Draft dát (pages -> containers -> columns -> modules)
 * do jedného atomického JSON snapshotu a uloží ho do poľa publishedConfig v kolekcii brands.
 * Prepne status brandu na 'LIVE' a invaliduje Next.js cache.
 */
export async function publishBrandAction(brandId: string): Promise<{
  success: boolean;
  publishedAt?: string;
  version?: number;
  pagesCount?: number;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const { brand } = await verifyBrandAccess(pb, brandId, user.id);

    // 1. Fetch all brand pages (sorted by order)
    const pageRecords = await pb.collection("pages").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order",
    });

    if (pageRecords.length === 0) {
      return {
        success: false,
        error: "Manuál neobsahuje žiadne stránky. Najprv vytvorte aspoň jednu stránku.",
      };
    }

    // 2. Fetch containers, columns, and modules for each page
    const publishedPages: PublishedPageItem[] = [];

    for (const pageRec of pageRecords) {
      // Parse page title
      let parsedTitle: Record<string, string> = { en: "Untitled", sk: "Bez názvu" };
      if (typeof pageRec.title === "object" && pageRec.title !== null) {
        parsedTitle = pageRec.title;
      } else if (typeof pageRec.title === "string") {
        try {
          parsedTitle = JSON.parse(pageRec.title);
        } catch {
          parsedTitle = { en: pageRec.title, sk: pageRec.title };
        }
      }

      // Fetch containers
      const containerRecords = await pb.collection("containers").getFullList({
        filter: `page = "${pageRec.id}"`,
        sort: "order",
      });

      const publishedContainers: PublishedContainerItem[] = [];

      for (const cRec of containerRecords) {
        // Fetch columns
        const colRecords = await pb.collection("columns").getFullList({
          filter: `container = "${cRec.id}"`,
          sort: "order",
        });

        const publishedColumns: PublishedColumnItem[] = [];

        for (const colRec of colRecords) {
          // Fetch modules
          const modRecords = await pb.collection("modules").getFullList({
            filter: `column = "${colRec.id}"`,
            sort: "order",
          });

          const publishedModules: PublishedModuleItem[] = modRecords.map((m: any) => {
            let h3Title = m.h3Title;
            if (typeof h3Title === "string") {
              try {
                h3Title = JSON.parse(h3Title);
              } catch {
                h3Title = { en: h3Title, sk: h3Title };
              }
            }

            let config = m.config || {};
            if (typeof config === "string") {
              try {
                config = JSON.parse(config);
              } catch {
                config = {};
              }
            }

            return {
              id: m.id,
              moduleType: m.moduleType,
              order: m.order ?? 0,
              showH3: m.showH3 ?? true,
              h3Title: typeof h3Title === "object" ? h3Title : undefined,
              config,
              linkGroupId: m.linkGroupId || undefined, // Serializované len pre prípadný debug
            };
          });

          publishedColumns.push({
            id: colRec.id,
            order: colRec.order ?? 0,
            backgroundColor: colRec.backgroundColor || undefined,
            modules: publishedModules,
          });
        }

        let h2Title = cRec.h2Title;
        if (typeof h2Title === "string") {
          try {
            h2Title = JSON.parse(h2Title);
          } catch {
            h2Title = { en: h2Title, sk: h2Title };
          }
        }

        publishedContainers.push({
          id: cRec.id,
          order: cRec.order ?? 0,
          layoutType: cRec.layoutType || "FULL",
          columnCount: cRec.columnCount ?? publishedColumns.length,
          columnWidths: cRec.columnWidths || [],
          showH2: cRec.showH2 ?? false,
          h2Title: typeof h2Title === "object" ? h2Title : undefined,
          backgroundColor: cRec.backgroundColor || undefined,
          heightMode: cRec.heightMode || "AUTO",
          fixedHeight: cRec.fixedHeight,
          columns: publishedColumns,
        });
      }

      publishedPages.push({
        id: pageRec.id,
        slug: pageRec.slug,
        title: parsedTitle,
        parent: pageRec.parent || undefined,
        isInMenu: pageRec.isInMenu ?? true,
        menuStyle: pageRec.menuStyle || "main",
        order: pageRec.order ?? 0,
        templateId: pageRec.templateId || undefined,
        containers: publishedContainers,
      });
    }

    // 3. Assemble atomic snapshot
    const currentVersion =
      brand.publishedConfig && typeof (brand.publishedConfig as any).version === "number"
        ? (brand.publishedConfig as any).version
        : 0;
    const nextVersion = currentVersion + 1;
    const publishedAt = new Date().toISOString();

    // Resolve headerLogoUrl for snapshot
    let snapshotHeaderLogoUrl: string | undefined = undefined;
    if (brand.headerLogo) {
      if (typeof brand.headerLogo === "string" && (brand.headerLogo.startsWith("http://") || brand.headerLogo.startsWith("https://") || brand.headerLogo.startsWith("/"))) {
        snapshotHeaderLogoUrl = brand.headerLogo;
      } else {
        try {
          const mediaRec = await pb.collection("mediaAssets").getOne(brand.headerLogo);
          if (mediaRec && mediaRec.file) {
            snapshotHeaderLogoUrl = pb.files.getURL(mediaRec, mediaRec.file);
          }
        } catch {
          try {
            const assetRec = await pb.collection("assets").getOne(brand.headerLogo);
            if (assetRec && assetRec.preview) {
              snapshotHeaderLogoUrl = pb.files.getURL(assetRec, assetRec.preview);
            }
          } catch {
            // not found
          }
        }
      }
    }

    if (!snapshotHeaderLogoUrl && typeof brand.description === "object" && brand.description?.headerLogoUrl) {
      snapshotHeaderLogoUrl = brand.description.headerLogoUrl;
    }

    if (!snapshotHeaderLogoUrl) {
      try {
        const firstAsset = await pb.collection("assets").getFirstListItem(
          `brand = "${brand.id}" && preview != ""`,
          { sort: "order" }
        );
        if (firstAsset && firstAsset.preview) {
          snapshotHeaderLogoUrl = pb.files.getURL(firstAsset, firstAsset.preview);
        }
      } catch {
        // no assets
      }
    }

    const snapshot: PublishedBrandSnapshot = {
      brandId: brand.id,
      publishedAt,
      version: nextVersion,
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        customDomain: brand.customDomain || undefined,
        description: typeof brand.description === "object" ? brand.description : undefined,
        defaultLocale: brand.defaultLocale || "en",
        enabledLocales: brand.enabledLocales || ["en", "sk", "cs"],
        headerLogo: brand.headerLogo || undefined,
        headerLogoUrl: snapshotHeaderLogoUrl,
        headerLogoHeight: typeof brand.description === "object" && typeof brand.description?.headerLogoHeight === "number"
          ? brand.description.headerLogoHeight
          : 40,
        showHeaderBrandName: typeof brand.description === "object" && typeof brand.description?.showHeaderBrandName === "boolean"
          ? brand.description.showHeaderBrandName
          : true,
        favicon: brand.favicon || undefined,
        hideLogobookBadge: brand.hideLogobookBadge || false,
      },
      pages: publishedPages,
    };

    // 4. Atomic Replace update into brands.publishedConfig + status LIVE
    await pb.collection("brands").update(brandId, {
      publishedConfig: snapshot,
      status: "LIVE",
    });

    // 5. Revalidate cache
    revalidatePath(`/admin/brand/${brandId}/builder`);
    revalidatePath(`/admin/brand/${brandId}/integrations`);
    revalidatePath(`/manual/${brand.slug}`);
    revalidatePath(`/m/${brand.slug}`);
    revalidatePath(`/api/brand/${brand.slug}/theme.css`);
    revalidatePath(`/api/brand/${brand.slug}/tokens.json`);
    if (brand.customDomain) {
      revalidatePath(`/manual/${brand.customDomain}`);
      revalidatePath(`/m/${brand.customDomain}`);
      revalidatePath(`/api/brand/${brand.customDomain}/theme.css`);
      revalidatePath(`/api/brand/${brand.customDomain}/tokens.json`);
    }

    return {
      success: true,
      publishedAt,
      version: nextVersion,
      pagesCount: publishedPages.length,
    };
  } catch (err: unknown) {
    console.error("Failed to publish brand snapshot:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri publikovaní brand manuálu",
    };
  }
}

/**
 * Získa stav publikovania brandu z jeho publishedConfig
 */
export async function getBrandPublishStatusAction(brandId: string): Promise<{
  success: boolean;
  status: "NEVER_PUBLISHED" | "PUBLISHED";
  publishedAt?: string;
  version?: number;
  pagesCount?: number;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    const brand = await pb.collection("brands").getOne(brandId);
    const pubConfig = brand.publishedConfig as PublishedBrandSnapshot | undefined;

    if (!pubConfig || !pubConfig.publishedAt || !pubConfig.pages || pubConfig.pages.length === 0) {
      return {
        success: true,
        status: "NEVER_PUBLISHED",
      };
    }

    return {
      success: true,
      status: "PUBLISHED",
      publishedAt: pubConfig.publishedAt,
      version: pubConfig.version || 1,
      pagesCount: pubConfig.pages.length,
    };
  } catch (err: unknown) {
    return {
      success: false,
      status: "NEVER_PUBLISHED",
      error: err instanceof Error ? err.message : "Chyba pri zisťovaní stavu publikovania",
    };
  }
}

/**
 * Získa kompletný publikovaný snapshot brandu (pre offline ZIP export a integrácie)
 */
export async function getBrandPublishedSnapshotAction(brandId: string): Promise<{
  success: boolean;
  snapshot: PublishedBrandSnapshot | null;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    const brand = await pb.collection("brands").getOne(brandId);
    const pubConfig = (brand.publishedConfig as PublishedBrandSnapshot) || null;

    return {
      success: true,
      snapshot: pubConfig,
    };
  } catch (err: unknown) {
    return {
      success: false,
      snapshot: null,
      error: err instanceof Error ? err.message : "Nepodarilo sa načítať publikovaný snapshot.",
    };
  }
}

