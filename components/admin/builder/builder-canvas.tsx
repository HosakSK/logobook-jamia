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
} from "lucide-react";
import { PageDetail, ContainerWithColumns, ColumnWithModules } from "@/lib/types/page";
import { ContainerLayoutType } from "@/types/pocketbase-types";
import { InlineEditableText } from "./inline-editable-text";
import { TemplateBrowserModal } from "./template-browser-modal";
import { SaveTemplateModal } from "./save-template-modal";
import { ModuleDispatcher } from "@/components/modules/dispatcher";
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
}: BuilderCanvasProps) {
  const router = useRouter();

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

  // Module Config Settings Modal State
  const [editingModule, setEditingModule] = useState<{
    id: string;
    moduleType: string;
    configJson: string;
    showH3: boolean;
    h3TitleText: string;
    linkGroupId?: string;
  } | null>(null);
  const [configJsonError, setConfigJsonError] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [activeLocale, setActiveLocale] = useState<string>("en"); // English is primary by default!
  const pageTitle = page.title?.[activeLocale] || page.title?.en || page.title?.sk || "Untitled";

  // Template Engine States
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);

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

  // Open module settings modal
  const handleOpenSettings = (mod: any) => {
    setEditingModule({
      id: mod.id,
      moduleType: mod.moduleType,
      configJson: JSON.stringify(mod.config || {}, null, 2),
      showH3: Boolean(mod.showH3),
      h3TitleText: mod.h3Title?.sk || mod.h3Title?.en || "",
      linkGroupId: mod.linkGroupId || undefined,
    });
    setConfigJsonError(null);
  };

  // Save module settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(editingModule.configJson);
    } catch (err) {
      setConfigJsonError(
        "Neplatný JSON formát: " + (err instanceof Error ? err.message : "Chyba syntaxe")
      );
      return;
    }

    try {
      setIsSavingConfig(true);
      const res = await updateModuleConfigAction(
        editingModule.id,
        parsedConfig,
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
    <div className="flex-1 space-y-6 max-w-5xl">
      {/* Page Header Bar */}
      <div className="border border-border/50 rounded-[3px] p-5 bg-card/60 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-primary/10 text-primary border border-primary/20">
                Aktívna Stránka
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                /m/{brandSlug}/{page.slug}
              </span>
            </div>

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
                  <div className="absolute right-0 top-full mt-1 z-40 w-52 bg-card border border-border/70 rounded-md shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplatesMenuOpen(false);
                        setIsTemplateBrowserOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-foreground cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold">Galéria šablón</div>
                        <div className="text-[10px] text-muted-foreground">Načítať hotové rozloženie</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={page.containers.length === 0}
                      onClick={() => {
                        setIsTemplatesMenuOpen(false);
                        setIsSaveTemplateOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-foreground disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border-t border-border/40"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div>
                        <div className="font-semibold">Uložiť ako šablónu</div>
                        <div className="text-[10px] text-muted-foreground">Uložiť celú túto stránku</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

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
              className="group/container relative border border-border/40 hover:border-border/80 rounded-[3px] p-4 bg-card/30 transition-all space-y-3"
            >
              {/* Container Header & Hover Toolbar (Prevents Pencil Hell!) */}
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-[2px] bg-neutral-900 border border-border/40">
                    Riadok {cIdx + 1}: {container.layoutType}
                  </span>
                </div>

                {/* Floating Hover Toolbar */}
                <div className="opacity-0 group-hover/container:opacity-100 transition-opacity flex items-center gap-1 bg-neutral-950/90 border border-border/60 rounded-[2px] p-0.5 shadow-md">
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={cIdx === 0}
                    onClick={() => handleMoveContainer(container.id, "up")}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                    title="Posunúť riadok vyššie"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={cIdx === page.containers.length - 1}
                    onClick={() => handleMoveContainer(container.id, "down")}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                    title="Posunúť riadok nižšie"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

                  {/* Layout Preset Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveLayoutMenuContainerId(
                          activeLayoutMenuContainerId === container.id ? null : container.id
                        )
                      }
                      className="p-1 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[11px]"
                      title="Zmeniť rozloženie stĺpcov"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Rozloženie</span>
                    </button>

                    {/* Layout Dropdown Menu */}
                    {activeLayoutMenuContainerId === container.id && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-neutral-900 border border-border/80 rounded-[3px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/30">
                          Zvoľte mriežku stĺpcov
                        </div>
                        {LAYOUT_PRESETS.map((preset) => (
                          <button
                            key={preset.type}
                            type="button"
                            onClick={() => handleUpdateContainerLayout(container.id, preset.type)}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-800/80 flex items-center justify-between gap-2 ${
                              container.layoutType === preset.type
                                ? "text-primary font-bold bg-primary/10"
                                : "text-foreground"
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

                  <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

                  {/* Toggle H2 Section Title */}
                  <button
                    type="button"
                    onClick={() => handleToggleContainerH2(container)}
                    className={`p-1 transition-colors flex items-center gap-1 text-[11px] ${
                      container.showH2
                        ? "text-primary font-bold bg-primary/10 rounded-[2px]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={container.showH2 ? "Skryť H2 nadpis sekcie" : "Zapnúť H2 nadpis sekcie"}
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">H2 Nadpis</span>
                  </button>

                  <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

                  {/* Delete Container */}
                  <button
                    type="button"
                    onClick={() => handleDeleteContainer(container.id)}
                    className="p-1 hover:text-rose-400 text-muted-foreground transition-colors"
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
                    className="border border-dashed border-border/30 hover:border-border/60 rounded-[3px] p-3 bg-neutral-950/20 flex flex-col justify-between min-h-[140px] space-y-3 transition-colors"
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
                            className="relative group/module border border-border/40 hover:border-border/80 rounded-[3px] p-3 bg-card/60 shadow-2xs space-y-2 transition-all"
                          >
                            {/* Module Hover Toolbar (Prevents Pencil Hell!) */}
                            <div className="absolute right-2 top-2 z-30 opacity-0 group-hover/module:opacity-100 transition-opacity bg-neutral-950/90 border border-border/70 rounded-[2px] p-0.5 flex items-center gap-1 shadow-md">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={mIdx === 0}
                                onClick={() => handleMoveModule(mod.id, "up")}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                                title="Posunúť modul vyššie"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={mIdx === column.modules.length - 1}
                                onClick={() => handleMoveModule(mod.id, "down")}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                                title="Posunúť modul nižšie"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>

                              <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

                              {/* Linked Sync indicator / Link button */}
                              {mod.linkGroupId ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkModule(mod.id)}
                                  className="px-1.5 py-0.5 text-[10px] font-mono text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-[2px] flex items-center gap-1 transition-colors"
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
                                  className="p-1 text-muted-foreground hover:text-amber-400 transition-colors flex items-center gap-1 text-[10px]"
                                  title="Zrkadliť tento modul (Linked Sync)"
                                >
                                  <Link2 className="h-3 w-3" />
                                </button>
                              )}

                              <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

                              {/* Settings / Config Modal */}
                              <button
                                type="button"
                                onClick={() => handleOpenSettings(mod)}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                title="Nastavenia a konfigurácia modulu"
                              >
                                <Settings2 className="h-3 w-3" />
                              </button>

                              {/* Delete Module */}
                              <button
                                type="button"
                                onClick={() => handleDeleteModule(mod.id)}
                                className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                                title="Vymazať modul"
                              >
                                <Trash2 className="h-3 w-3" />
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-border/80 rounded-[3px] w-full max-w-md p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">
                  Zrkadlenie modulu (Linked Sync)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkingModuleId(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Moduly so spoločným <strong>linkGroupId</strong> zdieľajú identický obsah. Úprava
              textu, farby alebo nastavenia v jednom module sa okamžite premietne do všetkých
              prepojených modulov v tomto brande.
            </p>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                Identifikátor skupiny (linkGroupId)
              </Label>
              <Input
                type="text"
                required
                value={linkGroupInput}
                onChange={(e) => setLinkGroupInput(e.target.value.toLowerCase())}
                placeholder="napr. sync-logo-clearance"
                className="h-8 text-xs font-mono rounded-[2px]"
                autoFocus
              />
            </div>

            {/* List of existing brand groups */}
            {existingLinkGroups.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Alebo vyberte existujúcu skupinu:
                </Label>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {existingLinkGroups.map((g) => (
                    <button
                      key={g.linkGroupId}
                      type="button"
                      onClick={() => setLinkGroupInput(g.linkGroupId)}
                      className="w-full text-left px-2 py-1 rounded-[2px] bg-neutral-900 border border-border/40 hover:border-amber-500/60 text-xs flex items-center justify-between"
                    >
                      <span className="font-mono text-amber-300">{g.linkGroupId}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {g.count} {g.count === 1 ? "modul" : "moduly"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLinkingModuleId(null)}
                className="h-7 text-xs"
              >
                Zrušiť
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmLink}
                disabled={!linkGroupInput.trim()}
                className="h-7 text-xs font-bold rounded-[2px] bg-amber-500 hover:bg-amber-600 text-black"
              >
                Prepojiť modul
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Module Configuration Modal */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSettings}
            className="bg-card border border-border rounded-[3px] w-full max-w-xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Nastavenia modulu: {editingModule.moduleType}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

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

            {/* Module H3 Title Controls */}
            <div className="space-y-2 border border-border/40 rounded-[2px] p-3 bg-neutral-950/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Zobraziť nadpis modulu (H3)
                </Label>
                <input
                  type="checkbox"
                  checked={editingModule.showH3}
                  onChange={(e) =>
                    setEditingModule((prev) => (prev ? { ...prev, showH3: e.target.checked } : null))
                  }
                  className="rounded-[2px] border-border text-primary focus:ring-primary"
                />
              </div>

              {editingModule.showH3 && (
                <div className="space-y-1 pt-1">
                  <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Text nadpisu
                  </Label>
                  <Input
                    type="text"
                    value={editingModule.h3TitleText}
                    onChange={(e) =>
                      setEditingModule((prev) =>
                        prev ? { ...prev, h3TitleText: e.target.value } : null
                      )
                    }
                    placeholder="Sem zadajte názov modulu..."
                    className="h-8 text-xs rounded-[2px]"
                  />
                </div>
              )}
            </div>

            {/* JSON Config Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  JSON Konfigurácia modulu
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Pokročilé nastavenia
                </span>
              </div>

              <textarea
                value={editingModule.configJson}
                onChange={(e) => {
                  setEditingModule((prev) =>
                    prev ? { ...prev, configJson: e.target.value } : null
                  );
                  setConfigJsonError(null);
                }}
                rows={8}
                className="w-full p-2.5 rounded-[2px] bg-neutral-900 border border-border/50 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary leading-relaxed"
              />

              {configJsonError && (
                <p className="text-[11px] text-rose-400 font-mono">{configJsonError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingModule(null)}
                className="h-7 text-xs"
              >
                Zrušiť
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingConfig}
                className="h-7 text-xs font-bold rounded-[2px] bg-primary text-primary-foreground"
              >
                {isSavingConfig ? <Loader2 className="h-3 w-3 animate-spin" /> : "Uložiť zmeny"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Module Catalogue Modal */}
      {activeColumnForNewModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-[3px] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Katalóg Modulov (M01 – M25)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Zvoľte stavebný blok, ktorý chcete vložiť do vybraného stĺpca.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveColumnForNewModule(null);
                  setModuleSearch("");
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Category Tabs */}
            <div className="px-4 py-2 border-b border-border/30 bg-neutral-900/30 flex items-center gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-[2px] whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Modal Search */}
            <div className="p-3 border-b border-border/30 bg-neutral-900/40 relative">
              <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-6 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Hľadať modul podľa názvu, popisu alebo kategórie..."
                className="w-full h-8 pl-8 pr-3 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
              />
            </div>

            {/* Modal List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <div className="grid sm:grid-cols-2 gap-2">
                {filteredModules.map((m) => (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => handleAddModule(m.type)}
                    className="p-3 rounded-[2px] border border-border/40 hover:border-primary bg-card/60 hover:bg-neutral-800/40 text-left transition-all group space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                        {m.name}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-[1px] bg-neutral-900 border border-border/40 text-muted-foreground">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
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
    </div>
  );
}
