"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { ModuleErrorBoundary } from "./module-error-boundary";
import { ModuleLoadingSkeleton } from "./module-loading-skeleton";
import { HelpCircle } from "lucide-react";

/**
 * 1. Module-level Code Splitting:
 * All 25 modules (M01 - M25) are loaded strictly via next/dynamic.
 * This guarantees minimal initial bundle size and ensures chunks are only
 * requested over the wire when rendered on the active page.
 */
const M01_Nadpis = dynamic(() => import("@/components/modules/catalog/m01-nadpis"), {
  loading: () => <ModuleLoadingSkeleton height="80px" />,
});
const M02_RichText = dynamic(() => import("@/components/modules/catalog/m02-rich-text"), {
  loading: () => <ModuleLoadingSkeleton height="100px" />,
});
const M03_Banner = dynamic(() => import("@/components/modules/catalog/m03-banner"), {
  loading: () => <ModuleLoadingSkeleton height="160px" />,
});
const M04_Razcestnik = dynamic(() => import("@/components/modules/catalog/m04-razcestnik"), {
  loading: () => <ModuleLoadingSkeleton height="140px" />,
});
const M05_DownloadTlacidlo = dynamic(() => import("@/components/modules/catalog/m05-download-button"), {
  loading: () => <ModuleLoadingSkeleton height="60px" />,
});
const M06_OddelovacMedzera = dynamic(() => import("@/components/modules/catalog/m06-separator"), {
  loading: () => <ModuleLoadingSkeleton height="40px" />,
});
const M07_ZobrazenieLoga = dynamic(() => import("@/components/modules/catalog/m07-logo-viewer"), {
  loading: () => <ModuleLoadingSkeleton height="220px" />,
});
const M08_OchrannaZonaLoga = dynamic(() => import("@/components/modules/catalog/m08-clearance-zone"), {
  loading: () => <ModuleLoadingSkeleton height="240px" />,
});
const M09_MinimalnaVelkostLoga = dynamic(() => import("@/components/modules/catalog/m09-min-size"), {
  loading: () => <ModuleLoadingSkeleton height="140px" />,
});
const M10_ObrazokGaleria = dynamic(() => import("@/components/modules/catalog/m10-gallery"), {
  loading: () => <ModuleLoadingSkeleton height="260px" />,
});
const M11_MaticaLogotypov = dynamic(() => import("@/components/modules/catalog/m11-logo-matrix"), {
  loading: () => <ModuleLoadingSkeleton height="240px" />,
});
const M12_KartaFarby = dynamic(() => import("@/components/modules/catalog/m12-color-card"), {
  loading: () => <ModuleLoadingSkeleton height="180px" />,
});
const M13_PaletaFarieb = dynamic(() => import("@/components/modules/catalog/m13-color-palette"), {
  loading: () => <ModuleLoadingSkeleton height="200px" />,
});
const M14_TonalSteps = dynamic(() => import("@/components/modules/catalog/m14-tonal-steps"), {
  loading: () => <ModuleLoadingSkeleton height="140px" />,
});
const M15_NeutralneASystemovePodklady = dynamic(() => import("@/components/modules/catalog/m15-neutral-backgrounds"), {
  loading: () => <ModuleLoadingSkeleton height="150px" />,
});
const M16_VzorkovnikyAPaletyNaStiahnutie = dynamic(() => import("@/components/modules/catalog/m16-palette-downloads"), {
  loading: () => <ModuleLoadingSkeleton height="120px" />,
});
const M17_UniverzalnaEdukativnaTabulka = dynamic(() => import("@/components/modules/catalog/m17-guidelines-table"), {
  loading: () => <ModuleLoadingSkeleton height="220px" />,
});
const M18_Typografia = dynamic(() => import("@/components/modules/catalog/m18-typography"), {
  loading: () => <ModuleLoadingSkeleton height="280px" />,
});
const M19_Patterny = dynamic(() => import("@/components/modules/catalog/m19-patterns"), {
  loading: () => <ModuleLoadingSkeleton height="220px" />,
});
const M20_DosAndDonts = dynamic(() => import("@/components/modules/catalog/m20-dos-and-donts"), {
  loading: () => <ModuleLoadingSkeleton height="220px" />,
});
const M21_FiremnaVizitka = dynamic(() => import("@/components/modules/catalog/m21-business-card"), {
  loading: () => <ModuleLoadingSkeleton height="200px" />,
});
const M22_EmailPodpis = dynamic(() => import("@/components/modules/catalog/m22-email-signature"), {
  loading: () => <ModuleLoadingSkeleton height="180px" />,
});
const M23_SocialMedia = dynamic(() => import("@/components/modules/catalog/m23-social-media"), {
  loading: () => <ModuleLoadingSkeleton height="200px" />,
});
const M24_FiremneTapetyAPozadia = dynamic(() => import("@/components/modules/catalog/m24-wallpapers"), {
  loading: () => <ModuleLoadingSkeleton height="180px" />,
});
const M25_KniznicaIkon = dynamic(() => import("@/components/modules/catalog/m25-icon-library"), {
  loading: () => <ModuleLoadingSkeleton height="240px" />,
});

/**
 * Registry mapping module types to their code-split dynamic components
 */
const MODULE_REGISTRY: Record<string, React.ComponentType<ModuleRenderProps<BaseModuleConfig>>> = {
  M01_Nadpis,
  M02_RichText,
  M03_Banner,
  M04_Razcestnik,
  M05_DownloadTlacidlo,
  M06_OddelovacMedzera,
  M07_ZobrazenieLoga,
  M08_OchrannaZonaLoga,
  M09_MinimalnaVelkostLoga,
  M10_ObrazokGaleria,
  M11_MaticaLogotypov,
  M12_KartaFarby,
  M13_PaletaFarieb,
  M14_TonalSteps,
  M15_NeutralneASystemovePodklady,
  M16_VzorkovnikyAPaletyNaStiahnutie,
  M17_UniverzalnaEdukativnaTabulka,
  M18_Typografia,
  M19_Patterny,
  M20_DosAndDonts,
  M21_FiremnaVizitka,
  M22_EmailPodpis,
  M23_SocialMedia,
  M24_FiremneTapetyAPozadia,
  M25_KniznicaIkon,
  M25_ICON_LIBRARY: M25_KniznicaIkon,
};

export interface ModuleData {
  id?: string;
  moduleType: string;
  order?: number;
  showH3?: boolean;
  h3Title?: Record<string, string>;
  config?: BaseModuleConfig;
  linkGroupId?: string;
}

export interface ModuleDispatcherProps {
  module: ModuleData;
  locale?: string;
  isEditor?: boolean;
  onConfigChange?: (newConfig: BaseModuleConfig) => void;
  className?: string;
}

/**
 * ModuleDispatcher: The central factory router for all brand manual modules.
 * - Resolves moduleType to its dynamic React chunk
 * - Wraps execution in ModuleErrorBoundary (zero white screens)
 * - Provides graceful degradation for unrecognized or damaged module configs
 */
export function ModuleDispatcher({
  module,
  locale = "en",
  isEditor = false,
  onConfigChange,
  className = "",
}: ModuleDispatcherProps) {
  const Component = MODULE_REGISTRY[module.moduleType];

  return (
    <div className={`module-dispatch-item ${className}`}>
      <ModuleErrorBoundary
        moduleType={module.moduleType}
        moduleId={module.id}
        isEditor={isEditor}
        fallbackMessage="Obsah sa pripravuje."
      >
        {Component ? (
          <Component
            id={module.id}
            moduleType={module.moduleType}
            order={module.order}
            showH3={module.showH3}
            h3Title={module.h3Title}
            config={module.config || {}}
            locale={locale}
            isEditor={isEditor}
            onConfigChange={onConfigChange}
          />
        ) : (
          <UnknownModuleFallback moduleType={module.moduleType} isEditor={isEditor} />
        )}
      </ModuleErrorBoundary>
    </div>
  );
}

/**
 * Safe fallback rendered when a moduleType is not in the registry
 */
function UnknownModuleFallback({
  moduleType,
  isEditor,
}: {
  moduleType: string;
  isEditor: boolean;
}) {
  if (isEditor) {
    return (
      <div className="p-4 rounded-[3px] border border-amber-500/40 bg-amber-950/20 text-amber-200 text-xs flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          Neznámy typ modulu: <strong className="font-mono text-amber-300">{moduleType}</strong>.
          Skontrolujte zoznam podporovaných stavebných blokov (M01-M25).
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-[3px] border border-border/30 bg-card/20 text-center text-xs text-muted-foreground">
      Obsah sa pripravuje.
    </div>
  );
}
