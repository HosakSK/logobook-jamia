"use client";

import React, { useState, useEffect, useRef } from "react";
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
  pages: PageItem[];
  tree: PageHierarchyItem[];
}

export function BuilderTreeSidebar({
  brandId,
  currentPageId,
  pages,
  tree,
}: BuilderTreeSidebarProps) {
  const router = useRouter();

  // Local optimistic tree state
  const [localTree, setLocalTree] = useState<PageHierarchyItem[]>(tree);
  useEffect(() => {
    setLocalTree(tree);
  }, [tree]);

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

  const getTitle = (p: PageItem) => {
    return p.title?.sk || p.title?.en || "Bez názvu";
  };

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
  };

  const handleOpenRename = (p: PageItem) => {
    setActiveMenuId(null);
    setRenameModal({
      pageId: p.id,
      title: getTitle(p),
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

  // Helper: check if a node has children
  const nodeHasChildren = (id: string): boolean => {
    const rootNode = localTree.find((n) => n.id === id);
    return Boolean(rootNode && rootNode.children && rootNode.children.length > 0);
  };

  // Drag & Drop Reorder Execution
  const handleTreeDrop = async (
    dragId: string,
    targetId: string,
    position: "before" | "after" | "inside"
  ) => {
    if (dragId === targetId) return;

    // Deep clone local tree
    const newTree: PageHierarchyItem[] = JSON.parse(JSON.stringify(localTree));

    // 1. Locate dragged node and extract it
    let extractedNode: PageHierarchyItem | null = null;

    // Search root level
    const rootIdx = newTree.findIndex((n) => n.id === dragId);
    if (rootIdx !== -1) {
      extractedNode = newTree.splice(rootIdx, 1)[0];
    } else {
      // Search in children
      for (const parent of newTree) {
        if (parent.children) {
          const childIdx = parent.children.findIndex((c) => c.id === dragId);
          if (childIdx !== -1) {
            extractedNode = parent.children.splice(childIdx, 1)[0];
            break;
          }
        }
      }
    }

    if (!extractedNode) return;

    // Enforce 2-level maximum nesting:
    // If extractedNode has children, it can NEVER be placed inside another node,
    // and can never be nested under another parent.
    const hasChildren = extractedNode.children && extractedNode.children.length > 0;

    // 2. Insert into target location
    if (position === "inside") {
      if (hasChildren) {
        alert("Kapitolu s podstránkami nie je možné zanoriť do inej kapitoly (max 2 úrovne).");
        return;
      }
      const targetParent = newTree.find((n) => n.id === targetId);
      if (targetParent) {
        targetParent.children = targetParent.children || [];
        extractedNode.parent = targetParent.id;
        targetParent.children.push(extractedNode);
      }
    } else {
      // "before" or "after"
      // Check if target is at root level
      const targetRootIdx = newTree.findIndex((n) => n.id === targetId);
      if (targetRootIdx !== -1) {
        // Target is at root
        extractedNode.parent = undefined;
        const insertIdx = position === "before" ? targetRootIdx : targetRootIdx + 1;
        newTree.splice(insertIdx, 0, extractedNode);
      } else {
        // Target is in a child array
        if (hasChildren) {
          alert("Kapitolu s podstránkami nie je možné presunúť na úroveň podstránok.");
          return;
        }

        for (const parent of newTree) {
          if (parent.children) {
            const targetChildIdx = parent.children.findIndex((c) => c.id === targetId);
            if (targetChildIdx !== -1) {
              extractedNode.parent = parent.id;
              const insertIdx =
                position === "before" ? targetChildIdx : targetChildIdx + 1;
              parent.children.splice(insertIdx, 0, extractedNode);
              break;
            }
          }
        }
      }
    }

    // 3. Re-index all orders and collect updates
    const updates: Array<{ id: string; parentId: string | null; order: number }> = [];

    newTree.forEach((rootItem, rIdx) => {
      rootItem.order = rIdx;
      rootItem.parent = undefined;
      updates.push({ id: rootItem.id, parentId: null, order: rIdx });

      if (rootItem.children) {
        rootItem.children.forEach((childItem, cIdx) => {
          childItem.order = cIdx;
          childItem.parent = rootItem.id;
          updates.push({ id: childItem.id, parentId: rootItem.id, order: cIdx });
        });
      }
    });

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

  return (
    <aside className="w-full md:w-72 bg-card/70 border border-border/50 rounded-[3px] p-4 flex flex-col gap-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Strom Stránok
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded-full bg-neutral-900 border border-border/40">
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
                className="w-full h-7 rounded-[2px] bg-neutral-900 border border-border/50 text-xs px-2 text-foreground"
              >
                <option value="">— Hlavná úroveň (Kapitola) —</option>
                {localTree.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getTitle(p)}
                  </option>
                ))}
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

      {/* Pages Tree Navigation */}
      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 select-none">
        {localTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Žiadne stránky. Kliknite na <strong>+ Pridať</strong> pre vytvorenie prvej podstránky.
          </div>
        ) : (
          localTree.map((node) => {
            const isDragging = draggedId === node.id;
            const isTarget = dropTarget?.id === node.id;
            const isInsideTarget = isTarget && dropTarget?.position === "inside";
            const isBeforeTarget = isTarget && dropTarget?.position === "before";
            const isAfterTarget = isTarget && dropTarget?.position === "after";
            const isDuplicatingThis = duplicatingId === node.id;

            return (
              <div key={node.id} className="relative space-y-1">
                {/* Visual line indicator before */}
                {isBeforeTarget && (
                  <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
                )}

                {/* Level 1 Chapter Item */}
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

                    const draggedHasChildren = nodeHasChildren(draggedId);

                    let pos: "before" | "after" | "inside";
                    if (!draggedHasChildren) {
                      if (offsetY < height * 0.25) pos = "before";
                      else if (offsetY > height * 0.75) pos = "after";
                      else pos = "inside";
                    } else {
                      if (offsetY < height * 0.5) pos = "before";
                      else pos = "after";
                    }

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
                  className={`group relative flex items-center justify-between px-2 py-1.5 rounded-[2px] text-xs transition-all ${
                    isDragging
                      ? "opacity-30 border border-dashed border-primary"
                      : isInsideTarget
                      ? "bg-primary/20 ring-2 ring-primary ring-inset"
                      : currentPageId === node.id
                      ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                      : "text-foreground hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Drag handle */}
                    <div
                      title="Uchopiť a presunúť"
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0 p-0.5"
                    >
                      <GripVertical className="h-3 w-3" />
                    </div>

                    <Link
                      href={`/admin/brand/${brandId}/builder/${node.id}`}
                      className="flex items-center gap-1.5 flex-1 truncate"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="truncate">{getTitle(node)}</span>
                    </Link>
                  </div>

                  {/* Actions & Context Menu */}
                  <div className="flex items-center gap-1">
                    {node.menuStyle === "hidden" && (
                      <span title="Skryté vo verejnom menu">
                        <EyeOff className="h-3 w-3 text-muted-foreground/60 mr-1" />
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
                          className="p-1 hover:text-foreground text-muted-foreground/60 hover:bg-neutral-800 rounded-[2px] transition-colors"
                          title="Možnosti stránky"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === node.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-border/80 rounded-[3px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
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
                              onClick={() => handleDeletePage(node.id, getTitle(node))}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Zmazať kapitolu</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual line indicator after */}
                {isAfterTarget && (
                  <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
                )}

                {/* Level 2 Sub-Pages */}
                {node.children && node.children.length > 0 && (
                  <div className="pl-3.5 border-l border-border/30 space-y-1 ml-2.5">
                    {node.children.map((child) => {
                      const isChildDragging = draggedId === child.id;
                      const isChildTarget = dropTarget?.id === child.id;
                      const isChildBeforeTarget =
                        isChildTarget && dropTarget?.position === "before";
                      const isChildAfterTarget =
                        isChildTarget && dropTarget?.position === "after";
                      const isDuplicatingChild = duplicatingId === child.id;

                      return (
                        <div key={child.id} className="relative space-y-1">
                          {isChildBeforeTarget && (
                            <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
                          )}

                          <div
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", child.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggedId(child.id);
                            }}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setDropTarget(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!draggedId || draggedId === child.id) return;

                              const rect = e.currentTarget.getBoundingClientRect();
                              const offsetY = e.clientY - rect.top;
                              const height = rect.height;

                              // Children can only have before or after
                              const pos = offsetY < height * 0.5 ? "before" : "after";
                              setDropTarget({ id: child.id, position: pos });
                            }}
                            onDragLeave={() => {
                              if (dropTarget?.id === child.id) {
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
                            className={`group relative flex items-center justify-between px-2 py-1 rounded-[2px] text-xs transition-all ${
                              isChildDragging
                                ? "opacity-30 border border-dashed border-primary"
                                : currentPageId === child.id
                                ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                                : "text-foreground hover:bg-neutral-800/40"
                            }`}
                          >
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <div
                                title="Uchopiť a presunúť"
                                className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0 p-0.5"
                              >
                                <GripVertical className="h-3 w-3" />
                              </div>

                              <Link
                                href={`/admin/brand/${brandId}/builder/${child.id}`}
                                className="flex items-center gap-1.5 flex-1 truncate"
                              >
                                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{getTitle(child)}</span>
                              </Link>
                            </div>

                            {/* Subpage Actions */}
                            <div className="flex items-center gap-1">
                              {child.menuStyle === "hidden" && (
                                <span title="Skryté vo verejnom menu">
                                  <EyeOff className="h-3 w-3 text-muted-foreground/60 mr-1" />
                                </span>
                              )}

                              {isDuplicatingChild ? (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              ) : (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(
                                        activeMenuId === child.id ? null : child.id
                                      );
                                    }}
                                    className="p-1 hover:text-foreground text-muted-foreground/60 hover:bg-neutral-800 rounded-[2px] transition-colors"
                                    title="Možnosti podstránky"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>

                                  {activeMenuId === child.id && (
                                    <div
                                      ref={menuRef}
                                      className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-border/80 rounded-[3px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRename(child)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                                      >
                                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Premenovať</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDuplicatePage(child.id)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                                      >
                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Duplikovať</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleVisibility(child.id)}
                                        className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-800/80 flex items-center gap-2"
                                      >
                                        {child.menuStyle === "hidden" ? (
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
                                        onClick={() =>
                                          handleDeletePage(child.id, getTitle(child))
                                        }
                                        className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Zmazať podstránku</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {isChildAfterTarget && (
                            <div className="h-0.5 w-full bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] my-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
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
