"use client";

import React from "react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { resolveI18nText } from "@/lib/validations/module";

export default function M01NadpisModule({
  moduleType = "M01_Nadpis",
  showH3 = true,
  h3Title,
  config,
  locale = "en",
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius, resolveColor, resolveStyles } = useBrandCascade();
  const radius = resolveRadius(config?.styleOverrides);
  const bgColor = resolveColor(config?.styleOverrides?.backgroundColor, "secondary");
  const headingText = resolveI18nText(h3Title, locale) || "M01 Nadpis";

  return (
    <section
      className="p-5 border border-border/50 transition-all duration-200 shadow-2xs space-y-3"
      style={{
        borderRadius: radius,
        backgroundColor: bgColor,
        ...resolveStyles(config?.styleOverrides),
      }}
      aria-label="M01 Nadpis"
    >
      {showH3 && (
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            {headingText}
          </h3>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] bg-neutral-900/60 border border-border/40 text-muted-foreground">
            M01_Nadpis
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Hierarchické typografické nadpisy a delenia kapitol.
      </p>
    </section>
  );
}
