"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, FileText, Search, Folder, FolderOpen } from "lucide-react";
import { PublishedPageItem } from "@/actions/publish";
import { isSubdomainOrCustomHost } from "@/lib/domains";

interface TreeNodeItem extends PublishedPageItem {
  children: TreeNodeItem[];
}

interface PublicManualSidebarProps {
  pages: PublishedPageItem[];
  currentPageSlug?: string;
  domain: string;
  locale: string;
  onPageSelect?: () => void;
  className?: string;
}

// Helper: collect all parent IDs of a specific page
function collectAncestorIds(tree: TreeNodeItem[], targetSlugOrId: string, ancestors: string[] = []): string[] | null {
  for (const node of tree) {
    if (node.id === targetSlugOrId || node.slug === targetSlugOrId) {
      return ancestors;
    }
    if (node.children && node.children.length > 0) {
      const found = collectAncestorIds(node.children, targetSlugOrId, [...ancestors, node.id]);
      if (found) return found;
    }
  }
  return null;
}

// Helper: collect all node IDs with children
function collectAllParentIds(tree: TreeNodeItem[]): string[] {
  const ids: string[] = [];
  function traverse(nodes: TreeNodeItem[]) {
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

export function PublicManualSidebar({
  pages,
  currentPageSlug,
  domain,
  locale = "en",
  onPageSelect,
  className = "",
}: PublicManualSidebarProps) {
  const params = useParams();
  const routePageSlug = params?.pageSlug as string | undefined;
  const activeSlug = currentPageSlug || routePageSlug || (pages[0]?.slug);

  const [search, setSearch] = useState("");

  // Localized helper
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.sk || textObj.en || textObj.cs || Object.values(textObj)[0] || "";
  };

  // Build recursive multi-level hierarchy tree
  const tree = useMemo<TreeNodeItem[]>(() => {
    const visiblePages = pages;
    const itemMap = new Map<string, TreeNodeItem>();

    visiblePages.forEach((p) => {
      itemMap.set(p.id, { ...p, children: [] });
    });

    const roots: TreeNodeItem[] = [];

    visiblePages.forEach((p) => {
      const node = itemMap.get(p.id)!;
      if (p.parent && itemMap.has(p.parent)) {
        itemMap.get(p.parent)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [pages]);

  // Expanded nodes state (Set of node IDs) - default collapsed
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeSlug) {
      const ancestors = collectAncestorIds(tree, activeSlug);
      if (ancestors) {
        ancestors.forEach((id) => initial.add(id));
      }
    }
    return initial;
  });

  // Auto-expand ancestors when activeSlug or tree changes
  useEffect(() => {
    if (activeSlug && tree.length > 0) {
      const ancestors = collectAncestorIds(tree, activeSlug);
      if (ancestors && ancestors.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          ancestors.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [activeSlug, tree]);

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

  // Resolve target link URL
  const getPageHref = (slug: string) => {
    if (typeof window !== "undefined") {
      if (isSubdomainOrCustomHost()) {
        return slug ? `/${slug}` : "/";
      }

      const path = window.location.pathname;
      if (path.startsWith("/manual/")) {
        return `/manual/${domain}/${locale}/${slug}`;
      }
    }
    return `/m/${domain}/${slug}`;
  };

  // Search filtering
  const filteredPages = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return pages.filter((p) => {
      const title = getLocalized(p.title).toLowerCase();
      const slug = p.slug.toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  }, [pages, search, locale]);

  // Recursive tree node renderer
  const renderTreeNode = (node: TreeNodeItem, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isCurrent = node.slug === activeSlug || node.id === activeSlug;
    const title = getLocalized(node.title) || node.slug;
    const href = getPageHref(node.slug || node.id);

    return (
      <div key={node.id} className="relative space-y-0.5">
        <div
          className={`group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors ${
            isCurrent
              ? "bg-black/[0.05] dark:bg-white/[0.08] shadow-xs"
              : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
          }`}
          style={{
            paddingLeft: `${Math.max(8, depth * 12 + 8)}px`,
          }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors shrink-0 cursor-pointer"
                style={{ color: "var(--muted-foreground)" }}
                title={isExpanded ? "Zbaliť" : "Rozbaliť"}
              >
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-150 ${
                    isExpanded ? "rotate-90 text-foreground" : ""
                  }`}
                />
              </button>
            ) : (
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <FileText
                  className="h-3.5 w-3.5 opacity-50 shrink-0"
                  style={{
                    color: isCurrent
                      ? "var(--brand-color-primary, #c8d400)"
                      : "var(--muted-foreground)",
                  }}
                />
              </div>
            )}

            {/* Title Link */}
            <Link
              href={href}
              onClick={onPageSelect}
              className={`flex items-center gap-2 flex-1 truncate py-0.5 cursor-pointer ${
                isCurrent
                  ? "font-semibold"
                  : "text-muted-foreground hover:text-foreground font-normal"
              }`}
              style={{
                color: isCurrent ? "var(--foreground)" : undefined,
              }}
              title={title}
            >
              {hasChildren &&
                (isExpanded ? (
                  <FolderOpen
                    className="h-3.5 w-3.5 shrink-0 opacity-80"
                    style={{
                      color: isCurrent
                        ? "var(--brand-color-primary, var(--primary, #c8d400))"
                        : "var(--muted-foreground)",
                    }}
                  />
                ) : (
                  <Folder
                    className="h-3.5 w-3.5 shrink-0 opacity-60"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                ))}
              <span className="truncate">{title}</span>
            </Link>

            {/* Subtle Active Pill Dot */}
            {isCurrent && (
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0 mr-1"
                style={{ backgroundColor: "var(--brand-color-primary, #c8d400)" }}
              />
            )}
          </div>
        </div>

        {/* Recursive Child Nodes */}
        {hasChildren && isExpanded && (
          <div
            className="border-l ml-3.5 space-y-0.5"
            style={{ borderColor: "var(--border)" }}
          >
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`w-full flex flex-col h-full select-none ${className}`}
      style={{
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
      }}
    >
      {/* Search Input inside Drawer */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-3.5 h-3.5">
            <Search className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <input
            type="text"
            placeholder={
              locale === "sk"
                ? "Filtrovať kapitoly..."
                : locale === "cs"
                ? "Filtrovat kapitoly..."
                : "Filter chapters..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: "2.25rem",
              paddingRight: "1rem",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
            }}
            className="w-full py-1.5 text-xs border rounded-[3px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-colors"
          />
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin">
        {filteredPages ? (
          // Flat search results
          <div className="space-y-1">
            <div
              className="px-2 py-1 text-[10px] font-mono uppercase"
              style={{ color: "var(--muted-foreground)" }}
            >
              {locale === "sk"
                ? `Výsledky (${filteredPages.length})`
                : locale === "cs"
                ? `Výsledky (${filteredPages.length})`
                : `Results (${filteredPages.length})`}
            </div>
            {filteredPages.length === 0 ? (
              <div
                className="px-2 py-4 text-center text-xs italic"
                style={{ color: "var(--muted-foreground)" }}
              >
                {locale === "sk"
                  ? "Nenašli sa žiadne stránky."
                  : locale === "cs"
                  ? "Nebyly nalezeny žádné stránky."
                  : "No pages found."}
              </div>
            ) : (
              filteredPages.map((page) => {
                const isCurrent = page.slug === activeSlug || page.id === activeSlug;
                const title = getLocalized(page.title) || page.slug;
                const href = getPageHref(page.slug || page.id);

                return (
                  <Link
                    key={page.id}
                    href={href}
                    onClick={onPageSelect}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? "bg-black/[0.05] dark:bg-white/[0.08] font-semibold text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText
                        className="h-3.5 w-3.5 shrink-0 opacity-60"
                        style={{
                          color: isCurrent
                            ? "var(--brand-color-primary, #c8d400)"
                            : "var(--muted-foreground)",
                        }}
                      />
                      <span className="truncate">{title}</span>
                    </div>
                    {isCurrent && (
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--brand-color-primary, #c8d400)" }}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          // Recursive hierarchical tree
          tree.map((rootNode) => renderTreeNode(rootNode, 0))
        )}
      </div>
    </aside>
  );
}

