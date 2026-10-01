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
 * Registry mapping module types and aliases to their code-split dynamic components
 */
const MODULE_REGISTRY: Record<string, React.ComponentType<ModuleRenderProps<BaseModuleConfig>>> = {
  // M01
  M01_Nadpis,
  M01_HEADING: M01_Nadpis,
  M01: M01_Nadpis,

  // M02
  M02_RichText,
  M02_RICH_TEXT: M02_RichText,
  M02: M02_RichText,

  // M03
  M03_Banner,
  M03_BANNER: M03_Banner,
  M03: M03_Banner,

  // M04
  M04_Razcestnik,
  M04_RAZCESTNIK: M04_Razcestnik,
  M04_NAVIGATION: M04_Razcestnik,
  M04: M04_Razcestnik,

  // M05
  M05_DownloadTlacidlo,
  M05_DOWNLOAD_BUTTON: M05_DownloadTlacidlo,
  M05: M05_DownloadTlacidlo,

  // M06
  M06_OddelovacMedzera,
  M06_SEPARATOR: M06_OddelovacMedzera,
  M06: M06_OddelovacMedzera,

  // M07
  M07_ZobrazenieLoga,
  M07_ASSET_VIEWER: M07_ZobrazenieLoga,
  M07_LOGO_VIEWER: M07_ZobrazenieLoga,
  M07: M07_ZobrazenieLoga,

  // M08
  M08_OchrannaZonaLoga,
  M08_CLEARANCE_ZONE: M08_OchrannaZonaLoga,
  M08: M08_OchrannaZonaLoga,

  // M09
  M09_MinimalnaVelkostLoga,
  M09_MIN_SIZE: M09_MinimalnaVelkostLoga,
  M09: M09_MinimalnaVelkostLoga,

  // M10
  M10_ObrazokGaleria,
  M10_GALLERY: M10_ObrazokGaleria,
  M10_IMAGE_GALLERY: M10_ObrazokGaleria,
  M10: M10_ObrazokGaleria,

  // M11
  M11_MaticaLogotypov,
  M11_LOGO_MATRIX: M11_MaticaLogotypov,
  M11: M11_MaticaLogotypov,

  // M12
  M12_KartaFarby,
  M12_COLOR_CARD: M12_KartaFarby,
  M12: M12_KartaFarby,

  // M13
  M13_PaletaFarieb,
  M13_COLOR_PALETTE: M13_PaletaFarieb,
  M13: M13_PaletaFarieb,

  // M14
  M14_TonalSteps,
  M14_TONAL_STEPS: M14_TonalSteps,
  M14: M14_TonalSteps,

  // M15
  M15_NeutralneASystemovePodklady,
  M15_NEUTRAL_BACKGROUNDS: M15_NeutralneASystemovePodklady,
  M15: M15_NeutralneASystemovePodklady,

  // M16
  M16_VzorkovnikyAPaletyNaStiahnutie,
  M16_PALETTE_DOWNLOADS: M16_VzorkovnikyAPaletyNaStiahnutie,
  M16: M16_VzorkovnikyAPaletyNaStiahnutie,

  // M17
  M17_UniverzalnaEdukativnaTabulka,
  M17_GUIDELINES_TABLE: M17_UniverzalnaEdukativnaTabulka,
  M17: M17_UniverzalnaEdukativnaTabulka,

  // M18
  M18_Typografia,
  M18_TYPOGRAPHY: M18_Typografia,
  M18: M18_Typografia,

  // M19
  M19_Patterny,
  M19_PATTERNS: M19_Patterny,
  M19: M19_Patterny,

  // M20
  M20_DosAndDonts,
  M20_DOS_AND_DONTS: M20_DosAndDonts,
  M20: M20_DosAndDonts,

  // M21
  M21_FiremnaVizitka,
  M21_BUSINESS_CARD: M21_FiremnaVizitka,
  M21: M21_FiremnaVizitka,

  // M22
  M22_EmailPodpis,
  M22_EMAIL_SIGNATURE: M22_EmailPodpis,
  M22: M22_EmailPodpis,

  // M23
  M23_SocialMedia,
  M23_SOCIAL_MEDIA: M23_SocialMedia,
  M23: M23_SocialMedia,

  // M24
  M24_FiremneTapetyAPozadia,
  M24_WALLPAPERS: M24_FiremneTapetyAPozadia,
  M24: M24_FiremneTapetyAPozadia,

  // M25
  M25_KniznicaIkon,
  M25_ICON_LIBRARY: M25_KniznicaIkon,
  M25: M25_KniznicaIkon,
};

/**
 * Resolves module component from type string with case-insensitivity and alias normalization
 */
function resolveModuleComponent(
  type?: string
): React.ComponentType<ModuleRenderProps<BaseModuleConfig>> | undefined {
  if (!type) return undefined;
  const direct = MODULE_REGISTRY[type];
  if (direct) return direct;

  const upper = type.trim().toUpperCase();
  if (MODULE_REGISTRY[upper]) return MODULE_REGISTRY[upper];

  const matched = Object.entries(MODULE_REGISTRY).find(
    ([k]) => k.toLowerCase() === type.trim().toLowerCase()
  );
  return matched ? matched[1] : undefined;
}

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
  const Component = resolveModuleComponent(module.moduleType);

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
 * On public site: renders nothing or subtle empty box to avoid White Screen of Death
 * In editor: displays a helpful warning badge for the designer
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
    <div className="hidden" aria-hidden="true" data-unknown-module={moduleType} />
  );
}
