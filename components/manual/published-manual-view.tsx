"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Layers, ShieldAlert, Sparkles, ChevronRight, Hash } from "lucide-react";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PageRenderer } from "./page-renderer";
import { isSubdomainOrCustomHost } from "@/lib/domains";

interface PublishedManualViewProps {
  snapshot: PublishedBrandSnapshot | null;
  brandSlug: string;
  initialPageSlug?: string;
  locale?: string;
}

export function PublishedManualView({
  snapshot,
  brandSlug,
  initialPageSlug,
  locale = "en",
}: PublishedManualViewProps) {
  // 1. Empty / Unpublished State
  if (!snapshot || !snapshot.pages || snapshot.pages.length === 0) {
    return (
      <div className="container mx-auto px-6 py-20 max-w-3xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Brand manuál zatiaľ nebol publikovaný
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Tento brand manuál je v súčasnosti v štádiu prípravy. Akonáhle administrátor publikuje prvú verziu,
            zobrazí sa tu kompletný vizuálny systém.
          </p>
        </div>
        <div className="pt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-muted/60 text-muted-foreground border border-border/50">
            <span>Stav: Koncept (Draft)</span>
          </span>
        </div>
      </div>
    );
  }

  const pages = snapshot.pages;

  // 2. Active Page Resolution
  const defaultPage = pages.find((p) => p.slug === initialPageSlug) || pages[0];
  const [activePageId, setActivePageId] = useState<string>(defaultPage.id);

  useEffect(() => {
    if (initialPageSlug) {
      const match = pages.find((p) => p.slug === initialPageSlug);
      if (match) {
        setActivePageId(match.id);
      }
    }
  }, [initialPageSlug, pages]);

  const activePage = pages.find((p) => p.id === activePageId) || defaultPage;

  // Localized helper
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  // Root navigation chapters (e.g. Logo, Farby, Typografia)
  const rootChapters = pages.filter((p) => !p.parent && p.isInMenu !== false && p.slug !== "uvod");

  // Helper: check if active page belongs to root chapter
  const isChapterActive = (rootPage: typeof pages[0]) => {
    if (activePage.id === rootPage.id || activePage.slug === rootPage.slug) return true;
    let curr: typeof pages[0] | undefined = activePage;
    while (curr && curr.parent) {
      if (curr.parent === rootPage.id) return true;
      curr = pages.find((p) => p.id === curr!.parent);
    }
    return false;
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Chapter Navigation Tabs (Only shown if multiple top-level sections exist) */}
      {rootChapters.length > 1 && (
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
          {rootChapters.map((page) => {
            const isActive = isChapterActive(page);
            const title = getLocalized(page.title) || page.slug;
            const href = `/${page.slug}`;

            return (
              <Link
                key={page.id}
                href={href}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span>{title}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Recursive Page Tree & Container Grid Renderer */}
      <PageRenderer
        page={activePage}
        allPages={pages}
        brandSlug={brandSlug}
        locale={locale}
        brandName={snapshot.brand.name}
        showPageHeader={true}
      />
    </div>
  );
}
