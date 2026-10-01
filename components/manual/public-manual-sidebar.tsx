"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, FileText, Search, Folder, FolderOpen, BookOpen } from "lucide-react";
import { PublishedPageItem } from "@/actions/publish";

interface PublicManualSidebarProps {
  pages: PublishedPageItem[];
  currentPageSlug?: string;
  domain: string;
  locale: string;
  onPageSelect?: () => void;
  className?: string;
}

export function PublicManualSidebar({
  pages,
  currentPageSlug,
  domain,
  locale = "en",
  onPageSelect,
  className = "",
}: PublicManualSidebarProps) {
  const [search, setSearch] = useState("");
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  // Localized helper
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  // Build tree from published pages
  const { rootNodes, childrenMap } = useMemo(() => {
    const visiblePages = pages.filter((p) => p.isInMenu !== false);
    const roots: PublishedPageItem[] = [];
    const children = new Map<string, PublishedPageItem[]>();

    visiblePages.forEach((p) => {
      if (!p.parent) {
        roots.push(p);
      } else {
        if (!children.has(p.parent)) {
          children.set(p.parent, []);
        }
        children.get(p.parent)!.push(p);
      }
    });

    return { rootNodes: roots, childrenMap: children };
  }, [pages]);

  const toggleCollapse = (pageId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [pageId]: !prev[pageId],
    }));
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

  return (
    <aside className={`w-full flex flex-col h-full bg-card/60 select-none ${className}`}>
      {/* Search Input */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={locale === "en" ? "Search guidelines..." : "Hľadať v manuáli..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/30 border border-border/60 rounded-[3px] focus:outline-none focus:border-primary/80 placeholder:text-muted-foreground transition-colors"
          />
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {filteredPages ? (
          // Flat search results
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground">
              {locale === "en" ? `Results (${filteredPages.length})` : `Výsledky (${filteredPages.length})`}
            </div>
            {filteredPages.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
                {locale === "en" ? "No pages found." : "Nenašli sa žiadne stránky."}
              </div>
            ) : (
              filteredPages.map((page) => {
                const isActive = page.slug === currentPageSlug;
                const title = getLocalized(page.title) || page.slug;

                return (
                  <Link
                    key={page.id}
                    href={`/manual/${domain}/${locale}/${page.slug}`}
                    onClick={onPageSelect}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-xs transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{title}</span>
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          // Hierarchical tree view
          rootNodes.map((rootPage) => {
            const children = childrenMap.get(rootPage.id) || [];
            const hasChildren = children.length > 0;
            const isCollapsed = collapsedParents[rootPage.id] || false;
            const isActive = rootPage.slug === currentPageSlug;
            const rootTitle = getLocalized(rootPage.title) || rootPage.slug;

            return (
              <div key={rootPage.id} className="space-y-0.5">
                <div
                  className={`group flex items-center justify-between rounded-[2px] text-xs transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Link
                    href={`/manual/${domain}/${locale}/${rootPage.slug}`}
                    onClick={onPageSelect}
                    className="flex-1 flex items-center gap-2 px-2.5 py-1.5 truncate"
                  >
                    {hasChildren ? (
                      <Folder className="h-3.5 w-3.5 shrink-0 opacity-70 text-muted-foreground" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    )}
                    <span className="truncate">{rootTitle}</span>
                  </Link>

                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => toggleCollapse(rootPage.id)}
                      className="p-1.5 mr-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-[2px]"
                      aria-label="Toggle chapter"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-pages */}
                {hasChildren && !isCollapsed && (
                  <div className="pl-4 ml-2 border-l border-border/40 space-y-0.5">
                    {children.map((child) => {
                      const isChildActive = child.slug === currentPageSlug;
                      const childTitle = getLocalized(child.title) || child.slug;

                      return (
                        <Link
                          key={child.id}
                          href={`/manual/${domain}/${locale}/${child.slug}`}
                          onClick={onPageSelect}
                          className={`flex items-center gap-2 px-2 py-1 rounded-[2px] text-xs transition-colors ${
                            isChildActive
                              ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <FileText className="h-3 w-3 shrink-0 opacity-60" />
                          <span className="truncate">{childTitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
