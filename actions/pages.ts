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
import { I18nRecord } from "@/lib/types/module";
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
      sort: "order",
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
      sort: "order",
    });

    // 2. Fetch columns for each container
    const containers: ContainerWithColumns[] = await Promise.all(
      containerRecords.map(async (cRec: any) => {
        const colRecords = await pb.collection("columns").getFullList({
          filter: `container = "${cRec.id}"`,
          sort: "order",
        });

        // 3. Fetch modules for each column
        const columns: ColumnWithModules[] = await Promise.all(
          colRecords.map(async (colRec: any) => {
            const modRecords = await pb.collection("modules").getFullList({
              filter: `column = "${colRec.id}"`,
              sort: "order",
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
 * Updates a container's layoutType and adjusts columns accordingly.
 * Choice A: If column count is reduced, modules from removed columns are
 * safely moved to the end of the last remaining column.
 */
export async function updateContainerLayoutAction(
  containerId: string,
  newLayoutType: ContainerLayoutType
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

    let targetCount = 1;
    switch (newLayoutType) {
      case "HALF_HALF":
      case "ONE_THIRD_TWO_THIRDS":
      case "TWO_THIRDS_ONE_THIRD":
      case "CUSTOM":
        targetCount = 2;
        break;
      case "THREE_EQUAL":
        targetCount = 3;
        break;
      case "FULL":
      default:
        targetCount = 1;
        break;
    }

    // Get existing columns
    const columns = await pb.collection("columns").getFullList({
      filter: `container = "${containerId}"`,
      sort: "order",
    });

    if (columns.length < targetCount) {
      // Create missing columns
      for (let i = columns.length; i < targetCount; i++) {
        await pb.collection("columns").create({
          container: containerId,
          order: i,
        });
      }
    } else if (columns.length > targetCount) {
      // Kept columns and removed columns
      const keptColumns = columns.slice(0, targetCount);
      const columnsToRemove = columns.slice(targetCount);
      const lastKeptCol = keptColumns[keptColumns.length - 1];

      // Find max order in last kept column
      const existingInLast = await pb.collection("modules").getFullList({
        filter: `column = "${lastKeptCol.id}"`,
        sort: "-order",
      });
      let nextOrder = existingInLast.length > 0 ? (existingInLast[0].order ?? 0) + 1 : 0;

      // Move modules from removed columns to last kept column (Choice A)
      for (const col of columnsToRemove) {
        const modules = await pb.collection("modules").getFullList({
          filter: `column = "${col.id}"`,
          sort: "order",
        });

        for (const mod of modules) {
          await pb.collection("modules").update(mod.id, {
            column: lastKeptCol.id,
            order: nextOrder++,
          });
        }

        // Delete the emptied column
        await pb.collection("columns").delete(col.id);
      }
    }

    // Update container layoutType and columnCount
    await pb.collection("containers").update(containerId, {
      layoutType: newLayoutType,
      columnCount: targetCount,
    });

    revalidatePath(`/admin/brand/${page.brand}/builder/${page.id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update container layout:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmene rozloženia riadku",
    };
  }
}

/**
 * Updates container metadata (showH2, h2Title, backgroundColor, etc.).
 */
export async function updateContainerAction(
  containerId: string,
  data: {
    showH2?: boolean;
    h2Title?: string | I18nRecord;
    backgroundColor?: string;
    layoutType?: ContainerLayoutType;
    columnWidths?: number[];
  }
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

    const payload: Record<string, unknown> = {};
    if (data.showH2 !== undefined) payload.showH2 = data.showH2;
    if (data.backgroundColor !== undefined) payload.backgroundColor = data.backgroundColor;
    if (data.columnWidths !== undefined) payload.columnWidths = data.columnWidths;
    if (data.layoutType !== undefined) payload.layoutType = data.layoutType;

    if (data.h2Title !== undefined) {
      if (typeof data.h2Title === "string") {
        const existing = typeof container.h2Title === "object" ? container.h2Title : {};
        payload.h2Title = { ...existing, sk: data.h2Title, en: data.h2Title };
      } else {
        payload.h2Title = data.h2Title;
      }
    }

    await pb.collection("containers").update(containerId, payload);
    revalidatePath(`/admin/brand/${page.brand}/builder/${page.id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update container:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri úprave riadku",
    };
  }
}

/**
 * Swaps order of a container with its adjacent sibling (up or down).
 */
export async function moveContainerAction(
  containerId: string,
  direction: "up" | "down"
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

    const siblings = await pb.collection("containers").getFullList({
      filter: `page = "${page.id}"`,
      sort: "order",
    });

    const currentIndex = siblings.findIndex((c) => c.id === containerId);
    if (currentIndex === -1) return { success: false, error: "Kontajner nenájdený." };

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      return { success: true }; // already at boundary
    }

    const currentOrder = siblings[currentIndex].order ?? currentIndex;
    const targetOrder = siblings[targetIndex].order ?? targetIndex;

    await pb.collection("containers").update(siblings[currentIndex].id, { order: targetOrder });
    await pb.collection("containers").update(siblings[targetIndex].id, { order: currentOrder });

    revalidatePath(`/admin/brand/${page.brand}/builder/${page.id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to move container:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri posune riadku",
    };
  }
}

/**
 * Swaps order of a module with its adjacent sibling inside the same column.
 */
export async function moveModuleAction(
  moduleId: string,
  direction: "up" | "down"
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const mod = await pb.collection("modules").getOne(moduleId);
    const siblings = await pb.collection("modules").getFullList({
      filter: `column = "${mod.column}"`,
      sort: "order",
    });

    const currentIndex = siblings.findIndex((m) => m.id === moduleId);
    if (currentIndex === -1) return { success: false, error: "Modul nenájdený." };

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      return { success: true }; // already at boundary
    }

    const currentOrder = siblings[currentIndex].order ?? currentIndex;
    const targetOrder = siblings[targetIndex].order ?? targetIndex;

    await pb.collection("modules").update(siblings[currentIndex].id, { order: targetOrder });
    await pb.collection("modules").update(siblings[targetIndex].id, { order: currentOrder });

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to move module:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri posune modulu",
    };
  }
}

/**
 * Updates a module's JSON config and optional header.
 * CRITICAL (Linked Sync): If moduleId has linkGroupId, all modules
 * with the same linkGroupId across the entire brand are updated synchronously!
 */
export async function updateModuleConfigAction(
  moduleId: string,
  config: Record<string, unknown>,
  h3Title?: string | I18nRecord,
  showH3?: boolean
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const mod = await pb.collection("modules").getOne(moduleId);

    const payload: Record<string, unknown> = { config };
    if (h3Title !== undefined) {
      if (typeof h3Title === "string") {
        const existing = typeof mod.h3Title === "object" ? mod.h3Title : {};
        payload.h3Title = { ...existing, sk: h3Title, en: h3Title };
      } else {
        payload.h3Title = h3Title;
      }
    }
    if (showH3 !== undefined) {
      payload.showH3 = showH3;
    }

    if (mod.linkGroupId && mod.linkGroupId.trim() !== "") {
      // Find all modules in the same linkGroup
      const linked = await pb.collection("modules").getFullList({
        filter: `linkGroupId = "${mod.linkGroupId}"`,
      });

      for (const m of linked) {
        await pb.collection("modules").update(m.id, payload);
      }

      return { success: true, updatedCount: linked.length };
    } else {
      await pb.collection("modules").update(moduleId, payload);
      return { success: true, updatedCount: 1 };
    }
  } catch (err: unknown) {
    console.error("Failed to update module config:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri ukladaní konfigurácie modulu",
    };
  }
}

/**
 * Links a module to a linkGroupId (mirroring across pages).
 * If other modules already exist in that group, synchronizes this module's config
 * with the existing group's config.
 */
export async function linkModuleAction(
  moduleId: string,
  linkGroupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const cleanGroupId = linkGroupId
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-");

    if (!cleanGroupId) {
      return { success: false, error: "Neplatný identifikátor skupiny zrkadlenia." };
    }

    // Check if other modules already exist in this linkGroup
    const existing = await pb.collection("modules").getFullList({
      filter: `linkGroupId = "${cleanGroupId}" && id != "${moduleId}"`,
    });

    const payload: Record<string, unknown> = { linkGroupId: cleanGroupId };
    if (existing.length > 0) {
      // Sync config from existing master module
      payload.config = existing[0].config;
      if (existing[0].h3Title) payload.h3Title = existing[0].h3Title;
      if (existing[0].showH3 !== undefined) payload.showH3 = existing[0].showH3;
    }

    await pb.collection("modules").update(moduleId, payload);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to link module:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri prepojení modulu",
    };
  }
}

/**
 * Detaches (unlinks) a module from its linkGroupId, making it independent.
 */
export async function unlinkModuleAction(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await pb.collection("modules").update(moduleId, { linkGroupId: "" });
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to unlink module:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri odpojení modulu",
    };
  }
}

/**
 * Returns distinct linkGroups used in the brand, with module count.
 */
export async function getBrandLinkGroupsAction(
  brandId: string
): Promise<{
  success: boolean;
  groups?: Array<{ linkGroupId: string; count: number; moduleType: string }>;
  error?: string;
}> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await verifyBrandAccess(pb, brandId, user.id);

    // Fetch all pages for brand
    const pages = await pb.collection("pages").getFullList({
      filter: `brand = "${brandId}"`,
      fields: "id",
    });
    const pageIds = pages.map((p) => p.id);
    if (pageIds.length === 0) return { success: true, groups: [] };

    // Fetch containers
    const containers = await pb.collection("containers").getFullList({
      filter: pageIds.map((id) => `page = "${id}"`).join(" || "),
      fields: "id",
    });
    const containerIds = containers.map((c) => c.id);
    if (containerIds.length === 0) return { success: true, groups: [] };

    // Fetch columns
    const columns = await pb.collection("columns").getFullList({
      filter: containerIds.map((id) => `container = "${id}"`).join(" || "),
      fields: "id",
    });
    const columnIds = columns.map((c) => c.id);
    if (columnIds.length === 0) return { success: true, groups: [] };

    // Fetch modules with linkGroupId
    const modules = await pb.collection("modules").getFullList({
      filter: `linkGroupId != "" && (${columnIds.map((id) => `column = "${id}"`).join(" || ")})`,
    });

    const map = new Map<string, { count: number; moduleType: string }>();
    for (const m of modules) {
      if (!m.linkGroupId) continue;
      const existing = map.get(m.linkGroupId);
      if (existing) {
        existing.count++;
      } else {
        map.set(m.linkGroupId, { count: 1, moduleType: m.moduleType });
      }
    }

    const groups = Array.from(map.entries()).map(([linkGroupId, val]) => ({
      linkGroupId,
      count: val.count,
      moduleType: val.moduleType,
    }));

    return { success: true, groups };
  } catch (err: unknown) {
    console.error("Failed to get link groups:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri načítaní skupín zrkadlenia",
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

/**
 * Updates page tree hierarchy and ordering in a batch (after drag & drop event).
 */
export async function updatePageTreeAction(
  brandId: string,
  updates: Array<{ id: string; parentId: string | null; order: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    await verifyBrandAccess(pb, brandId, user.id);

    // Apply updates sequentially
    for (const update of updates) {
      await pb.collection("pages").update(update.id, {
        parent: update.parentId || null,
        order: update.order,
      });
    }

    revalidatePath(`/admin/brand/${brandId}/builder`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update page tree:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmene poradia stránok",
    };
  }
}

// Helper: Generates a guaranteed unique slug within the brand
async function generateUniqueSlug(pb: any, brandId: string, baseSlug: string): Promise<string> {
  let candidate = `${baseSlug}-kopia`;
  let counter = 1;

  while (true) {
    try {
      const existing = await pb.collection("pages").getFirstListItem(
        `brand = "${brandId}" && slug = "${candidate}"`
      );
      if (existing) {
        counter++;
        candidate = `${baseSlug}-kopia-${counter}`;
      }
    } catch {
      // Slug does not exist -> it is unique and available
      return candidate;
    }
  }
}

// Helper: Deep-clones containers, columns, and modules from one page to another
async function cloneContainersAndModules(pb: any, sourcePageId: string, targetPageId: string) {
  const containers = await pb.collection("containers").getFullList({
    filter: `page = "${sourcePageId}"`,
    sort: "order",
  });

  for (const c of containers) {
    const newContainer = await pb.collection("containers").create({
      page: targetPageId,
      order: c.order,
      layoutType: c.layoutType,
      columnCount: c.columnCount,
      columnWidths: c.columnWidths,
      showH2: c.showH2,
      h2Title: c.h2Title,
      backgroundColor: c.backgroundColor,
      heightMode: c.heightMode,
      fixedHeight: c.fixedHeight,
    });

    const columns = await pb.collection("columns").getFullList({
      filter: `container = "${c.id}"`,
      sort: "order",
    });

    for (const col of columns) {
      const newCol = await pb.collection("columns").create({
        container: newContainer.id,
        order: col.order,
        backgroundColor: col.backgroundColor,
      });

      const modules = await pb.collection("modules").getFullList({
        filter: `column = "${col.id}"`,
        sort: "order",
      });

      for (const m of modules) {
        await pb.collection("modules").create({
          column: newCol.id,
          moduleType: m.moduleType,
          order: m.order,
          showH3: m.showH3,
          h3Title: m.h3Title,
          config: m.config,
          linkGroupId: m.linkGroupId,
        });
      }
    }
  }
}

/**
 * Deep-duplicates a page, including all its containers, columns, modules,
 * and recursively all its child subpages (User requirement 2).
 */
export async function duplicatePageAction(
  pageId: string
): Promise<{ success: boolean; newPageId?: string; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const sourcePage = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, sourcePage.brand, user.id);

    // Build title with (Kópia) indicator
    let sourceTitle = sourcePage.title;
    if (typeof sourceTitle === "string") {
      try {
        sourceTitle = JSON.parse(sourceTitle);
      } catch {
        sourceTitle = { sk: sourceTitle, en: sourceTitle };
      }
    }
    const skTitle = (sourceTitle?.sk || sourceTitle?.en || "Stránka") + " (Kópia)";
    const enTitle = (sourceTitle?.en || sourceTitle?.sk || "Page") + " (Copy)";

    // Generate unique slug
    const newSlug = await generateUniqueSlug(pb, sourcePage.brand, sourcePage.slug);

    // Determine next order
    let nextOrder = (sourcePage.order ?? 0) + 1;

    // 1. Create duplicated root page
    const newPage = await pb.collection("pages").create({
      brand: sourcePage.brand,
      parent: sourcePage.parent || null,
      title: { sk: skTitle, en: enTitle },
      slug: newSlug,
      isInMenu: sourcePage.isInMenu ?? true,
      menuStyle: sourcePage.menuStyle || "main",
      order: nextOrder,
      templateId: sourcePage.templateId || undefined,
    });

    // 2. Clone all containers, columns, and modules for the root page
    await cloneContainersAndModules(pb, sourcePage.id, newPage.id);

    // 3. Deep-duplicate all child sub-pages if this is a parent chapter (User requirement 2)
    const childPages = await pb.collection("pages").getFullList({
      filter: `parent = "${sourcePage.id}"`,
      sort: "order",
    });

    for (const child of childPages) {
      let childTitle = child.title;
      if (typeof childTitle === "string") {
        try {
          childTitle = JSON.parse(childTitle);
        } catch {
          childTitle = { sk: childTitle, en: childTitle };
        }
      }
      const childSkTitle = (childTitle?.sk || childTitle?.en || "Podstránka") + " (Kópia)";
      const childEnTitle = (childTitle?.en || childTitle?.sk || "Subpage") + " (Copy)";
      const childSlug = await generateUniqueSlug(pb, sourcePage.brand, child.slug);

      const newChildPage = await pb.collection("pages").create({
        brand: sourcePage.brand,
        parent: newPage.id, // linked to the newly duplicated parent!
        title: { sk: childSkTitle, en: childEnTitle },
        slug: childSlug,
        isInMenu: child.isInMenu ?? true,
        menuStyle: child.menuStyle || "submenu",
        order: child.order ?? 0,
        templateId: child.templateId || undefined,
      });

      // Clone child containers and modules
      await cloneContainersAndModules(pb, child.id, newChildPage.id);
    }

    revalidatePath(`/admin/brand/${sourcePage.brand}/builder`);
    revalidatePath(`/admin/brand/${sourcePage.brand}/builder/${newPage.id}`);

    return { success: true, newPageId: newPage.id };
  } catch (err: unknown) {
    console.error("Failed to duplicate page:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri duplikovaní stránky",
    };
  }
}

/**
 * Toggles a page's menu visibility between 'main' and 'hidden'.
 */
export async function togglePageMenuVisibilityAction(
  pageId: string
): Promise<{ success: boolean; isInMenu?: boolean; menuStyle?: PageMenuStyle; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;
    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Neautorizovaná relácia." };
    }

    const page = await pb.collection("pages").getOne(pageId);
    await verifyBrandAccess(pb, page.brand, user.id);

    const isCurrentlyHidden = page.menuStyle === "hidden" || page.isInMenu === false;
    const newStyle: PageMenuStyle = isCurrentlyHidden ? "main" : "hidden";
    const newInMenu = isCurrentlyHidden;

    await pb.collection("pages").update(pageId, {
      menuStyle: newStyle,
      isInMenu: newInMenu,
    });

    revalidatePath(`/admin/brand/${page.brand}/builder`);
    return { success: true, isInMenu: newInMenu, menuStyle: newStyle };
  } catch (err: unknown) {
    console.error("Failed to toggle menu visibility:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Chyba pri zmene viditeľnosti v menu",
    };
  }
}
