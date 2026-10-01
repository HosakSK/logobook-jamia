"use client";

import React, { useState } from "react";
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
  FolderPlus,
} from "lucide-react";
import { PageItem, PageHierarchyItem } from "@/lib/types/page";
import { createPageAction, deletePageAction } from "@/actions/pages";
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
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [newMenuStyle, setNewMenuStyle] = useState<"main" | "submenu" | "hidden">("main");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Naozaj chcete zmazať stránku "${pageTitle}" vrátane všetkých jej riadkov a modulov?`)) {
      return;
    }

    try {
      const res = await deletePageAction(pageId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa zmazať stránku.");
        return;
      }

      // If active page was deleted, redirect to builder index
      if (currentPageId === pageId) {
        router.push(`/admin/brand/${brandId}/builder`);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Chyba pri zmazaní stránky.");
    }
  };

  const getTitle = (p: PageItem) => {
    return p.title?.sk || p.title?.en || "Bez názvu";
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
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsCreating(true)}
          className="h-7 px-2 text-[11px] gap-1 rounded-[2px] border-border/60 hover:border-primary/50 text-foreground"
        >
          <Plus className="h-3 w-3" />
          <span>Pridať</span>
        </Button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreatePage}
          className="p-3 rounded-[3px] bg-neutral-950/80 border border-primary/40 space-y-3 shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Nová stránka manuálu</span>
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

          {pages.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Zanorenie (Rodičovská stránka)
              </Label>
              <select
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="w-full h-7 rounded-[2px] bg-neutral-900 border border-border/50 text-xs px-2 text-foreground"
              >
                <option value="">— Hlavná úroveň (Koreň) —</option>
                {pages.map((p) => (
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

      {/* Pages Tree Navigation */}
      <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Žiadne stránky. Kliknite na <strong>+ Pridať</strong> pre vytvorenie prvej podstránky.
          </div>
        ) : (
          tree.map((node) => (
            <div key={node.id} className="space-y-1">
              {/* Level 1 Chapter Item */}
              <div
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-xs transition-all ${
                  currentPageId === node.id
                    ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                    : "text-foreground hover:bg-neutral-800/40"
                }`}
              >
                <Link
                  href={`/admin/brand/${brandId}/builder/${node.id}`}
                  className="flex items-center gap-2 flex-1 truncate"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span className="truncate">{getTitle(node)}</span>
                </Link>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {node.menuStyle === "hidden" && (
                    <span title="Skryté v menu">
                      <EyeOff className="h-3 w-3 text-muted-foreground/60" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeletePage(node.id, getTitle(node))}
                    className="p-1 hover:text-rose-400 text-muted-foreground transition-colors"
                    title="Zmazať stránku"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Level 2 Sub-Pages */}
              {node.children && node.children.length > 0 && (
                <div className="pl-4 border-l border-border/30 space-y-1 ml-2">
                  {node.children.map((child) => (
                    <div
                      key={child.id}
                      className={`group flex items-center justify-between px-2 py-1 rounded-[2px] text-xs transition-all ${
                        currentPageId === child.id
                          ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                          : "text-foreground hover:bg-neutral-800/40"
                      }`}
                    >
                      <Link
                        href={`/admin/brand/${brandId}/builder/${child.id}`}
                        className="flex items-center gap-1.5 flex-1 truncate"
                      >
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{getTitle(child)}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeletePage(child.id, getTitle(child))}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-muted-foreground transition-opacity"
                        title="Zmazať podstránku"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </nav>
    </aside>
  );
}
