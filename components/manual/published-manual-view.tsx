"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Layers, ShieldAlert, Sparkles, ChevronRight, Hash } from "lucide-react";
import { PublishedBrandSnapshot, PublishedPageItem, PublishedContainerItem } from "@/actions/publish";
import { ModuleDispatcher } from "@/components/modules/dispatcher";

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

  const activePage = pages.find((p) => p.id === activePageId) || defaultPage;

  // Localized helper
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  const activePageTitle = getLocalized(activePage.title) || "Kapitola";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
      {/* Chapter Navigation Tabs */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
        {pages
          .filter((p) => p.isInMenu !== false)
          .map((page) => {
            const isActive = page.id === activePage.id;
            const title = getLocalized(page.title);

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => setActivePageId(page.id)}
                className={`px-3.5 py-1.5 rounded-[2px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span>{title}</span>
              </button>
            );
          })}
      </nav>

      {/* Active Page Header */}
      <div className="space-y-2 border-b border-border/30 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>{snapshot.brand.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">{activePageTitle}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          {activePageTitle}
        </h1>
      </div>

      {/* Containers Stack */}
      <div className="space-y-10">
        {activePage.containers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground italic">
            Táto kapitola neobsahuje žiadny obsah.
          </div>
        ) : (
          activePage.containers.map((container, cIdx) => {
            const h2TitleText = getLocalized(container.h2Title);

            return (
              <section key={container.id} className="space-y-4">
                {/* Optional H2 Section Heading */}
                {container.showH2 && h2TitleText && (
                  <div className="pt-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/40 pb-2">
                      {h2TitleText}
                    </h2>
                  </div>
                )}

                {/* Columns Grid */}
                <div
                  className={`grid gap-6 ${
                    container.layoutType === "FULL"
                      ? "grid-cols-1"
                      : container.layoutType === "HALF_HALF"
                      ? "grid-cols-1 md:grid-cols-2"
                      : container.layoutType === "THREE_EQUAL"
                      ? "grid-cols-1 md:grid-cols-3"
                      : container.layoutType === "ONE_THIRD_TWO_THIRDS"
                      ? "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-1 [&>*:last-child]:md:col-span-2"
                      : container.layoutType === "TWO_THIRDS_ONE_THIRD"
                      ? "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-2 [&>*:last-child]:md:col-span-1"
                      : "grid-cols-1 md:grid-cols-2"
                  }`}
                >
                  {container.columns.map((column) => (
                    <div key={column.id} className="space-y-6">
                      {column.modules.map((mod) => (
                        <div key={mod.id} className="space-y-2">
                          <ModuleDispatcher
                            module={{
                              id: mod.id,
                              moduleType: mod.moduleType,
                              order: mod.order,
                              showH3: mod.showH3,
                              h3Title: mod.h3Title,
                              config: mod.config,
                              linkGroupId: undefined, // linkGroupId je na verejnom webe ignorované
                            }}
                            locale={locale}
                            isEditor={false}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
