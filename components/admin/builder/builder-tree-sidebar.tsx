"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  MoreVertical,
  ChevronRight,
  Eye,
  EyeOff,
  FolderTree,
  Loader2,
  GripVertical,
  Copy,
  Edit2,
  FolderPlus,
  Sparkles,
} from "lucide-react";
import { DimensionMatrixWizardModal } from "./dimension-matrix-wizard-modal";
import { PageItem, PageHierarchyItem } from "@/lib/types/page";
import {
  createPageAction,
  deletePageAction,
  duplicatePageAction,
  togglePageMenuVisibilityAction,
  updatePageTreeAction,
  updatePageAction,
} from "@/actions/pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuilderTreeSidebarProps {
  brandId: string;
  currentPageId?: string;
  currentPageSlug?: string;
  pages: PageItem[];
  tree: PageHierarchyItem[];
}

// Helper to get localized title
function getPageTitle(p: PageItem | PageHierarchyItem): string {
  if (!p || !p.title) return "Bez názvu";
  return p.title.sk || p.title.en || p.title.cs || "Bez názvu";
}

// Helper: check if targetId is inside node's descendant tree
function isDescendantOf(node: PageHierarchyItem, targetId: string): boolean {
  if (!node.children || node.children.length === 0) return false;
  for (const child of node.children) {
    if (child.id === targetId) return true;
    if (isDescendantOf(child, targetId)) return true;
  }
  return false;
}

// Helper: collect all parent IDs of a specific page
function collectAncestorIds(tree: PageHierarchyItem[], targetId: string, ancestors: string[] = []): string[] | null {
  for (const node of tree) {
    if (node.id === targetId) return ancestors;
    if (node.children && node.children.length > 0) {
      const found = collectAncestorIds(node.children, targetId, [...ancestors, node.id]);
      if (found) return found;
    }
  }
  return null;
}

// Helper: collect all node IDs with children
function collectAllParentIds(tree: PageHierarchyItem[]): string[] {
  const ids: string[] = [];
  function traverse(nodes: PageHierarchyItem[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        traverse(node.children);
      }
    }
  }
  traverse(tree);
  return ids;
}

export function BuilderTreeSidebar({
  brandId,
  currentPageId,
  currentPageSlug,
  pages,
  tree,
}: BuilderTreeSidebarProps) {
  const router = useRouter();

  // Local optimistic tree state
  const [localTree, setLocalTree] = useState<PageHierarchyItem[]>(tree);
  useEffect(() => {
    setLocalTree(tree);
  }, [tree]);

  // Expanded nodes state (Set of node IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Default: expand all parent nodes + ancestors of currentPageId
    const initial = new Set<string>(collectAllParentIds(tree));
    if (currentPageId) {
      const ancestors = collectAncestorIds(tree, currentPageId);
      if (ancestors) {
        ancestors.forEach((id) => initial.add(id));
      }
    }
    return initial;
  });

  // Ensure active page is expanded whenever currentPageId or tree changes
  useEffect(() => {
    if (currentPageId) {
      const ancestors = collectAncestorIds(localTree, currentPageId);
      if (ancestors && ancestors.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          ancestors.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [currentPageId, localTree]);

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: "before" | "after" | "inside";
  } | null>(null);
  const [isUpdatingTree, setIsUpdatingTree] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Context menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Creation drawer state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [newMenuStyle, setNewMenuStyle] = useState<"main" | "submenu" | "hidden">("main");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    pageId: string;
    title: string;
    slug: string;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  // Duplication loading state
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSlug(slug);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await createPageAction(brandId, {
        title: newTitle.trim(),
        slug: newSlug.trim(),
        parentId: newParentId || undefined,
        menuStyle: newMenuStyle,
      });

      if (!res.success) {
        setError(res.error || "Nepodarilo sa vytvoriť stránku.");
        return;
      }

      if (newParentId) {
        setExpandedIds((prev) => new Set(prev).add(newParentId));
      }

      setIsCreating(false);
      setNewTitle("");
      setNewSlug("");
      setNewParentId("");
      router.push(`/admin/brand/${brandId}/builder/${res.pageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri vytváraní stránky.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddSubpage = (parentId: string) => {
    setActiveMenuId(null);
    setNewParentId(parentId);
    setNewTitle("");
    setNewSlug("");
    setNewMenuStyle("submenu");
    setIsCreating(true);
    setExpandedIds((prev) => new Set(prev).add(parentId));
  };

  const handleOpenRename = (p: PageItem | PageHierarchyItem) => {
    setActiveMenuId(null);
    setRenameModal({
      pageId: p.id,
      title: getPageTitle(p),
      slug: p.slug,
    });
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModal || !renameModal.title.trim() || !renameModal.slug.trim()) return;

    try {
      setIsRenaming(true);
      setError(null);
      const res = await updatePageAction(renameModal.pageId, {
        title: renameModal.title.trim(),
        slug: renameModal.slug.trim(),
      });

      if (!res.success) {
        alert(res.error || "Nepodarilo sa premenovať stránku.");
        return;
      }

      setRenameModal(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba pri premenovaní stránky.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDuplicatePage = async (pageId: string) => {
    setActiveMenuId(null);
    try {
      setDuplicatingId(pageId);
      const res = await duplicatePageAction(pageId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa duplikovať stránku.");
        return;
      }

      if (res.newPageId) {
        router.push(`/admin/brand/${brandId}/builder/${res.newPageId}`);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba pri duplikovaní stránky.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleToggleVisibility = async (pageId: string) => {
    setActiveMenuId(null);
    try {
      const res = await togglePageMenuVisibilityAction(pageId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa zmeniť viditeľnosť stránky.");
        return;
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba pri zmene viditeľnosti.");
    }
  };

  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    setActiveMenuId(null);
    if (
      !confirm(
        `Naozaj chcete zmazať stránku "${pageTitle}" vrátane všetkých jej podstránok a modulov?`
      )
    ) {
      return;
    }

    try {
      const res = await deletePageAction(pageId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa zmazať stránku.");
        return;
      }

      if (currentPageId === pageId) {
        router.push(`/admin/brand/${brandId}/builder`);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba pri zmazaní stránky.");
    }
  };

  // Helper: find node in tree
  const findNodeInTree = (nodes: PageHierarchyItem[], id: string): PageHierarchyItem | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children && n.children.length > 0) {
        const found = findNodeInTree(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Drag & Drop Reorder Execution for arbitrary N-level depth
  const handleTreeDrop = async (
    dragId: string,
    targetId: string,
    position: "before" | "after" | "inside"
  ) => {
    if (dragId === targetId) return;

    // Deep clone local tree
    const newTree: PageHierarchyItem[] = JSON.parse(JSON.stringify(localTree));

    // Find dragged node object
    const draggedNode = findNodeInTree(newTree, dragId);
    if (!draggedNode) return;

    // Prevent dropping a node inside its own descendants
    if (isDescendantOf(draggedNode, targetId)) {
      alert("Nemožno presunúť položku do jej vlastnej podpoložky.");
      return;
    }

    // 1. Remove dragged node from its current position
    let extractedNode: PageHierarchyItem | null = null;
    function removeNode(nodes: PageHierarchyItem[]): boolean {
      const idx = nodes.findIndex((n) => n.id === dragId);
      if (idx !== -1) {
        extractedNode = nodes.splice(idx, 1)[0];
        return true;
      }
      for (const node of nodes) {
        if (node.children && removeNode(node.children)) {
          return true;
        }
      }
      return false;
    }
    removeNode(newTree);

    if (!extractedNode) return;

    // 2. Insert into target position
    if (position === "inside") {
      function insertInside(nodes: PageHierarchyItem[]): boolean {
        for (const node of nodes) {
          if (node.id === targetId) {
            node.children = node.children || [];
            (extractedNode as PageHierarchyItem).parent = node.id;
            node.children.push(extractedNode as PageHierarchyItem);
            return true;
          }
          if (node.children && insertInside(node.children)) {
            return true;
          }
        }
        return false;
      }
      insertInside(newTree);
      setExpandedIds((prev) => new Set(prev).add(targetId));
    } else {
      // "before" or "after"
      function insertAdjacent(nodes: PageHierarchyItem[], parentId: string | null): boolean {
        const targetIdx = nodes.findIndex((n) => n.id === targetId);
        if (targetIdx !== -1) {
          (extractedNode as PageHierarchyItem).parent = parentId || undefined;
          const insertIdx = position === "before" ? targetIdx : targetIdx + 1;
          nodes.splice(insertIdx, 0, extractedNode as PageHierarchyItem);
          return true;
        }
        for (const node of nodes) {
          if (node.children && insertAdjacent(node.children, node.id)) {
            return true;
          }
        }
        return false;
      }
      insertAdjacent(newTree, null);
    }

    // 3. Re-index all orders and collect updates recursively
    const updates: Array<{ id: string; parentId: string | null; order: number }> = [];
    function reindex(nodes: PageHierarchyItem[], parentId: string | null) {
      nodes.forEach((node, idx) => {
        node.order = idx;
        node.parent = parentId || undefined;
        updates.push({ id: node.id, parentId, order: idx });
        if (node.children && node.children.length > 0) {
          reindex(node.children, node.id);
        }
      });
    }
    reindex(newTree, null);

    // Optimistic UI update
    setLocalTree(newTree);

    // Call server action
    try {
      setIsUpdatingTree(true);
      const res = await updatePageTreeAction(brandId, updates);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa uložiť zmenu poradia stromu.");
        setLocalTree(tree); // rollback
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Chyba pri ukladaní zmeny stromu.");
      setLocalTree(tree); // rollback
    } finally {
      setIsUpdatingTree(false);
    }
  };

  // Helper to render hierarchical parent options for select input
  const renderParentOptions = (nodes: PageHierarchyItem[], depth: number = 0): React.ReactNode[] => {
    let options: React.ReactNode[] = [];
    nodes.forEach((node) => {
      const indent = "\u00A0\u00A0".repeat(depth) + (depth > 0 ? "└ " : "");
      options.push(
        <option key={node.id} value={node.id}>
          {indent + getPageTitle(node)}
        </option>
      );
      if (node.children && node.children.length > 0) {
        options = options.concat(renderParentOptions(node.children, depth + 1));
      }
    });
    return options;
  };

  // Recursive TreeNode Renderer
  const renderTreeNode = (node: PageHierarchyItem, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedIds.has(node.id);
    const isDragging = draggedId === node.id;
    const isTarget = dropTarget?.id === node.id;
    const isInsideTarget = isTarget && dropTarget?.position === "inside";
    const isBeforeTarget = isTarget && dropTarget?.position === "before";
    const isAfterTarget = isTarget && dropTarget?.position === "after";
    const isDuplicatingThis = duplicatingId === node.id;
    const isCurrent =
      (currentPageId && (currentPageId === node.id || currentPageId === node.slug)) ||
      (currentPageSlug && currentPageSlug === node.slug);

    return (
      <div key={node.id} className="relative space-y-0.5">
        {/* Visual drop indicator before */}
        {isBeforeTarget && (
          <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
        )}

        {/* Node Row */}
        <div
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", node.id);
            e.dataTransfer.effectAllowed = "move";
            setDraggedId(node.id);
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDropTarget(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!draggedId || draggedId === node.id) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const height = rect.height;

            let pos: "before" | "after" | "inside";
            if (offsetY < height * 0.25) pos = "before";
            else if (offsetY > height * 0.75) pos = "after";
            else pos = "inside";

            setDropTarget({ id: node.id, position: pos });
          }}
          onDragLeave={() => {
            if (dropTarget?.id === node.id) {
              setDropTarget(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!draggedId || !dropTarget || draggedId === dropTarget.id) return;
            handleTreeDrop(draggedId, dropTarget.id, dropTarget.position);
            setDraggedId(null);
            setDropTarget(null);
          }}
          className={`group relative flex items-center justify-between px-1.5 py-1 rounded-[2px] text-xs transition-all ${
            isDragging
              ? "opacity-30 border border-dashed border-primary"
              : isInsideTarget
              ? "bg-primary/20 ring-2 ring-primary ring-inset"
              : isCurrent
              ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
              : "text-foreground hover:bg-neutral-800/40"
          }`}
          style={{
            paddingLeft: `${Math.max(6, depth * 12 + 6)}px`,
          }}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              title="Uchopiť a presunúť"
              className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground shrink-0 p-0.5"
            >
              <GripVertical className="h-3 w-3" />
            </div>

            {/* Expand / Collapse Chevron (for any node with children) */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 text-muted-foreground hover:text-foreground hover:bg-neutral-800/80 rounded-[2px] transition-transform shrink-0"
                title={isExpanded ? "Zbaliť vetvu" : "Rozbaliť vetvu"}
              >
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${
                    isExpanded ? "rotate-90 text-primary" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <FileText className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary/70 shrink-0" />
              </div>
            )}

            {/* Page Link with clean slug */}
            <Link
              href={`/admin/brand/${brandId}/builder/${node.slug || node.id}`}
              className="flex items-center gap-1.5 flex-1 truncate py-0.5"
              title={getPageTitle(node)}
            >
              <span className="truncate">{getPageTitle(node)}</span>
            </Link>
          </div>

          {/* Node Actions & Dropdown */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {node.menuStyle === "hidden" && (
              <span title="Skryté vo verejnom menu">
                <EyeOff className="h-3 w-3 text-muted-foreground/60 mr-0.5" />
              </span>
            )}

            {isDuplicatingThis ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === node.id ? null : node.id);
                  }}
                  className="p-1 hover:text-foreground text-muted-foreground/50 hover:bg-neutral-800 rounded-[2px] transition-colors"
                  title="Možnosti stránky"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>

                {/* Context Menu Dropdown */}
                {activeMenuId === node.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-border/80 rounded-[3px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenAddSubpage(node.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-primary" />
                      <span>Pridať podstránku</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRename(node)}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Premenovať</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicatePage(node.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Duplikovať</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(node.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                    >
                      {node.menuStyle === "hidden" ? (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Zobraziť v menu</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Skryť v menu</span>
                        </>
                      )}
                    </button>

                    <div className="my-1 border-t border-border/40" />

                    <button
                      type="button"
                      onClick={() => handleDeletePage(node.id, getPageTitle(node))}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Zmazať {hasChildren ? "kapitolu" : "stránku"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual drop indicator after */}
        {isAfterTarget && (
          <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
        )}

        {/* Recursive Children Container */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5 border-l border-border/20 ml-2">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full md:w-72 bg-[#17212a] border border-white/10 rounded-[6px] p-4 flex flex-col gap-4 shadow-sm text-[#fafbfc]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#fafbfc]">
            Strom Stránok
          </h2>
          <span className="text-[10px] font-mono text-[#96abbe] px-1.5 py-0.2 rounded-full bg-[#070b0f] border border-white/10">
            {pages.length}
          </span>
          {isUpdatingTree && (
            <span title="Ukladám poradie...">
              <Loader2 className="h-3 w-3 animate-spin text-primary ml-1" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsWizardOpen(true)}
            className="h-7 px-2 text-[11px] gap-1 rounded-[2px] border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary cursor-pointer shadow-2xs"
            title="Spustiť generátor stromu (Dimension Matrix Wizard)"
          >
            <Sparkles className="h-3 w-3" />
            <span>Wizard</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setNewParentId("");
              setNewTitle("");
              setNewSlug("");
              setNewMenuStyle("main");
              setIsCreating(true);
            }}
            className="h-7 px-2 text-[11px] gap-1 rounded-[2px] border-border/60 hover:border-primary/50 text-foreground cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Pridať</span>
          </Button>
        </div>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreatePage}
          className="p-3 rounded-[3px] bg-neutral-950/80 border border-primary/40 space-y-3 shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {newParentId ? "Nová podstránka" : "Nová hlavná kapitola"}
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="p-1.5 rounded-[2px] bg-rose-950/40 border border-rose-800/40 text-[10px] text-rose-300">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
              Názov stránky
            </Label>
            <Input
              type="text"
              required
              value={newTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="napr. Ochranná zóna loga"
              className="h-7 text-xs rounded-[2px]"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
              URL Slug
            </Label>
            <Input
              type="text"
              required
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
              placeholder="ochranna-zona"
              className="h-7 text-xs font-mono rounded-[2px]"
            />
          </div>

          {localTree.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Zanorenie (Rodičovská kapitola)
              </Label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full h-7 rounded-[2px] bg-neutral-900 border border-border/50 text-xs px-2 text-foreground font-sans"
              >
                <option value="">— Hlavná úroveň (Kapitola) —</option>
                {renderParentOptions(localTree)}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="h-6 px-2 text-xs"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-6 px-2.5 text-xs font-bold rounded-[2px] bg-primary text-primary-foreground"
            >
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Vytvoriť"}
            </Button>
          </div>
        </form>
      )}

      {/* Rename Dialog Modal */}
      {renameModal && (
        <form
          onSubmit={handleSaveRename}
          className="p-3 rounded-[3px] bg-neutral-950 border border-amber-500/50 space-y-3 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Premenovať stránku</span>
            <button
              type="button"
              onClick={() => setRenameModal(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
              Nový názov
            </Label>
            <Input
              type="text"
              required
              value={renameModal.title}
              onChange={(e) =>
                setRenameModal((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
              className="h-7 text-xs rounded-[2px]"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
              URL Slug
            </Label>
            <Input
              type="text"
              required
              value={renameModal.slug}
              onChange={(e) =>
                setRenameModal((prev) =>
                  prev ? { ...prev, slug: e.target.value.toLowerCase() } : null
                )
              }
              className="h-7 text-xs font-mono rounded-[2px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRenameModal(null)}
              className="h-6 px-2 text-xs"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isRenaming}
              className="h-6 px-2.5 text-xs font-bold rounded-[2px] bg-primary text-primary-foreground"
            >
              {isRenaming ? <Loader2 className="h-3 w-3 animate-spin" /> : "Uložiť"}
            </Button>
          </div>
        </form>
      )}

      {/* Pages Tree Navigation (Recursive N-Level) */}
      <nav className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 select-none">
        {localTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Žiadne stránky. Kliknite na <strong>+ Pridať</strong> pre vytvorenie prvej podstránky.
          </div>
        ) : (
          localTree.map((rootNode) => renderTreeNode(rootNode, 0))
        )}
      </nav>

      {isWizardOpen && (
        <DimensionMatrixWizardModal
          brandId={brandId}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={(firstPageId) => {
            setIsWizardOpen(false);
            if (firstPageId) {
              router.push(`/admin/brand/${brandId}/builder/${firstPageId}`);
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </aside>
  );
}
