"use client";

import React from "react";
import { PublishedContainerItem } from "@/actions/publish";
import { ModuleDispatcher } from "@/components/modules/dispatcher";

export interface ContainerRendererProps {
  container: PublishedContainerItem;
  locale?: string;
  className?: string;
}

/**
 * Maps ContainerLayoutType to responsive Tailwind Grid classes.
 * Ensures mobile column wrapping (grid-cols-1) and breakpoint expansion on md/lg.
 */
function getLayoutGridClass(layoutType: string): string {
  switch (layoutType) {
    case "FULL":
      return "grid-cols-1";
    case "HALF_HALF":
      return "grid-cols-1 md:grid-cols-2";
    case "THREE_EQUAL":
      return "grid-cols-1 md:grid-cols-3";
    case "ONE_THIRD_TWO_THIRDS":
      return "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-1 [&>*:last-child]:md:col-span-2";
    case "TWO_THIRDS_ONE_THIRD":
      return "grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-2 [&>*:last-child]:md:col-span-1";
    case "CUSTOM":
      return "grid-cols-1 md:grid-cols-2";
    default:
      return "grid-cols-1 md:grid-cols-2";
  }
}

/**
 * ContainerRenderer:
 * Renders a single row/container from the published snapshot.
 * - Manages optional H2 section title
 * - Applies container background color & height constraints
 * - Creates a responsive CSS Grid
 * - Iterates over columns and delegates modules to ModuleDispatcher
 */
export function ContainerRenderer({
  container,
  locale = "en",
  className = "",
}: ContainerRendererProps) {
  // 1. Localized H2 title resolution
  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  const h2TitleText = getLocalized(container.h2Title);

  // 2. Container style computation (custom background & height mode)
  const containerStyle: React.CSSProperties = {};
  const hasCustomBg = Boolean(container.backgroundColor && container.backgroundColor.trim() !== "");

  if (hasCustomBg) {
    containerStyle.backgroundColor = container.backgroundColor;
  }

  if (container.heightMode === "FIXED" && container.fixedHeight && container.fixedHeight > 0) {
    containerStyle.minHeight = `${container.fixedHeight}px`;
  }

  // 3. Grid style computation (custom column widths support)
  const gridStyle: React.CSSProperties = {};
  if (
    container.layoutType === "CUSTOM" &&
    Array.isArray(container.columnWidths) &&
    container.columnWidths.length > 0
  ) {
    gridStyle.gridTemplateColumns = container.columnWidths.map((w) => `${w}fr`).join(" ");
  }

  // 4. Sort columns by order
  const sortedColumns = [...(container.columns || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <section
      className={`container-renderer w-full space-y-4 ${
        hasCustomBg ? "p-6 sm:p-8 rounded-lg border border-border/40 shadow-xs" : ""
      } ${className}`}
      style={containerStyle}
    >
      {/* Optional H2 Section Heading */}
      {container.showH2 && h2TitleText && (
        <div className="pb-3 border-b border-border/40 mb-6">
          <h2
            style={{ color: "var(--brand-heading-color, var(--foreground))" }}
            className="text-xl sm:text-2xl font-bold tracking-tight"
          >
            {h2TitleText}
          </h2>
        </div>
      )}

      {/* Responsive Columns Grid */}
      <div
        className={`grid gap-6 lg:gap-8 ${getLayoutGridClass(container.layoutType)}`}
        style={gridStyle}
      >
        {sortedColumns.map((column) => {
          const sortedModules = [...(column.modules || [])].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
          );

          const colStyle: React.CSSProperties = {};
          const hasColBg = Boolean(column.backgroundColor && column.backgroundColor.trim() !== "");
          if (hasColBg) {
            colStyle.backgroundColor = column.backgroundColor;
          }

          return (
            <div
              key={column.id}
              className={`column-wrapper space-y-6 flex flex-col min-w-0 ${
                hasColBg ? "p-4 sm:p-6 rounded-md border border-border/30" : ""
              }`}
              style={colStyle}
            >
              {sortedModules.map((mod) => (
                <div key={mod.id} className="module-item w-full">
                  <ModuleDispatcher
                    module={{
                      id: mod.id,
                      moduleType: mod.moduleType,
                      order: mod.order,
                      showH3: mod.showH3,
                      h3Title: mod.h3Title,
                      config: mod.config,
                      linkGroupId: undefined, // linkGroupId is ignored on public site
                    }}
                    locale={locale}
                    isEditor={false}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
