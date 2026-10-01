"use client";

import React from "react";
import { ChevronRight, FileQuestion } from "lucide-react";
import { PublishedPageItem } from "@/actions/publish";
import { ContainerRenderer } from "./container-renderer";

export interface PageRendererProps {
  page: PublishedPageItem;
  locale?: string;
  brandName?: string;
  showPageHeader?: boolean;
  className?: string;
}

/**
 * PageRenderer:
 * The recursive interpreter component that translates raw page JSON tree into a
 * responsive, production-ready brand manual page.
 * - Renders clean page header (H1 title + breadcrumbs)
 * - Iterates through page.containers and renders <ContainerRenderer /> for each
 * - Provides graceful empty-state handling if page has no containers
 */
export function PageRenderer({
  page,
  locale = "en",
  brandName,
  showPageHeader = true,
  className = "",
}: PageRendererProps) {
  // 1. Localized title resolution
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  const pageTitle = getLocalized(page.title) || "Kapitola";

  // 2. Sort containers by order
  const sortedContainers = [...(page.containers || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <article className={`page-renderer w-full max-w-5xl mx-auto space-y-10 sm:space-y-12 ${className}`}>
      {/* 3. Page Header (H1 Title + Breadcrumb Trail) */}
      {showPageHeader && (
        <header className="page-header space-y-3 border-b border-border/40 pb-6 sm:pb-8">
          {brandName && (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>{brandName}</span>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
              <span className="text-foreground font-semibold truncate">{pageTitle}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {pageTitle}
          </h1>
        </header>
      )}

      {/* 4. Page Containers Stack */}
      {sortedContainers.length === 0 ? (
        <div className="empty-page-state py-16 px-6 text-center rounded-xl border border-dashed border-border/50 bg-card/20 space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Táto kapitola zatiaľ neobsahuje žiadny obsah
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Administrátor zatiaľ nepridal žiadne riadky ani moduly do tejto časti brand manuálu.
            </p>
          </div>
        </div>
      ) : (
        <div className="containers-stack space-y-10 sm:space-y-12">
          {sortedContainers.map((container) => (
            <ContainerRenderer
              key={container.id}
              container={container}
              locale={locale}
            />
          ))}
        </div>
      )}
    </article>
  );
}
