"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import {
  PageItem,
  PageHierarchyItem,
  PageDetail,
  CreatePageInput,
  UpdatePageInput,
  ContainerWithColumns,
  ColumnWithModules,
} from "@/lib/types/page";
import {
  createPageSchema,
  updatePageSchema,
} from "@/lib/validations/page";
import {
  ContainerLayoutType,
  PageMenuStyle,
  PagesRecord,
  ContainersRecord,
  ColumnsRecord,
  ModulesRecord,
  Collections,
} from "@/types/pocketbase-types";

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
 * Fetches all pages for a brand and structures them into a parent-child hierarchy tree.
 */
export async function getBrandPagesAction(brandId: string): Promise<{
  success: boolean;
  pages: PageItem[];
  tree: PageHierarchyItem[];
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, pages: [], tree: [], error: "Unauthorized session." };
    }

    const records = await pb.collection("pages").getFullList({
      filter: `brand = "${brandId}"`,
      sort: "order,created",
    });

    const pages: PageItem[] = records.map((rec: any) => {
      let parsedTitle: Record<string, string> = { en: "Untitled", sk: "Bez názvu" };
      if (typeof rec.title === "object" && rec.title !== null) {
        parsedTitle = rec.title;
      } else if (typeof rec.title === "string") {
        try {
          parsedTitle = JSON.parse(rec.title);
        } catch {
          parsedTitle = { en: rec.title, sk: rec.title };
        }
      }

      return {
        id: rec.id,
        brand: rec.brand,
        parent: rec.parent || undefined,
        title: parsedTitle,
        slug: rec.slug,
        isInMenu: rec.isInMenu ?? true,
        menuStyle: (rec.menuStyle as PageMenuStyle) || "main",
        order: rec.order ?? 0,
        templateId: rec.templateId || undefined,
        created: rec.created,
        updated: rec.updated,
        collectionId: rec.collectionId,
        collectionName: rec.collectionName as Collections,
      };
    });

    // Build hierarchical tree
    const rootNodes: PageHierarchyItem[] = [];
    const childrenMap = new Map<string, PageHierarchyItem[]>();

    pages.forEach((p) => {
      const node: PageHierarchyItem = { ...p, children: [] };
      if (!p.parent) {
        rootNodes.push(node);
      } else {
        if (!childrenMap.has(p.parent)) {
          childrenMap.set(p.parent, []);
        }
        childrenMap.get(p.parent)!.push(node);
      }
    });

    // Attach children to roots
    rootNodes.forEach((root) => {
      if (childrenMap.has(root.id)) {
        root.children = childrenMap.get(root.id);
      }
    });

    return {
      success: true,
      pages,
      tree: rootNodes,
    };
  } catch (err: unknown) {
    console.error("Failed to load brand pages:", err);
    return {
      success: false,
      pages: [],
      tree: [],
      error: err instanceof Error ? err.message : "Chyba pri načítaní stránok",
    };
  }
}

/**
 * Fetches full details for a single page including containers, columns, and modules.
 */
export async function getPageDetailAction(pageId: string): Promise<{
  success: boolean;
  page?: PageDetail;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    if (!pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const pageRecord = await pb.collection("pages").getOne(pageId);
    let parsedTitle: Record<string, string> = { en: "Untitled", sk: "Bez názvu" };
    if (typeof pageRecord.title === "object" && pageRecord.title !== null) {
      parsedTitle = pageRecord.title;
    } else if (typeof pageRecord.title === "string") {
      try {
        parsedTitle = JSON.parse(pageRecord.title);
      } catch {
        parsedTitle = { en: pageRecord.title, sk: pageRecord.title };
      }
    }

    // 1. Fetch containers for page
    const containerRecords = await pb.collection("containers").getFullList({
      filter: `page = "${pageId}"`,
      sort: "order,created",
    });

    // 2. Fetch columns for each container
    const containers: ContainerWithColumns[] = await Promise.all(
      containerRecords.map(async (cRec: any) => {
        const colRecords = await pb.collection("columns").getFullList({
          filter: `container = "${cRec.id}"`,
          sort: "order,created",
        });

        // 3. Fetch modules for each column
        const columns: ColumnWithModules[] = await Promise.all(
          colRecords.map(async (colRec: any) => {
            const modRecords = await pb.collection("modules").getFullList({
              filter: `column = "${colRec.id}"`,
              sort: "order,created",
            });

            const modules = modRecords.map((m: any) => {
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
                column: m.column,
                moduleType: m.moduleType,
                order: m.order ?? 0,
                showH3: m.showH3 ?? true,
                h3Title,
                config,
                linkGroupId: m.linkGroupId || undefined,
                created: m.created,
                updated: m.updated,
                collectionId: m.collectionId,
                collectionName: m.collectionName,
              };
            });

            return {
              id: colRec.id,
              container: colRec.container,
              order: colRec.order ?? 0,
              backgroundColor: colRec.backgroundColor || undefined,
              created: colRec.created,
              updated: colRec.updated,
              collectionId: colRec.collectionId,
              collectionName: colRec.collectionName,
              modules,
            };
          })
        );

        return {
          id: cRec.id,
          page: cRec.page,
          order: cRec.order ?? 0,
          layoutType: (cRec.layoutType as ContainerLayoutType) || "FULL",
          columnCount: cRec.columnCount ?? columns.length,
          columnWidths: cRec.columnWidths || [],
          showH2: cRec.showH2 ?? false,
          h2Title: cRec.h2Title || {},
          backgroundColor: cRec.backgroundColor || undefined,
          heightMode: cRec.heightMode || "AUTO",
          fixedHeight: cRec.fixedHeight,
          created: cRec.created,
          updated: cRec.updated,
          collectionId: cRec.collectionId,
          collectionName: cRec.collectionName,
          columns,
        };
      })
    );

    const page: PageDetail = {
      id: pageRecord.id,
      brand: pageRecord.brand,
      parent: pageRecord.parent || undefined,
      title: parsedTitle,
      slug: pageRecord.slug,
      isInMenu: pageRecord.isInMenu ?? true,
      menuStyle: (pageRecord.menuStyle as PageMenuStyle) || "main",
      order: pageRecord.order ?? 0,
      templateId: pageRecord.templateId || undefined,
      created: pageRecord.created,
      updated: pageRecord.updated,
      collectionId: pageRecord.collectionId,
      collectionName: pageRecord.collectionName as Collections,
      containers,
    };

    return {
      success: true,
      page,
    };
  } catch (err: unknown) {
    console.error("Failed to load page details:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri načítaní podrobností stránky",
    };
  }
}

/**
 * Creates a new page under a brand, and initializes it with a default container and column.
 */
export async function createPageAction(
  brandId: string,
  input: CreatePageInput
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await verifyBrandAccess(pb, brandId, user.id);

    const parsed = createPageSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Neplatné vstupné dáta" };
    }

    // Check slug uniqueness within brand
    const cleanSlug = parsed.data.slug.toLowerCase().trim();
    try {
      const existing = await pb.collection("pages").getFirstListItem(
        `brand = "${brandId}" && slug = "${cleanSlug}"`
      );
      if (existing) {
        return { success: false, error: `Stránka so slugom "${cleanSlug}" už v tomto manuáli existuje.` };
      }
    } catch {
      // Slug is available
    }

    // Determine next order
    let nextOrder = 0;
    try {
      const last = await pb.collection("pages").getFirstListItem(
        `brand = "${brandId}"`,
        { sort: "-order" }
      );
      if (last && typeof last.order === "number") {
        nextOrder = last.order + 1;
      }
    } catch {
      // First page
    }

    let titlePayload: Record<string, string> = {};
    if (typeof parsed.data.title === "string") {
      titlePayload = { sk: parsed.data.title, en: parsed.data.title };
    } else {
      titlePayload = parsed.data.title;
    }

    // 1. Create page
    const page = await pb.collection("pages").create({
      brand: brandId,
      parent: parsed.data.parentId || null,
      title: titlePayload,
      slug: cleanSlug,
      isInMenu: parsed.data.isInMenu,
      menuStyle: parsed.data.menuStyle,
      order: nextOrder,
    });

    // 2. Automatically initialize with 1 default Full container + 1 column
    const container = await pb.collection("containers").create({
      page: page.id,
      order: 0,
      layoutType: "FULL",
      columnCount: 1,
      showH2: false,
    });

    await pb.collection("columns").create({
      container: container.id,
      order: 0,
    });

    revalidatePath(`/admin/brand/${brandId}/builder`);
    return { success: true, pageId: page.id };
  } catch (err: unknown) {
    console.error("Failed to create page:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri vytváraní stránky",
    };
  }
}

/**
 * Seeds a comprehensive starter structure (Úvod, Logo, Farby, Typografia) for a brand.
 */
export async function seedInitialBrandPagesAction(
  brandId: string
): Promise<{ success: boolean; firstPageId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await verifyBrandAccess(pb, brandId, user.id);

    const starterPages = [
      {
        title: { sk: "Úvod a Poslanie", en: "Overview & Mission" },
        slug: "uvod",
        order: 0,
        moduleType: "M03_Banner",
        h3Title: { sk: "Oficiálna Vizuálna Identita", en: "Official Visual Identity" },
        config: {
          styleOverrides: { radiusMode: "rounded", customRadiusPx: 3 },
          title: { sk: "Vitajte v našom digitálnom brand manuáli", en: "Welcome to our brand guidelines" },
          subtitle: { sk: "Centrálny zdroj pravdy pre grafiku a dizajn", en: "Central source of truth for all brand assets" },
        },
      },
      {
        title: { sk: "Logotyp a Symbol", en: "Logo & Symbol" },
        slug: "logo",
        order: 1,
        moduleType: "M07_ZobrazenieLoga",
        h3Title: { sk: "Základný variant loga", en: "Primary logo variant" },
        config: {},
      },
      {
        title: { sk: "Farebná Paleta", en: "Color Palette" },
        slug: "farby",
        order: 2,
        moduleType: "M13_PaletaFarieb",
        h3Title: { sk: "Systém firemných farieb", en: "Corporate color system" },
        config: {},
      },
      {
        title: { sk: "Typografia", en: "Typography" },
        slug: "typografia",
        order: 3,
        moduleType: "M18_Typografia",
        h3Title: { sk: "Typografická hierarchia a písma", en: "Typography hierarchy and fonts" },
        config: {},
      },
    ];

    let firstPageId: string | undefined;

    for (const pData of starterPages) {
      // Create Page
      const page = await pb.collection("pages").create({
        brand: brandId,
        title: pData.title,
        slug: pData.slug,
        order: pData.order,
        isInMenu: true,
        menuStyle: "main",
      });

      if (!firstPageId) firstPageId = page.id;

      // Create Container
      const container = await pb.collection("containers").create({
        page: page.id,
        order: 0,
        layoutType: "FULL",
        columnCount: 1,
        showH2: false,
      });

      // Create Column
      const column = await pb.collection("columns").create({
        container: container.id,
        order: 0,
      });

      // Create Initial Module
      await pb.collection("modules").create({
        column: column.id,
        moduleType: pData.moduleType,
        order: 0,
        showH3: true,
        h3Title: pData.h3Title,
        config: pData.config,
      });
    }

    revalidatePath(`/admin/brand/${brandId}/builder`);
    return { success: true, firstPageId };
  } catch (err: unknown) {
    console.error("Failed to seed starter pages:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri vytváraní počiatočných stránok",
    };
  }
}

/**
 * Updates page attributes (title, slug, menu visibility, etc.).
 */
export async function updatePageAction(
  pageId: string,
  input: UpdatePageInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const page = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, page.brand, user.id);

    const parsed = updatePageSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Neplatné vstupné dáta" };
    }

    const payload: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) {
      if (typeof parsed.data.title === "string") {
        const existingTitle = typeof page.title === "object" ? page.title : {};
        payload.title = { ...existingTitle, sk: parsed.data.title, en: parsed.data.title };
      } else {
        payload.title = parsed.data.title;
      }
    }

    if (parsed.data.slug !== undefined) {
      const cleanSlug = parsed.data.slug.toLowerCase().trim();
      if (cleanSlug !== page.slug) {
        try {
          const duplicate = await pb.collection("pages").getFirstListItem(
            `brand = "${page.brand}" && slug = "${cleanSlug}" && id != "${pageId}"`
          );
          if (duplicate) {
            return { success: false, error: "Stránka so zadaným slugom už existuje." };
          }
        } catch {
          // Available
        }
        payload.slug = cleanSlug;
      }
    }

    if (parsed.data.isInMenu !== undefined) payload.isInMenu = parsed.data.isInMenu;
    if (parsed.data.menuStyle !== undefined) payload.menuStyle = parsed.data.menuStyle;
    if (parsed.data.order !== undefined) payload.order = parsed.data.order;
    if (parsed.data.parentId !== undefined) payload.parent = parsed.data.parentId;

    await pb.collection("pages").update(pageId, payload);

    revalidatePath(`/admin/brand/${page.brand}/builder`);
    revalidatePath(`/admin/brand/${page.brand}/builder/${pageId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update page:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri aktualizácii stránky",
    };
  }
}

/**
 * Recursively deletes a page, its child subpages, containers, columns, and modules (Cascade delete).
 */
export async function deletePageAction(
  pageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const page = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, page.brand, user.id);

    // Recursive helper to delete a page and its full tree
    async function cascadeDeletePage(pId: string) {
      // 1. Find child sub-pages
      const children = await pb.collection("pages").getFullList({
        filter: `parent = "${pId}"`,
      });
      for (const child of children) {
        await cascadeDeletePage(child.id);
      }

      // 2. Find containers
      const containers = await pb.collection("containers").getFullList({
        filter: `page = "${pId}"`,
      });
      for (const container of containers) {
        // 3. Find columns
        const columns = await pb.collection("columns").getFullList({
          filter: `container = "${container.id}"`,
        });
        for (const col of columns) {
          // 4. Find modules
          const modules = await pb.collection("modules").getFullList({
            filter: `column = "${col.id}"`,
          });
          for (const m of modules) {
            await pb.collection("modules").delete(m.id);
          }
          await pb.collection("columns").delete(col.id);
        }
        await pb.collection("containers").delete(container.id);
      }

      // 5. Delete page itself
      await pb.collection("pages").delete(pId);
    }

    await cascadeDeletePage(pageId);

    revalidatePath(`/admin/brand/${page.brand}/builder`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete page:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmazaní stránky",
    };
  }
}

/**
 * Creates a new container row inside a page and spawns the appropriate number of columns.
 */
export async function createContainerAction(
  pageId: string,
  layoutType: ContainerLayoutType = "FULL"
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const page = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, page.brand, user.id);

    // Determine column count from layoutType
    let columnCount = 1;
    switch (layoutType) {
      case "HALF_HALF":
      case "ONE_THIRD_TWO_THIRDS":
      case "TWO_THIRDS_ONE_THIRD":
      case "CUSTOM":
        columnCount = 2;
        break;
      case "THREE_EQUAL":
        columnCount = 3;
        break;
      case "FULL":
      default:
        columnCount = 1;
        break;
    }

    // Determine next order
    let nextOrder = 0;
    try {
      const last = await pb.collection("containers").getFirstListItem(
        `page = "${pageId}"`,
        { sort: "-order" }
      );
      if (last && typeof last.order === "number") {
        nextOrder = last.order + 1;
      }
    } catch {
      // First container
    }

    const container = await pb.collection("containers").create({
      page: pageId,
      order: nextOrder,
      layoutType,
      columnCount,
      showH2: false,
    });

    // Create child columns
    for (let i = 0; i < columnCount; i++) {
      await pb.collection("columns").create({
        container: container.id,
        order: i,
      });
    }

    revalidatePath(`/admin/brand/${page.brand}/builder/${pageId}`);
    return { success: true, containerId: container.id };
  } catch (err: unknown) {
    console.error("Failed to create container:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri vytváraní kontajnera",
    };
  }
}

/**
 * Deletes a container, its columns, and all modules within.
 */
export async function deleteContainerAction(
  containerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const container = await pb.collection("containers").getOne(containerId);
    const page = await pb.collection("pages").getOne(container.page);
    await verifyBrandAccess(pb, page.brand, user.id);

    const columns = await pb.collection("columns").getFullList({
      filter: `container = "${containerId}"`,
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

    await pb.collection("containers").delete(containerId);

    revalidatePath(`/admin/brand/${page.brand}/builder/${page.id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete container:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmazaní riadku",
    };
  }
}

/**
 * Adds a new module of a given type to a column.
 */
export async function createModuleAction(
  columnId: string,
  moduleType: string,
  initialConfig: Record<string, unknown> = {}
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    // Determine next order
    let nextOrder = 0;
    try {
      const last = await pb.collection("modules").getFirstListItem(
        `column = "${columnId}"`,
        { sort: "-order" }
      );
      if (last && typeof last.order === "number") {
        nextOrder = last.order + 1;
      }
    } catch {
      // First module
    }

    const mod = await pb.collection("modules").create({
      column: columnId,
      moduleType,
      order: nextOrder,
      showH3: true,
      h3Title: { sk: moduleType.replace("_", " "), en: moduleType.replace("_", " ") },
      config: initialConfig,
    });

    return { success: true, moduleId: mod.id };
  } catch (err: unknown) {
    console.error("Failed to create module:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri pridávaní modulu",
    };
  }
}

/**
 * Updates a module's JSON config.
 */
export async function updateModuleConfigAction(
  moduleId: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await pb.collection("modules").update(moduleId, { config });
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update module config:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri ukladaní konfigurácie modulu",
    };
  }
}

/**
 * Deletes a single module.
 */
export async function deleteModuleAction(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await pb.collection("modules").delete(moduleId);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to delete module:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmazaní modulu",
    };
  }
}
