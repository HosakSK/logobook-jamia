"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Heading2,
  Link2,
  Link2Off,
  Settings2,
  Loader2,
  X,
  Rows,
  Layers,
  Sparkles,
  AlertTriangle,
  Check,
  Search,
  Globe,
  LayoutTemplate,
  BookmarkPlus,
  ArrowRight,
  FileArchive,
  Palette,
  RotateCcw,
  Paintbrush,
} from "lucide-react";
import { PageDetail, PageItem, ContainerWithColumns, ColumnWithModules } from "@/lib/types/page";
import { ContainerLayoutType } from "@/types/pocketbase-types";
import { ChevronRight as ChevronRightIcon } from "lucide-react";
import { InlineEditableText } from "./inline-editable-text";
import { TemplateBrowserModal } from "./template-browser-modal";
import { SaveTemplateModal } from "./save-template-modal";
import { PublishBrandButton } from "./publish-brand-button";
import { OfflineExportModal } from "@/components/admin/export/offline-export-modal";
import { ModuleDispatcher } from "@/components/modules/dispatcher";
import { useBrandCascade } from "@/components/modules/cascade";
import { getBrandColorsAction } from "@/actions/colors";
import {
  updatePageAction,
  createContainerAction,
  deleteContainerAction,
  updateContainerLayoutAction,
  updateContainerAction,
  moveContainerAction,
  createModuleAction,
  deleteModuleAction,
  moveModuleAction,
  updateModuleConfigAction,
  linkModuleAction,
  unlinkModuleAction,
  getBrandLinkGroupsAction,
} from "@/actions/pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuilderCanvasProps {
  brandId: string;
  brandSlug: string;
  page: PageDetail;
  allPages?: PageItem[];
}

const MODULE_OPTIONS = [
  { type: "M01_Nadpis", name: "M01 Nadpis", category: "Text & Navigácia", desc: "Veľký kapitolový nadpis" },
  { type: "M02_RichText", name: "M02 Formátovaný Text", category: "Text & Navigácia", desc: "Odstavce a formátovaný text" },
  { type: "M03_Banner", name: "M03 Promo Banner", category: "Text & Navigácia", desc: "Zvýrazňovací banner s textom" },
  { type: "M04_Razcestnik", name: "M04 Rázcestník", category: "Text & Navigácia", desc: "Navigačné karty s preklikmi" },
  { type: "M05_DownloadTlacidlo", name: "M05 Sťahovacie Tlačidlo", category: "Text & Navigácia", desc: "Tlačidlo na stiahnutie súboru" },
  { type: "M06_OddelovacMedzera", name: "M06 Oddelovač a Medzera", category: "Text & Navigácia", desc: "Rozostup medzi sekciami" },
  { type: "M07_ZobrazenieLoga", name: "M07 Zobrazenie Loga", category: "Logotypy", desc: "Detail loga s podkladom" },
  { type: "M08_OchrannaZonaLoga", name: "M08 Ochranná Zóna", category: "Logotypy", desc: "Pravidlá ochrannej zóny" },
  { type: "M09_MinimalnaVelkostLoga", name: "M09 Minimálna Veľkosť", category: "Logotypy", desc: "Minimálne rozmery loga" },
  { type: "M10_ObrazokGaleria", name: "M10 Obrazová Galéria", category: "Médiá", desc: "Responzívna fotogaléria" },
  { type: "M11_MaticaLogotypov", name: "M11 Matica Logotypov", category: "Logotypy", desc: "Varianty loga v mriežke" },
  { type: "M12_KartaFarby", name: "M12 Karta Farby", category: "Farby", desc: "Detail vzorky farby (HEX, CMYK, RAL)" },
  { type: "M13_PaletaFarieb", name: "M13 Paleta Farieb", category: "Farby", desc: "Prehľad firemnej palety" },
  { type: "M14_TonalSteps", name: "M14 Tonálne Kroky", category: "Farby", desc: "Svetlostné stupnice (10-100%)" },
  { type: "M15_NeutralneASystemovePodklady", name: "M15 Neutrálne Podklady", category: "Farby", desc: "Podkladové plochy" },
  { type: "M16_VzorkovnikyAPaletyNaStiahnutie", name: "M16 Vzorkovníky na Stiahnutie", category: "Farby", desc: "Exporty ASE, ACO a CSS" },
  { type: "M17_UniverzalnaEdukativnaTabulka", name: "M17 Edukatívna Tabuľka", category: "Pravidlá", desc: "Tabuľka použitia formátov" },
  { type: "M18_Typografia", name: "M18 Typografia a Tester", category: "Typografia", desc: "Ukážka rezov a type tester" },
  { type: "M19_Patterny", name: "M19 Vzorové Patterny", category: "Identita", desc: "Opakujúce sa grafické patterny" },
  { type: "M20_DosAndDonts", name: "M20 Správne a Nesprávne", category: "Pravidlá", desc: "Do's & Don'ts karty" },
  { type: "M21_FiremnaVizitka", name: "M21 Firemná Vizitka", category: "Materiály", desc: "Rozmery a layout vizitky" },
  { type: "M22_EmailPodpis", name: "M22 E-mailový Podpis", category: "Materiály", desc: "HTML podpis do e-mailu" },
  { type: "M23_SocialMedia", name: "M23 Sociálne Siete", category: "Materiály", desc: "Rozmery pre siete" },
  { type: "M24_FiremneTapetyAPozadia", name: "M24 Firemné Tapety", category: "Materiály", desc: "Pozadia na plochu" },
  { type: "M25_KniznicaIkon", name: "M25 Knižnica Ikon", category: "Identita", desc: "Systémová knižnica ikon" },
];

const LAYOUT_PRESETS: Array<{ type: ContainerLayoutType; label: string; desc: string }> = [
  { type: "FULL", label: "1 Stĺpec (Plná šírka)", desc: "100% šírka pre bannery, veľké nadpisy a tabuľky" },
  { type: "HALF_HALF", label: "2 Stĺpce (50 / 50)", desc: "Dva symetrické stĺpce" },
  { type: "ONE_THIRD_TWO_THIRDS", label: "2 Stĺpce (1/3 + 2/3)", desc: "Užší ľavý stĺpec pre popis, širší pravý pre obsah" },
  { type: "TWO_THIRDS_ONE_THIRD", label: "2 Stĺpce (2/3 + 1/3)", desc: "Širší ľavý stĺpec pre obsah, užší pravý pre parametre" },
  { type: "THREE_EQUAL", label: "3 Stĺpce (Rovnaké)", desc: "Tri stĺpce pre karty farieb, vizitky alebo ikony" },
];

export function BuilderCanvas({
  brandId,
  brandSlug,
  page,
  allPages,
}: BuilderCanvasProps) {
  const router = useRouter();
  const { tokens } = useBrandCascade();

  // Active theme colors for quick selection in module settings and preview
  const themeColors = React.useMemo(() => {
    if (!tokens?.theme) return [];
    return [
      { hex: tokens.theme.surfaceColor, name: "Karta témy", role: "SURFACE" },
      { hex: tokens.theme.bgColor, name: "Pozadie témy", role: "BACKGROUND" },
      { hex: tokens.theme.primaryColor, name: "Primárna", role: "PRIMARY" },
      { hex: tokens.theme.accentColor, name: "Akcent", role: "ACCENT" },
      { hex: tokens.theme.textColor, name: "Text témy", role: "TEXT" },
      { hex: tokens.theme.borderColor, name: "Rámik témy", role: "BORDER" },
    ];
  }, [tokens?.theme]);

  // Dialogs & drawers state
  const [activeColumnForNewModule, setActiveColumnForNewModule] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Všetko");
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [activeLayoutMenuContainerId, setActiveLayoutMenuContainerId] = useState<string | null>(null);

  // Linked Sync Modal State
  const [linkingModuleId, setLinkingModuleId] = useState<string | null>(null);
  const [linkGroupInput, setLinkGroupInput] = useState("");
  const [existingLinkGroups, setExistingLinkGroups] = useState<Array<{ linkGroupId: string; count: number; moduleType: string }>>([]);
  const [isLoadingLinkGroups, setIsLoadingLinkGroups] = useState(false);

  // Brand Palette for quick 1-click color selection in module settings
  const [brandPalette, setBrandPalette] = useState<Array<{ hex: string; role: string; name: string }>>([]);

  useEffect(() => {
    if (brandId) {
      getBrandColorsAction(brandId).then((res) => {
        if (res.success && res.colors) {
          setBrandPalette(
            res.colors.map((c: any) => ({
              hex: c.hex,
              role: c.role,
              name: (typeof c.name === "object" ? c.name?.sk || c.name?.en : c.name) || c.hex,
            }))
          );
        }
      });
    }
  }, [brandId]);

  // Module Config Settings Modal State (Pure GUI - No raw JSON)
  const [editingModule, setEditingModule] = useState<{
    id: string;
    moduleType: string;
    showH3: boolean;
    h3TitleText: string;
    linkGroupId?: string;
    // Style overrides (Level 3)
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderWidthPx: number | undefined;
    paddingY: "none" | "small" | "normal" | "large";
    // Module specific fields
    moduleSpecific: Record<string, any>;
    rawConfig: Record<string, any>;
  } | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [activeLocale, setActiveLocale] = useState<string>("en"); // English is primary by default!
  const pageTitle = page.title?.[activeLocale] || page.title?.en || page.title?.sk || "Untitled";

  // Compute hierarchical ancestors for builder breadcrumbs
  const breadcrumbs = React.useMemo(() => {
    const items: Array<{ id: string; slug: string; title: string; href: string }> = [];

    if (allPages && page.parent) {
      const visited = new Set<string>();
      let currParentId: string | undefined = page.parent;

      while (currParentId && !visited.has(currParentId)) {
        visited.add(currParentId);
        const parentPage = allPages.find((p) => p.id === currParentId);
        if (parentPage) {
          const pTitle =
            (parentPage.title as any)?.[activeLocale] ||
            (parentPage.title as any)?.sk ||
            (parentPage.title as any)?.en ||
            (parentPage.title as any)?.cs ||
            parentPage.slug;
          items.unshift({
            id: parentPage.id,
            slug: parentPage.slug,
            title: pTitle,
            href: `/admin/brand/${brandSlug}/builder/${parentPage.slug || parentPage.id}`,
          });
          currParentId = parentPage.parent;
        } else {
          break;
        }
      }
    }
    return items;
  }, [allPages, page.parent, brandSlug, activeLocale]);

  // Template Engine States
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);
  const [isOfflineExportOpen, setIsOfflineExportOpen] = useState(false);

  // Load existing brand link groups when opening link dialog
  useEffect(() => {
    if (linkingModuleId) {
      setIsLoadingLinkGroups(true);
      getBrandLinkGroupsAction(brandId)
        .then((res) => {
          if (res.success && res.groups) {
            setExistingLinkGroups(res.groups);
          }
        })
        .finally(() => setIsLoadingLinkGroups(false));
    }
  }, [linkingModuleId, brandId]);

  // Page title update for active locale
  const handleUpdatePageTitle = async (newTitle: string) => {
    const updatedTitleRecord = {
      ...(typeof page.title === "object" ? page.title : {}),
      [activeLocale]: newTitle,
    };
    await updatePageAction(page.id, { title: updatedTitleRecord });
    router.refresh();
  };

  // Add container
  const handleAddContainer = async (layoutType: ContainerLayoutType) => {
    try {
      setIsAddingContainer(true);
      await createContainerAction(page.id, layoutType);
      router.refresh();
    } catch {
      alert("Nepodarilo sa vytvoriť riadok.");
    } finally {
      setIsAddingContainer(false);
    }
  };

  // Delete container
  const handleDeleteContainer = async (containerId: string) => {
    if (!confirm("Naozaj chcete vymazať tento riadok vrátane všetkých modulov v ňom?")) return;
    await deleteContainerAction(containerId);
    router.refresh();
  };

  // Reorder container up/down
  const handleMoveContainer = async (containerId: string, direction: "up" | "down") => {
    await moveContainerAction(containerId, direction);
    router.refresh();
  };

  // Switch container layout preset (Option A: safely migrates modules)
  const handleUpdateContainerLayout = async (containerId: string, newLayoutType: ContainerLayoutType) => {
    setActiveLayoutMenuContainerId(null);
    try {
      const res = await updateContainerLayoutAction(containerId, newLayoutType);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa zmeniť rozloženie riadku.");
        return;
      }
      router.refresh();
    } catch {
      alert("Chyba pri zmene rozloženia riadku.");
    }
  };

  // Toggle container H2 section header
  const handleToggleContainerH2 = async (container: ContainerWithColumns) => {
    const newShowH2 = !container.showH2;
    const currentTitle = container.h2Title?.sk || container.h2Title?.en || "Názov sekcie";
    await updateContainerAction(container.id, {
      showH2: newShowH2,
      h2Title: currentTitle,
    });
    router.refresh();
  };

  // Update container H2 title inline
  const handleUpdateContainerH2Title = async (containerId: string, newTitle: string) => {
    await updateContainerAction(containerId, { h2Title: newTitle });
    router.refresh();
  };

  // Add module from catalogue
  const handleAddModule = async (moduleType: string) => {
    if (!activeColumnForNewModule) return;
    try {
      await createModuleAction(activeColumnForNewModule, moduleType);
      setActiveColumnForNewModule(null);
      setModuleSearch("");
      router.refresh();
    } catch {
      alert("Nepodarilo sa pridať modul.");
    }
  };

  // Delete module
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Naozaj chcete zmazať tento modul?")) return;
    await deleteModuleAction(moduleId);
    router.refresh();
  };

  // Move module up/down in column
  const handleMoveModule = async (moduleId: string, direction: "up" | "down") => {
    await moveModuleAction(moduleId, direction);
    router.refresh();
  };

  // Inline update of module H3 title
  const handleUpdateModuleH3Title = async (moduleId: string, newTitle: string, currentConfig: any) => {
    await updateModuleConfigAction(moduleId, currentConfig, newTitle, true);
    router.refresh();
  };

  // Open Linked Sync dialog
  const handleOpenLinkModal = (moduleId: string, currentGroupId?: string) => {
    setLinkingModuleId(moduleId);
    setLinkGroupInput(currentGroupId || "");
  };

  // Confirm Linked Sync link
  const handleConfirmLink = async () => {
    if (!linkingModuleId || !linkGroupInput.trim()) return;
    try {
      const res = await linkModuleAction(linkingModuleId, linkGroupInput.trim());
      if (!res.success) {
        alert(res.error || "Nepodarilo sa prepojiť modul.");
        return;
      }
      setLinkingModuleId(null);
      setLinkGroupInput("");
      router.refresh();
    } catch {
      alert("Chyba pri prepojení modulu.");
    }
  };

  // Detach / Unlink module
  const handleUnlinkModule = async (moduleId: string) => {
    if (
      !confirm(
        "Naozaj chcete odpojiť tento modul zo zrkadlenia? Po odpojení sa zmeny v ostatných moduloch už nebudú premietať do tohto modulu."
      )
    ) {
      return;
    }

    try {
      const res = await unlinkModuleAction(moduleId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa odpojiť modul.");
        return;
      }
      router.refresh();
    } catch {
      alert("Chyba pri odpojení modulu.");
    }
  };

  // Open module settings modal (Pure GUI)
  const handleOpenSettings = (mod: any) => {
    const cfg = (mod.config || {}) as Record<string, any>;
    const styleOverrides = (cfg.styleOverrides || {}) as Record<string, any>;

    // Extract module-specific config values
    const moduleSpecific: Record<string, any> = {};
    if (mod.moduleType.startsWith("M04") || mod.moduleType === "M04_Razcestnik") {
      moduleSpecific.columns = cfg.columns ?? cfg.gridColumns ?? 2;
      moduleSpecific.clickableEntireCard = cfg.clickableEntireCard ?? true;
      moduleSpecific.hoverEffect = cfg.hoverEffect ?? "lift";
    } else if (mod.moduleType.startsWith("M10") || mod.moduleType === "M10_ObrazokGaleria") {
      moduleSpecific.columns = cfg.columns ?? 3;
      moduleSpecific.aspectRatio = cfg.aspectRatio ?? "16/9";
      moduleSpecific.showCaptions = cfg.showCaptions ?? true;
    } else if (mod.moduleType.startsWith("M11") || mod.moduleType === "M11_MaticaLogotypov") {
      moduleSpecific.columns = cfg.columns ?? 3;
    } else if (mod.moduleType.startsWith("M13") || mod.moduleType === "M13_PaletaFarieb") {
      moduleSpecific.layout = cfg.layout ?? "tiles";
    } else if (mod.moduleType.startsWith("M06") || mod.moduleType === "M06_OddelovacMedzera") {
      moduleSpecific.type = cfg.type ?? "divider";
      moduleSpecific.height = cfg.height ?? 24;
      moduleSpecific.style = cfg.style ?? "solid";
      moduleSpecific.thickness = cfg.thickness ?? 1;
    } else if (mod.moduleType.startsWith("M01") || mod.moduleType === "M01_Nadpis") {
      moduleSpecific.level = cfg.level ?? "h2";
      moduleSpecific.align = cfg.align ?? "left";
      moduleSpecific.showAccentLine = cfg.showAccentLine ?? false;
    } else if (mod.moduleType.startsWith("M05") || mod.moduleType === "M05_DownloadTlacidlo") {
      moduleSpecific.align = cfg.align ?? "left";
      moduleSpecific.size = cfg.size ?? "medium";
      moduleSpecific.style = cfg.style ?? "primary";
    } else if (mod.moduleType.startsWith("M03") || mod.moduleType === "M03_Banner") {
      moduleSpecific.variant = cfg.variant ?? "accent";
    } else if (mod.moduleType.startsWith("M09") || mod.moduleType === "M09_MinimalnaVelkostLoga") {
      moduleSpecific.mediumMode = cfg.mediumMode ?? "both";
    }

    setEditingModule({
      id: mod.id,
      moduleType: mod.moduleType,
      showH3: Boolean(mod.showH3),
      h3TitleText: mod.h3Title?.sk || mod.h3Title?.en || "",
      linkGroupId: mod.linkGroupId || undefined,
      backgroundColor: styleOverrides.backgroundColor || "",
      textColor: styleOverrides.textColor || "",
      borderColor: styleOverrides.borderColor || "",
      borderWidthPx:
        styleOverrides.borderWidthPx !== undefined && styleOverrides.borderWidthPx !== null
          ? Number(styleOverrides.borderWidthPx)
          : undefined,
      paddingY: styleOverrides.paddingY || "normal",
      moduleSpecific,
      rawConfig: cfg,
    });
  };

  // Save module settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    // Assemble clean styleOverrides (strictly respecting brand radius)
    const updatedStyleOverrides: Record<string, any> = {
      ...(editingModule.rawConfig.styleOverrides || {}),
    };

    // User rule: border radius always comes from brand settings in admin
    delete updatedStyleOverrides.radiusMode;
    delete updatedStyleOverrides.customRadiusPx;

    if (editingModule.backgroundColor) {
      updatedStyleOverrides.backgroundColor = editingModule.backgroundColor;
    } else {
      delete updatedStyleOverrides.backgroundColor;
    }

    if (editingModule.textColor) {
      updatedStyleOverrides.textColor = editingModule.textColor;
    } else {
      delete updatedStyleOverrides.textColor;
    }

    if (editingModule.borderColor) {
      updatedStyleOverrides.borderColor = editingModule.borderColor;
    } else {
      delete updatedStyleOverrides.borderColor;
    }

    if (editingModule.borderWidthPx !== undefined) {
      updatedStyleOverrides.borderWidthPx = editingModule.borderWidthPx;
    } else {
      delete updatedStyleOverrides.borderWidthPx;
    }

    if (editingModule.paddingY && editingModule.paddingY !== "normal") {
      updatedStyleOverrides.paddingY = editingModule.paddingY;
    } else {
      delete updatedStyleOverrides.paddingY;
    }

    // Merge moduleSpecific and styleOverrides into rawConfig
    const finalConfig: Record<string, any> = {
      ...editingModule.rawConfig,
      ...editingModule.moduleSpecific,
    };

    if (Object.keys(updatedStyleOverrides).length > 0) {
      finalConfig.styleOverrides = updatedStyleOverrides;
    } else {
      delete finalConfig.styleOverrides;
    }

    try {
      setIsSavingConfig(true);
      const res = await updateModuleConfigAction(
        editingModule.id,
        finalConfig,
        editingModule.h3TitleText,
        editingModule.showH3
      );

      if (!res.success) {
        alert(res.error || "Nepodarilo sa uložiť nastavenia modulu.");
        return;
      }

      if (res.updatedCount && res.updatedCount > 1) {
        alert(
          `Zrkadlená konfigurácia bola úspešne uložená a synchronizovaná na ${res.updatedCount} moduloch naprieč manuálom!`
        );
      }

      setEditingModule(null);
      router.refresh();
    } catch {
      alert("Chyba pri ukladaní nastavení.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filter modules in catalogue
  const categories = ["Všetko", ...Array.from(new Set(MODULE_OPTIONS.map((m) => m.category)))];
  const filteredModules = MODULE_OPTIONS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.desc.toLowerCase().includes(moduleSearch.toLowerCase());
    const matchesCategory = selectedCategory === "Všetko" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className="flex-1 space-y-6 max-w-5xl rounded-[6px] p-6 border shadow-sm transition-colors"
      style={{
        backgroundColor: "var(--brand-manual-bg, var(--background))",
        color: "var(--foreground)",
        borderColor: "var(--border)",
      }}
    >
      {/* Page Header Bar */}
      <div
        className="border rounded-[3px] p-5 shadow-2xs space-y-3"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Clickable Ancestor Breadcrumb Trail */}
            <nav aria-label="Drobková navigácia" className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Link
                href={`/admin/brand/${brandSlug}/builder`}
                className="hover:text-foreground hover:underline transition-colors"
              >
                PageBuilder
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-40" />
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground hover:underline transition-colors max-w-[160px] truncate"
                    title={crumb.title}
                  >
                    {crumb.title}
                  </Link>
                </React.Fragment>
              ))}
              <ChevronRightIcon className="h-3 w-3 shrink-0 opacity-40" />
              <span className="text-foreground font-semibold truncate max-w-[240px]">
                {pageTitle}
              </span>
            </nav>

            {/* Direct Inline Editing for H1 Page Title */}
            <InlineEditableText
              value={pageTitle}
              onSave={handleUpdatePageTitle}
              as="h1"
              className="text-2xl font-black tracking-tight text-foreground"
              placeholder="Zadajte názov stránky..."
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Active Canvas Language Switcher (EN Primary) */}
            <div className="flex items-center gap-1 bg-neutral-900 border border-border/50 rounded-[2px] p-0.5">
              <Globe className="h-3 w-3 text-muted-foreground ml-1.5 mr-0.5" />
              {[
                { code: "en", label: "EN" },
                { code: "sk", label: "SK" },
                { code: "cs", label: "CS" },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveLocale(l.code)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-[2px] transition-colors ${
                    activeLocale === l.code
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  }`}
                  title={`Prepnúť editáciu a náhľad do jazyka ${l.label}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Templates Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTemplatesMenuOpen((prev) => !prev)}
                className="h-7 px-2.5 text-xs font-medium rounded-[2px] border border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                <span>Šablóny</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {isTemplatesMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsTemplatesMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-[#0e161d] border border-white/20 rounded-[var(--brand-radius,6px)] shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100 text-[#fafbfc] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplatesMenuOpen(false);
                        setIsTemplateBrowserOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#17212a] flex items-center gap-2.5 text-[#fafbfc] cursor-pointer transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-[#fafbfc]">Galéria šablón</div>
                        <div className="text-[10px] text-[#96abbe]">Načítať hotové rozloženie</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={page.containers.length === 0}
                      onClick={() => {
                        setIsTemplatesMenuOpen(false);
                        setIsSaveTemplateOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#17212a] flex items-center gap-2.5 text-[#fafbfc] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border-t border-white/10 transition-colors"
                    >
                      <BookmarkPlus className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold text-[#fafbfc]">Uložiť ako šablónu</div>
                        <div className="text-[10px] text-[#96abbe]">Uložiť celú túto stránku</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <PublishBrandButton
              brandId={brandId}
              brandSlug={brandSlug}
            />

            {/* Offline ZIP Export */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOfflineExportOpen(true)}
              className="h-7 text-xs gap-1.5 rounded-[2px] cursor-pointer"
              title="Stiahnuť offline ZIP balíček"
            >
              <FileArchive className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Offline ZIP</span>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5 rounded-[2px]">
              <Link href={`/m/${brandSlug}`} target="_blank">
                <span>Verejný náhľad</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Containers (Rows) Stack */}
      <div className="space-y-6">
        {page.containers.length === 0 ? (
          <div className="border border-dashed border-border/60 rounded-xl p-10 text-center space-y-6 bg-card/20 shadow-2xs">
            <div className="space-y-2 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Táto stránka zatiaľ nemá žiadny obsah
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Začnite výberom pripravenej systémovej šablóny z knižnice, alebo si vytvorte vlastné rozloženie od nuly.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {/* Option 1: Start from template */}
              <button
                type="button"
                onClick={() => setIsTemplateBrowserOpen(true)}
                className="p-4 rounded-lg border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Začať zo šablóny
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Predpripravené rozloženie pre logo, farby, typografiu, vizitku alebo pravidlá.
                </p>
              </button>

              {/* Option 2: Add blank row */}
              <button
                type="button"
                onClick={() => handleAddContainer("FULL")}
                className="p-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary" />
                    Prázdny riadok
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vytvorí čistý riadok s 1 stĺpcom pre manuálne skladanie vlastných modulov.
                </p>
              </button>
            </div>
          </div>
        ) : (
          page.containers.map((container, cIdx) => (
            <div
              key={container.id}
              className="group/container relative border border-border/50 hover:border-border rounded-[var(--brand-radius,8px)] p-4 bg-card/25 transition-all space-y-3"
            >
              {/* Container Header & Hover Toolbar (Prevents Pencil Hell!) */}
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-[var(--brand-radius,4px)] bg-muted/60 border border-border/40">
                    Riadok {cIdx + 1}: {container.layoutType}
                  </span>
                </div>

                {/* Floating Hover Toolbar */}
                <div className="opacity-0 group-hover/container:opacity-100 transition-opacity flex items-center gap-1 bg-[#070b0f] border border-white/20 rounded-[var(--brand-radius,6px)] p-1 shadow-xl text-white">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={cIdx === 0}
                    onClick={() => handleMoveContainer(container.id, "up")}
                    className="p-1 text-white/75 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                    title="Posunúť riadok vyššie"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={cIdx === page.containers.length - 1}
                    onClick={() => handleMoveContainer(container.id, "down")}
                    className="p-1 text-white/75 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                    title="Posunúť riadok nižšie"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-[1px] h-3.5 bg-white/20 my-auto mx-0.5" />

                  {/* Layout Preset Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveLayoutMenuContainerId(
                          activeLayoutMenuContainerId === container.id ? null : container.id
                        )
                      }
                      className="p-1 text-white/75 hover:text-primary transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                      title="Zmeniť rozloženie stĺpcov"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Rozloženie</span>
                    </button>

                    {/* Layout Dropdown Menu */}
                    {activeLayoutMenuContainerId === container.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#0e161d] border border-white/20 rounded-[var(--brand-radius,6px)] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-[#fafbfc]">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#96abbe] border-b border-white/10">
                          Zvoľte mriežku stĺpcov
                        </div>
                        {LAYOUT_PRESETS.map((preset) => (
                          <button
                            key={preset.type}
                            type="button"
                            onClick={() => handleUpdateContainerLayout(container.id, preset.type)}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#17212a] flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              container.layoutType === preset.type
                                ? "text-primary font-bold bg-primary/10"
                                : "text-[#fafbfc]"
                            }`}
                          >
                            <span>{preset.label}</span>
                            {container.layoutType === preset.type && (
                              <Check className="h-3 w-3 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-[1px] h-3.5 bg-white/20 my-auto mx-0.5" />

                  {/* Toggle H2 Section Title */}
                  <button
                    type="button"
                    onClick={() => handleToggleContainerH2(container)}
                    className={`p-1 transition-colors flex items-center gap-1 text-[11px] cursor-pointer ${
                      container.showH2
                        ? "text-primary font-bold bg-primary/20 rounded-[2px]"
                        : "text-white/75 hover:text-white"
                    }`}
                    title={container.showH2 ? "Skryť H2 nadpis sekcie" : "Zapnúť H2 nadpis sekcie"}
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">H2 Nadpis</span>
                  </button>

                  <div className="w-[1px] h-3.5 bg-white/20 my-auto mx-0.5" />

                  {/* Delete Container */}
                  <button
                    type="button"
                    onClick={() => handleDeleteContainer(container.id)}
                    className="p-1 hover:text-rose-400 text-white/75 transition-colors cursor-pointer"
                    title="Zmazať celý riadok"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Optional H2 Section Title with Direct Inline Editing */}
              {container.showH2 && (
                <div className="pt-1 pb-2 border-b border-border/20 flex items-center justify-between">
                  <InlineEditableText
                    as="h2"
                    value={container.h2Title?.sk || container.h2Title?.en || "Názov sekcie"}
                    onSave={(val) => handleUpdateContainerH2Title(container.id, val)}
                    className="text-lg font-bold tracking-tight text-foreground"
                    placeholder="Sem zadajte názov sekcie (H2)..."
                  />
                  <span className="text-[10px] uppercase font-mono text-muted-foreground px-1.5 py-0.5 rounded-[1px] bg-neutral-900 border border-border/40">
                    Sekcia H2
                  </span>
                </div>
              )}

              {/* Columns Grid */}
              <div
                className={`grid gap-4 ${
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
                {container.columns.map((column, colIdx) => (
                  <div
                    key={column.id}
                    className="border border-dashed border-border/40 hover:border-border/70 rounded-[var(--brand-radius,6px)] p-3 bg-muted/20 flex flex-col justify-between min-h-[140px] space-y-3 transition-colors"
                  >
                    {/* Column Modules */}
                    <div className="space-y-3">
                      {column.modules.length === 0 ? (
                        <div className="py-4 text-center text-[11px] text-muted-foreground/60 italic">
                          Prázdny stĺpec {colIdx + 1}
                        </div>
                      ) : (
                        column.modules.map((mod, mIdx) => (
                          <div
                            key={mod.id}
                            className="relative group/module border border-border/50 hover:border-border rounded-[var(--brand-radius,8px)] p-3 shadow-2xs space-y-2 transition-all"
                            style={{
                              backgroundColor: mod.config?.styleOverrides?.backgroundColor || "var(--card)",
                              color: mod.config?.styleOverrides?.textColor || "var(--foreground)",
                              borderColor: mod.config?.styleOverrides?.borderColor || "var(--border)",
                              borderRadius: "var(--brand-radius, 8px)",
                            }}
                          >
                            {/* Module Hover Toolbar (High Contrast Inverted Toolbar) */}
                            <div className="absolute right-2 top-2 z-30 opacity-0 group-hover/module:opacity-100 transition-opacity bg-[#070b0f] border border-white/20 rounded-[var(--brand-radius,6px)] p-1 flex items-center gap-1 shadow-xl text-white">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={mIdx === 0}
                                onClick={() => handleMoveModule(mod.id, "up")}
                                className="p-1 text-white/75 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                title="Posunúť modul vyššie"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={mIdx === column.modules.length - 1}
                                onClick={() => handleMoveModule(mod.id, "down")}
                                className="p-1 text-white/75 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                title="Posunúť modul nižšie"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>

                              <div className="w-[1px] h-3.5 bg-white/20 my-auto mx-0.5" />

                              {/* Linked Sync indicator / Link button */}
                              {mod.linkGroupId ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkModule(mod.id)}
                                  className="px-1.5 py-0.5 text-[10px] font-mono text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-[2px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title={`Modul je zrkadlený v skupine "${mod.linkGroupId}". Kliknite pre odpojenie.`}
                                >
                                  <Link2 className="h-3 w-3 text-amber-300" />
                                  <span>{mod.linkGroupId}</span>
                                  <Link2Off className="h-2.5 w-2.5 ml-0.5 opacity-60 hover:opacity-100 text-rose-400" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenLinkModal(mod.id)}
                                  className="p-1 text-white/70 hover:text-amber-400 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                                  title="Zrkadliť tento modul (Linked Sync)"
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

                              {/* Settings / Config Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenSettings(mod)}
                                className="p-1 text-white/70 hover:text-primary transition-colors cursor-pointer"
                                title="Nastavenia a konfigurácia modulu"
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Module */}
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(mod.id)}
                                className="p-1 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Vymazať modul"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Direct Inline Editing for H3 Module Title */}
                            {mod.showH3 && (
                              <div className="pb-1 border-b border-border/20">
                                <InlineEditableText
                                  as="h3"
                                  value={mod.h3Title?.sk || mod.h3Title?.en || ""}
                                  onSave={(val) => handleUpdateModuleH3Title(mod.id, val, mod.config)}
                                  className="text-sm font-bold text-foreground"
                                  placeholder="Sem zadajte názov modulu (H3)..."
                                />
                              </div>
                            )}

                            {/* Module Content Rendering */}
                            <ModuleDispatcher
                              module={mod}
                              isEditor={true}
                              locale={activeLocale}
                              onConfigChange={async (newConfig) => {
                                await updateModuleConfigAction(mod.id, newConfig);
                                router.refresh();
                              }}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Discrete Add Module to Column Button */}
                    <button
                      type="button"
                      onClick={() => setActiveColumnForNewModule(column.id)}
                      className="w-full py-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-primary hover:bg-primary/5 border border-dashed border-transparent hover:border-primary/40 rounded-[2px] transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Pridať blok</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Add Container Layout Toolbar */}
        <div className="border border-dashed border-border/60 rounded-[3px] p-4 bg-card/30 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Pridať nový riadok na stránku:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {LAYOUT_PRESETS.map((preset) => (
              <Button
                key={preset.type}
                type="button"
                variant="outline"
                size="sm"
                disabled={isAddingContainer}
                onClick={() => handleAddContainer(preset.type)}
                className="h-7 text-[11px] rounded-[2px] border-border/60 hover:border-primary/50 text-foreground"
                title={preset.desc}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Linked Sync Modal / Dialog */}
      {linkingModuleId && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl text-[#fafbfc]">
            <div className="flex items-center justify-between border-b border-[rgba(63,85,102,0.45)] pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-[#fafbfc]">
                  Zrkadlenie modulu (Linked Sync)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkingModuleId(null)}
                className="text-xs text-[#96abbe] hover:text-[#fafbfc] p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#96abbe] leading-relaxed">
              Moduly so spoločným <strong>linkGroupId</strong> zdieľajú identický obsah. Úprava
              textu, farby alebo nastavenia v jednom module sa okamžite premietne do všetkých
              prepojených modulov v tomto brande.
            </p>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                Identifikátor skupiny (linkGroupId)
              </Label>
              <Input
                type="text"
                required
                value={linkGroupInput}
                onChange={(e) => setLinkGroupInput(e.target.value.toLowerCase())}
                placeholder="napr. sync-logo-clearance"
                className="h-9 text-xs font-mono rounded-[var(--brand-radius,6px)] bg-[#070b0f] border border-[rgba(63,85,102,0.5)] text-[#fafbfc] placeholder:text-[#96abbe] focus:border-primary"
                autoFocus
              />
            </div>

            {/* List of existing brand groups */}
            {existingLinkGroups.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                  Alebo vyberte existujúcu skupinu:
                </Label>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {existingLinkGroups.map((g) => (
                    <button
                      key={g.linkGroupId}
                      type="button"
                      onClick={() => setLinkGroupInput(g.linkGroupId)}
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--brand-radius,4px)] bg-[#17212a] border border-[rgba(63,85,102,0.45)] hover:border-amber-500/60 text-xs flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="font-mono text-amber-300">{g.linkGroupId}</span>
                      <span className="text-[10px] text-[#96abbe]">
                        {g.count} {g.count === 1 ? "modul" : "moduly"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(63,85,102,0.35)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLinkingModuleId(null)}
                className="h-8 text-xs text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#17212a] rounded-[var(--brand-radius,4px)] cursor-pointer"
              >
                Zrušiť
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmLink}
                disabled={!linkGroupInput.trim()}
                className="h-8 text-xs font-bold rounded-[var(--brand-radius,4px)] bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
              >
                Prepojiť modul
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Module Configuration Modal (Pure GUI) */}
      {editingModule && (() => {
        const moduleOpt = MODULE_OPTIONS.find(
          (m) =>
            m.type === editingModule.moduleType ||
            m.type.replace(/_/g, "").toLowerCase() === editingModule.moduleType.replace(/_/g, "").toLowerCase()
        );
        const moduleTitle = moduleOpt?.name || editingModule.moduleType;
        const moduleCat = moduleOpt?.category || "Modul";

        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveSettings}
              className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-[#fafbfc]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-[rgba(63,85,102,0.45)] flex items-center justify-between bg-[#17212a] shrink-0 text-[#fafbfc]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[var(--brand-radius,4px)] bg-primary/10 border border-primary/20 text-primary">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#fafbfc]">
                        {moduleTitle}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded-[var(--brand-radius,2px)] text-[10px] font-medium bg-[#070b0f] text-[#96abbe] border border-[rgba(63,85,102,0.45)]">
                        {moduleCat}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#96abbe]">
                      Vizuálne prispôsobenie a nastavenia tohto stavebného bloku
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="p-1.5 text-[#96abbe] hover:text-[#fafbfc] rounded-[var(--brand-radius,4px)] hover:bg-[#1f2c36] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-[#0e161d]">
                {/* Linked Sync Warning Banner */}
                {editingModule.linkGroupId && (
                  <div className="p-3 rounded-[2px] bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Tento modul je zrkadlený v skupine &quot;{editingModule.linkGroupId}&quot;
                      </p>
                      <p className="text-[11px] text-amber-300/80">
                        Uložením konfigurácie automaticky zmeníte obsah všetkých modulov v tejto
                        skupine na všetkých podstránkach manuálu.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sekcia 1: Záhlavie a Nadpis modulu (H3) */}
                <div className="p-4 rounded-[2px] border border-border/40 bg-[#141f2b] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Heading2 className="h-3.5 w-3.5 text-primary" />
                        <span>Zobraziť nadpis modulu (H3)</span>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Nad modulom sa vykreslí voliteľný sekčný nadpis
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingModule.showH3}
                      onChange={(e) =>
                        setEditingModule((prev) =>
                          prev ? { ...prev, showH3: e.target.checked } : null
                        )
                      }
                      className="h-4 w-4 rounded-[2px] border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {editingModule.showH3 && (
                    <div className="space-y-1 pt-2 border-t border-border/20">
                      <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Text nadpisu (H3)
                      </Label>
                      <Input
                        type="text"
                        value={editingModule.h3TitleText}
                        onChange={(e) =>
                          setEditingModule((prev) =>
                            prev ? { ...prev, h3TitleText: e.target.value } : null
                          )
                        }
                        placeholder="Napr. Použitie na tmavom pozadí, Formáty..."
                        className="h-8 text-xs rounded-[2px]"
                      />
                    </div>
                  )}
                </div>

                {/* Sekcia 2: Špecifické nastavenia podľa typu modulu */}
                {/* M04 Rázcestník */}
                {(editingModule.moduleType.startsWith("M04") || editingModule.moduleType === "M04_Razcestnik") && (
                  <div className="p-4 rounded-[2px] border border-border/40 bg-[#141f2b] space-y-4">
                    <div className="border-b border-border/30 pb-2">
                      <h4 className="text-xs font-semibold text-foreground">
                        Rozloženie a správanie rázcestníka
                      </h4>
                    </div>

                    {/* Počet stĺpcov */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Počet stĺpcov mriežky</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((cols) => (
                          <button
                            key={cols}
                            type="button"
                            onClick={() =>
                              setEditingModule((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      moduleSpecific: { ...prev.moduleSpecific, columns: cols },
                                    }
                                  : null
                              )
                            }
                            className={`py-1.5 px-3 rounded-[2px] text-xs font-medium border text-center transition-all ${
                              (editingModule.moduleSpecific.columns ?? 2) === cols
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {cols} {cols === 1 ? "stĺpec" : cols < 5 ? "stĺpce" : "stĺpcov"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hover efekt */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Hover efekt kariet</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "none", label: "Žiadny" },
                          { id: "lift", label: "Nadvihnutie (Lift)" },
                          { id: "zoom", label: "Jemný zoom" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setEditingModule((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      moduleSpecific: { ...prev.moduleSpecific, hoverEffect: item.id },
                                    }
                                  : null
                              )
                            }
                            className={`py-1.5 px-3 rounded-[2px] text-xs font-medium border text-center transition-all ${
                              (editingModule.moduleSpecific.hoverEffect ?? "lift") === item.id
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Celá karta klikateľná */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <Label className="text-xs text-foreground font-medium">
                          Celá karta funguje ako odkaz
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Kliknutie na ľubovoľné miesto karty otvorí cieľovú stránku
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingModule.moduleSpecific.clickableEntireCard ?? true}
                        onChange={(e) =>
                          setEditingModule((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  moduleSpecific: {
                                    ...prev.moduleSpecific,
                                    clickableEntireCard: e.target.checked,
                                  },
                                }
                              : null
                          )
                        }
                        className="h-4 w-4 rounded-[2px] border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* M10 Obrazová Galéria */}
                {(editingModule.moduleType.startsWith("M10") || editingModule.moduleType === "M10_ObrazokGaleria") && (
                  <div className="p-4 rounded-[2px] border border-border/40 bg-[#141f2b] space-y-4">
                    <div className="border-b border-border/30 pb-2">
                      <h4 className="text-xs font-semibold text-foreground">
                        Rozloženie fotogalérie
                      </h4>
                    </div>

                    {/* Počet stĺpcov */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Počet stĺpcov mriežky</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((cols) => (
                          <button
                            key={cols}
                            type="button"
                            onClick={() =>
                              setEditingModule((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      moduleSpecific: { ...prev.moduleSpecific, columns: cols },
                                    }
                                  : null
                              )
                            }
                            className={`py-1.5 px-2 rounded-[2px] text-xs font-medium border text-center transition-all ${
                              (editingModule.moduleSpecific.columns ?? 3) === cols
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {cols} {cols === 1 ? "stĺpec" : "stĺpce"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pomer strán */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Pomer strán fotografií</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "1/1", label: "1:1 (Štvorec)" },
                          { id: "16/9", label: "16:9" },
                          { id: "4/3", label: "4:3" },
                          { id: "original", label: "Pôvodný" },
                        ].map((ar) => (
                          <button
                            key={ar.id}
                            type="button"
                            onClick={() =>
                              setEditingModule((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      moduleSpecific: { ...prev.moduleSpecific, aspectRatio: ar.id },
                                    }
                                  : null
                              )
                            }
                            className={`py-1.5 px-2 rounded-[2px] text-xs font-medium border text-center transition-all ${
                              (editingModule.moduleSpecific.aspectRatio ?? "16/9") === ar.id
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {ar.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popisky */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <Label className="text-xs text-foreground font-medium">
                          Zobraziť popisky pod obrázkami
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Zobrazí textové popisy priradené k fotografiám
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingModule.moduleSpecific.showCaptions ?? true}
                        onChange={(e) =>
                          setEditingModule((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  moduleSpecific: {
                                    ...prev.moduleSpecific,
                                    showCaptions: e.target.checked,
                                  },
                                }
                              : null
                          )
                        }
                        className="h-4 w-4 rounded-[2px] border-border text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* M13 Paleta Farieb */}
                {(editingModule.moduleType.startsWith("M13") || editingModule.moduleType === "M13_PaletaFarieb") && (
                  <div className="p-4 rounded-[2px] border border-border/40 bg-neutral-950/40 space-y-3">
                    <Label className="text-xs font-semibold text-foreground">
                      Režim zobrazenia palety
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "tiles", label: "Dlaždice s parametrami" },
                        { id: "vertical_bars", label: "Kompaktné zvislé prúžky" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    moduleSpecific: { ...prev.moduleSpecific, layout: item.id },
                                  }
                                : null
                            )
                          }
                          className={`py-2 px-3 rounded-[2px] text-xs font-medium border text-center transition-all ${
                            (editingModule.moduleSpecific.layout ?? "tiles") === item.id
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                              : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* M06 Oddelovac a medzera */}
                {(editingModule.moduleType.startsWith("M06") || editingModule.moduleType === "M06_OddelovacMedzera") && (
                  <div className="p-4 rounded-[2px] border border-border/40 bg-[#141f2b] space-y-4">
                    <div className="border-b border-border/30 pb-2">
                      <h4 className="text-xs font-semibold text-foreground">
                        Nastavenie rozostupu a linky
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "spacer", label: "Čistá medzera (Spacer)" },
                        { id: "divider", label: "Viditeľná čiara (Divider)" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    moduleSpecific: { ...prev.moduleSpecific, type: t.id },
                                  }
                                : null
                            )
                          }
                          className={`py-1.5 px-3 rounded-[2px] text-xs font-medium border text-center transition-all ${
                            (editingModule.moduleSpecific.type ?? "divider") === t.id
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                              : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Výška medzery */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">Výška medzery (px)</Label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[8, 16, 24, 32, 48, 64].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() =>
                              setEditingModule((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      moduleSpecific: { ...prev.moduleSpecific, height: h },
                                    }
                                  : null
                              )
                            }
                            className={`py-1 rounded-[2px] text-xs font-mono border text-center transition-all ${
                              (editingModule.moduleSpecific.height ?? 24) === h
                                ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {h}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {editingModule.moduleSpecific.type !== "spacer" && (
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Štýl čiary</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: "solid", label: "Plná" },
                            { id: "dashed", label: "Čiarkovaná" },
                            { id: "dotted", label: "Bodkovaná" },
                            { id: "none", label: "0px (Neviditeľná)" },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() =>
                                setEditingModule((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        moduleSpecific: { ...prev.moduleSpecific, style: st.id },
                                      }
                                    : null
                                )
                              }
                              className={`py-1 px-2 rounded-[2px] text-xs font-medium border text-center transition-all ${
                                (editingModule.moduleSpecific.style ?? "solid") === st.id
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                  : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sekcia 3: Vizuálny štýl karty modulu (Kaskáda štýlov) */}
                <div className="p-4 rounded-[2px] border border-border/40 bg-[#141f2b] space-y-4">
                  <div className="border-b border-border/30 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground">
                        Vizuálne prispôsobenie karty (Kaskáda štýlov)
                      </h4>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Lokálne prispôsobenie pozadia, textu a rámika karty tohto modulu. Zaoblenie rohov vždy striktne preberá nastavenie z administrácie značky.
                  </p>

                  {/* Farba pozadia karty */}
                  <div className="space-y-2 p-3 rounded-[2px] bg-[#0c1218] border border-border/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-foreground">
                        Farba pozadia karty modulu
                      </Label>
                      {editingModule.backgroundColor && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, backgroundColor: "" } : null
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Resetovať farbu pozadia na predvolenú"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Resetovať na predvolenú</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative cursor-pointer shrink-0">
                        <div
                          className="h-8 w-8 rounded-[2px] border border-white/20 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center"
                          style={{
                            backgroundColor: editingModule.backgroundColor || "transparent",
                          }}
                        >
                          {!editingModule.backgroundColor && (
                            <span className="text-[10px] text-muted-foreground font-mono">auto</span>
                          )}
                        </div>
                        <input
                          type="color"
                          value={editingModule.backgroundColor.startsWith("#") ? editingModule.backgroundColor : "#0e161d"}
                          onChange={(e) =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, backgroundColor: e.target.value.toUpperCase() } : null
                            )
                          }
                          className="sr-only"
                        />
                      </label>

                      <Input
                        type="text"
                        placeholder="Predvolené (z témy / transparentné)"
                        value={editingModule.backgroundColor}
                        onChange={(e) =>
                          setEditingModule((prev) =>
                            prev ? { ...prev, backgroundColor: e.target.value } : null
                          )
                        }
                        className="font-mono text-xs uppercase h-8 rounded-[2px] flex-1 bg-[#141f2b]"
                      />
                    </div>

                    {/* Theme Colors 1-click chips */}
                    {themeColors.length > 0 && (
                      <div className="pt-2 border-t border-border/20 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Farby aktívnej témy manuálu:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {themeColors.map((item) => {
                            const isSelected = editingModule.backgroundColor.toUpperCase() === item.hex.toUpperCase();
                            return (
                              <button
                                key={`bg-theme-${item.role}-${item.hex}`}
                                type="button"
                                onClick={() =>
                                  setEditingModule((prev) =>
                                    prev ? { ...prev, backgroundColor: item.hex } : null
                                  )
                                }
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                }`}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <span>{item.name}</span>
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Brand Palette 1-click chips */}
                    {brandPalette.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Farby značky (Brand Palette):
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {brandPalette.map((item, idx) => {
                            const isSelected = editingModule.backgroundColor.toUpperCase() === item.hex.toUpperCase();
                            return (
                              <button
                                key={`bg-brand-${item.hex}-${idx}`}
                                type="button"
                                onClick={() =>
                                  setEditingModule((prev) =>
                                    prev ? { ...prev, backgroundColor: item.hex } : null
                                  )
                                }
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                }`}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <span>{item.name || item.hex}</span>
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Farba textu modulu */}
                  <div className="space-y-2 p-3 rounded-[2px] bg-[#0c1218] border border-border/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-foreground">
                        Farba textu modulu
                      </Label>
                      {editingModule.textColor && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, textColor: "" } : null
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Resetovať farbu textu na predvolenú"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Resetovať na predvolenú</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative cursor-pointer shrink-0">
                        <div
                          className="h-8 w-8 rounded-[2px] border border-white/20 shadow-2xs hover:scale-105 transition-transform flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: editingModule.textColor || "transparent",
                            color: editingModule.textColor ? "#000" : undefined,
                          }}
                        >
                          {!editingModule.textColor ? (
                            <span className="text-[10px] text-muted-foreground font-mono">auto</span>
                          ) : (
                            "A"
                          )}
                        </div>
                        <input
                          type="color"
                          value={editingModule.textColor.startsWith("#") ? editingModule.textColor : "#ffffff"}
                          onChange={(e) =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, textColor: e.target.value.toUpperCase() } : null
                            )
                          }
                          className="sr-only"
                        />
                      </label>

                      <Input
                        type="text"
                        placeholder="Predvolená (zvolená téma manuálu)"
                        value={editingModule.textColor}
                        onChange={(e) =>
                          setEditingModule((prev) =>
                            prev ? { ...prev, textColor: e.target.value } : null
                          )
                        }
                        className="font-mono text-xs uppercase h-8 rounded-[2px] flex-1 bg-[#141f2b]"
                      />
                    </div>

                    {/* Theme Colors 1-click chips for text */}
                    {themeColors.length > 0 && (
                      <div className="pt-2 border-t border-border/20 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Farby aktívnej témy manuálu:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {themeColors.map((item) => {
                            const isSelected = editingModule.textColor.toUpperCase() === item.hex.toUpperCase();
                            return (
                              <button
                                key={`text-theme-${item.role}-${item.hex}`}
                                type="button"
                                onClick={() =>
                                  setEditingModule((prev) =>
                                    prev ? { ...prev, textColor: item.hex } : null
                                  )
                                }
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                }`}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <span>{item.name}</span>
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Brand Palette 1-click chips for text */}
                    {brandPalette.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                          Farby značky (Brand Palette):
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {brandPalette.map((item, idx) => {
                            const isSelected = editingModule.textColor.toUpperCase() === item.hex.toUpperCase();
                            return (
                              <button
                                key={`text-brand-${item.hex}-${idx}`}
                                type="button"
                                onClick={() =>
                                  setEditingModule((prev) =>
                                    prev ? { ...prev, textColor: item.hex } : null
                                  )
                                }
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                }`}
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: item.hex }}
                                />
                                <span>{item.name || item.hex}</span>
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rámik karty */}
                  <div className="space-y-2.5 p-3 rounded-[2px] bg-[#0c1218] border border-border/30">
                    <Label className="text-xs font-medium text-foreground">
                      Hrúbka rámika karty modulu
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: undefined, label: "Zdediť z brandu" },
                        { val: 0, label: "0px (Bez rámika)" },
                        { val: 1, label: "1px (Tenký)" },
                        { val: 2, label: "2px (Výrazný)" },
                      ].map((item) => (
                        <button
                          key={String(item.val)}
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, borderWidthPx: item.val } : null
                            )
                          }
                          className={`py-1.5 px-2 rounded-[2px] text-xs font-medium border text-center transition-all cursor-pointer ${
                            editingModule.borderWidthPx === item.val
                              ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                              : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Farba rámika (ak je hrúbka zvolená) */}
                    {editingModule.borderWidthPx !== 0 && (
                      <div className="pt-2 border-t border-border/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] text-muted-foreground">Farba rámika</Label>
                          {editingModule.borderColor && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingModule((prev) =>
                                  prev ? { ...prev, borderColor: "" } : null
                                )
                              }
                              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              <span>Predvolená</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="relative cursor-pointer shrink-0">
                            <div
                              className="h-7 w-7 rounded-[2px] border border-white/20 shadow-2xs flex items-center justify-center"
                              style={{
                                backgroundColor: editingModule.borderColor || "transparent",
                              }}
                            >
                              {!editingModule.borderColor && (
                                <span className="text-[9px] text-muted-foreground font-mono">auto</span>
                              )}
                            </div>
                            <input
                              type="color"
                              value={editingModule.borderColor.startsWith("#") ? editingModule.borderColor : "#ffffff"}
                              onChange={(e) =>
                                setEditingModule((prev) =>
                                  prev ? { ...prev, borderColor: e.target.value.toUpperCase() } : null
                                )
                              }
                              className="sr-only"
                            />
                          </label>
                          <Input
                            type="text"
                            placeholder="Predvolená farba rámika"
                            value={editingModule.borderColor}
                            onChange={(e) =>
                              setEditingModule((prev) =>
                                prev ? { ...prev, borderColor: e.target.value } : null
                              )
                            }
                            className="font-mono text-xs uppercase h-7 rounded-[2px] flex-1 bg-[#141f2b]"
                          />
                        </div>

                        {/* Theme Colors 1-click chips for border */}
                        {themeColors.length > 0 && (
                          <div className="pt-2 border-t border-border/20 space-y-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                              Farby aktívnej témy:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {themeColors.map((item) => {
                                const isSelected = editingModule.borderColor.toUpperCase() === item.hex.toUpperCase();
                                return (
                                  <button
                                    key={`border-theme-${item.role}-${item.hex}`}
                                    type="button"
                                    onClick={() =>
                                      setEditingModule((prev) =>
                                        prev ? { ...prev, borderColor: item.hex } : null
                                      )
                                    }
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                        : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                    }`}
                                  >
                                    <span
                                      className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                      style={{ backgroundColor: item.hex }}
                                    />
                                    <span>{item.name}</span>
                                    {isSelected && <Check className="h-2.5 w-2.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Brand Palette 1-click chips for border */}
                        {brandPalette.length > 0 && (
                          <div className="pt-1.5 space-y-1">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                              Farby značky (Brand Palette):
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {brandPalette.map((item, idx) => {
                                const isSelected = editingModule.borderColor.toUpperCase() === item.hex.toUpperCase();
                                return (
                                  <button
                                    key={`border-brand-${item.hex}-${idx}`}
                                    type="button"
                                    onClick={() =>
                                      setEditingModule((prev) =>
                                        prev ? { ...prev, borderColor: item.hex } : null
                                      )
                                    }
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-mono border transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                                        : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                                    }`}
                                  >
                                    <span
                                      className="h-2.5 w-2.5 rounded-[1px] border border-white/20 inline-block shrink-0"
                                      style={{ backgroundColor: item.hex }}
                                    />
                                    <span>{item.name || item.hex}</span>
                                    {isSelected && <Check className="h-2.5 w-2.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vnútorné odsadenie karty (Padding) */}
                  <div className="space-y-2 p-3 rounded-[2px] bg-[#0c1218] border border-border/30">
                    <Label className="text-xs font-medium text-foreground">
                      Vnútorné odsadenie karty (Padding)
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "normal", label: "Štandardné" },
                        { id: "none", label: "Žiadne (0px)" },
                        { id: "small", label: "Malé (p-3)" },
                        { id: "large", label: "Veľké (p-8)" },
                      ].map((pad) => (
                        <button
                          key={pad.id}
                          type="button"
                          onClick={() =>
                            setEditingModule((prev) =>
                              prev ? { ...prev, paddingY: pad.id as any } : null
                            )
                          }
                          className={`py-1.5 px-2 rounded-[2px] text-xs font-medium border text-center transition-all cursor-pointer ${
                            (editingModule.paddingY || "normal") === pad.id
                              ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs"
                              : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-[#141f2b]"
                          }`}
                        >
                          {pad.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a] flex items-center justify-end gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingModule(null)}
                  className="h-8 text-xs text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] rounded-[var(--brand-radius,4px)] cursor-pointer"
                >
                  Zrušiť
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingConfig}
                  className="h-8 text-xs font-bold rounded-[var(--brand-radius,4px)] bg-primary text-[#070b0f] hover:bg-primary/90 px-4 cursor-pointer"
                >
                  {isSavingConfig ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Ukladám...</span>
                    </span>
                  ) : (
                    "Uložiť nastavenia"
                  )}
                </Button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* Module Catalogue Modal */}
      {activeColumnForNewModule && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-[#fafbfc]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[rgba(63,85,102,0.45)] flex items-center justify-between bg-[#17212a] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#fafbfc]">
                  Katalóg Modulov (M01 – M25)
                </h3>
                <p className="text-[11px] text-[#96abbe]">
                  Zvoľte stavebný blok, ktorý chcete vložiť do vybraného stĺpca.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveColumnForNewModule(null);
                  setModuleSearch("");
                }}
                className="p-1.5 text-[#96abbe] hover:text-[#fafbfc] rounded-[var(--brand-radius,4px)] hover:bg-[#1f2c36] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Category Tabs */}
            <div className="px-4 py-2 border-b border-[rgba(63,85,102,0.35)] bg-[#17212a] flex items-center gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-[var(--brand-radius,4px)] whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-[#070b0f] font-bold shadow-2xs"
                      : "text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-[rgba(63,85,102,0.35)] bg-[#17212a] relative">
              <Search className="h-4 w-4 text-[#96abbe] absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Hľadať modul podľa názvu, popisu alebo kategórie..."
                className="w-full h-9 pl-9 pr-3 rounded-[var(--brand-radius,6px)] bg-[#070b0f] border border-[rgba(63,85,102,0.5)] text-xs text-[#fafbfc] placeholder:text-[#96abbe] outline-hidden focus:border-primary"
              />
            </div>

            {/* Modal List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-[#0e161d]">
              <div className="grid sm:grid-cols-2 gap-2.5">
                {filteredModules.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => handleAddModule(m.type)}
                    className="p-3.5 rounded-[var(--brand-radius,6px)] border border-[rgba(63,85,102,0.45)] hover:border-primary bg-[#17212a] hover:bg-[#1f2c36] text-left transition-all group space-y-1.5 cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#fafbfc] group-hover:text-primary transition-colors">
                        {m.name}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-[var(--brand-radius,2px)] bg-[#070b0f] border border-[rgba(63,85,102,0.45)] text-[#96abbe]">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#96abbe] line-clamp-1 leading-relaxed">
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Browser Modal */}
      {isTemplateBrowserOpen && (
        <TemplateBrowserModal
          pageId={page.id}
          hasExistingContent={page.containers.length > 0}
          locale={activeLocale}
          onClose={() => setIsTemplateBrowserOpen(false)}
          onApplied={() => {
            setIsTemplateBrowserOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Save Template Modal */}
      {isSaveTemplateOpen && (
        <SaveTemplateModal
          pageId={page.id}
          defaultName={pageTitle}
          onClose={() => setIsSaveTemplateOpen(false)}
          onSuccess={() => {
            setIsSaveTemplateOpen(false);
            alert("Šablóna bola úspešne uložená do vašich osobných šablón!");
          }}
        />
      )}

      {/* Offline ZIP Export Modal */}
      <OfflineExportModal
        isOpen={isOfflineExportOpen}
        onClose={() => setIsOfflineExportOpen(false)}
        brandId={brandId}
        brandSlug={brandSlug}
        brandName={brandSlug}
      />
    </div>
  );
}
