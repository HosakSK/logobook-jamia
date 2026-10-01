"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ExternalLink,
  Layout,
  Grid,
  Sparkles,
  Rows,
  Layers,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";
import { PageDetail, ContainerWithColumns, ColumnWithModules } from "@/lib/types/page";
import { ContainerLayoutType } from "@/types/pocketbase-types";
import { InlineEditableText } from "./inline-editable-text";
import { ModuleDispatcher } from "@/components/modules/dispatcher";
import {
  updatePageAction,
  createContainerAction,
  deleteContainerAction,
  createModuleAction,
  deleteModuleAction,
} from "@/actions/pages";
import { Button } from "@/components/ui/button";

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

export function BuilderCanvas({
  brandId,
  brandSlug,
  page,
}: BuilderCanvasProps) {
  const router = useRouter();
  const [activeColumnForNewModule, setActiveColumnForNewModule] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [isAddingContainer, setIsAddingContainer] = useState(false);

  const pageTitle = page.title?.sk || page.title?.en || "Bez názvu";

  const handleUpdatePageTitle = async (newTitle: string) => {
    await updatePageAction(page.id, { title: newTitle });
    router.refresh();
  };

  const handleAddContainer = async (layoutType: ContainerLayoutType) => {
    try {
      setIsAddingContainer(true);
      await createContainerAction(page.id, layoutType);
      router.refresh();
    } catch (err) {
      alert("Nepodarilo sa vytvoriť riadok.");
    } finally {
      setIsAddingContainer(false);
    }
  };

  const handleDeleteContainer = async (containerId: string) => {
    if (!confirm("Naozaj chcete vymazať tento riadok vrátane všetkých modulov v ňom?")) return;
    await deleteContainerAction(containerId);
    router.refresh();
  };

  const handleAddModule = async (moduleType: string) => {
    if (!activeColumnForNewModule) return;
    try {
      await createModuleAction(activeColumnForNewModule, moduleType);
      setActiveColumnForNewModule(null);
      setModuleSearch("");
      router.refresh();
    } catch (err) {
      alert("Nepodarilo sa pridať modul.");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Naozaj chcete zmazať tento modul?")) return;
    await deleteModuleAction(moduleId);
    router.refresh();
  };

  const filteredModules = MODULE_OPTIONS.filter((m) =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.desc.toLowerCase().includes(moduleSearch.toLowerCase())
  );

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
          <div className="border border-dashed border-border/60 rounded-[3px] p-10 text-center space-y-3 bg-neutral-900/20">
            <Rows className="h-6 w-6 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Táto stránka zatiaľ nemá žiadne riadky
              </h3>
              <p className="text-xs text-muted-foreground">
                Pridajte prvý kontajner (mriežku stĺpcov) pre umiestnenie modulov.
              </p>
            </div>
          </div>
        ) : (
          page.containers.map((container) => (
            <div
              key={container.id}
              className="group/container relative border border-border/40 hover:border-border/80 rounded-[3px] p-4 bg-card/40 transition-all space-y-4"
            >
              {/* Container Action Toolbar (Top-Right on Hover) */}
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded-[2px] bg-neutral-900 border border-border/40">
                    Rozloženie: {container.layoutType}
                  </span>
                </div>

                <div className="opacity-40 group-hover/container:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteContainer(container.id)}
                    className="p-1 hover:text-rose-400 text-muted-foreground transition-colors text-xs flex items-center gap-1"
                    title="Zmazať celý riadok"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Zmazať riadok</span>
                  </button>
                </div>
              </div>

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
                    className="border border-border/30 rounded-[3px] p-3 bg-neutral-900/30 flex flex-col justify-between min-h-[120px] space-y-3"
                  >
                    {/* Column Modules */}
                    <div className="space-y-3">
                      {column.modules.map((mod) => (
                        <div key={mod.id} className="relative group/module">
                          {/* Module Hover Toolbar */}
                          <div className="absolute right-2 top-2 z-20 opacity-0 group-hover/module:opacity-100 transition-opacity bg-neutral-900/90 border border-border/60 rounded-[2px] p-1 flex items-center gap-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => handleDeleteModule(mod.id)}
                              className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                              title="Vymazať modul"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <ModuleDispatcher
                            module={mod}
                            isEditor={true}
                            locale="sk"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Add Module to Column Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveColumnForNewModule(column.id)}
                      className="w-full text-[11px] font-semibold h-7 border-dashed border-border/60 hover:border-primary/60 text-muted-foreground hover:text-primary gap-1 rounded-[2px]"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Vložiť modul do stĺpca {colIdx + 1}</span>
                    </Button>
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
            {[
              { type: "FULL", label: "1 stĺpec (Celá šírka)" },
              { type: "HALF_HALF", label: "2 rovnaké (1/2 + 1/2)" },
              { type: "ONE_THIRD_TWO_THIRDS", label: "1/3 + 2/3" },
              { type: "TWO_THIRDS_ONE_THIRD", label: "2/3 + 1/3" },
              { type: "THREE_EQUAL", label: "3 stĺpce (1/3 + 1/3 + 1/3)" },
            ].map((btn) => (
              <Button
                key={btn.type}
                type="button"
                variant="outline"
                size="sm"
                disabled={isAddingContainer}
                onClick={() => handleAddContainer(btn.type as ContainerLayoutType)}
                className="h-7 text-[11px] rounded-[2px] border-border/60 hover:border-primary/50 text-foreground"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Module Catalogue Modal */}
      {activeColumnForNewModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-[3px] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
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

            {/* Modal Search */}
            <div className="p-3 border-b border-border/30 bg-neutral-900/40">
              <input
                type="text"
                autoFocus
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Hľadať modul podľa názvu alebo kategórie..."
                className="w-full h-8 px-3 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
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
    </div>
  );
}
