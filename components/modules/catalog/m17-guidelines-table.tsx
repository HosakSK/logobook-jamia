"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Globe,
  Monitor,
  Printer,
  Palette,
  Shirt,
  Building2,
  Info,
  Settings2,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M17GuidelinesTableConfig,
  m17GuidelinesTableSchema,
} from "@/lib/validations/modules/m17";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";

/**
 * Built-in multilingual educational glossary dictionary for the 7 color systems.
 * Strictly localized in EN (primary), SK, and CS without requiring database queries.
 */
const COLOR_SYSTEMS_GLOSSARY: Record<
  string,
  {
    name: Record<string, string>;
    category: Record<string, string>;
    icon: React.ComponentType<{ className?: string }>;
    whenToUse: Record<string, string>;
    description: Record<string, string>;
  }
> = {
  hex: {
    name: {
      en: "HEX (Hexadecimal Code)",
      sk: "HEX (Šestnástkový kód)",
      cs: "HEX (Šestnáctkový kód)",
    },
    category: {
      en: "Web & Digital UI",
      sk: "Web a Digitálne UI",
      cs: "Web a Digitální UI",
    },
    icon: Globe,
    whenToUse: {
      en: "Websites, web and mobile apps, HTML/CSS frontend development, newsletters and email templates.",
      sk: "Webové stránky, mobilné a webové aplikácie, HTML/CSS kódovanie, e-mailové šablóny a newslettre.",
      cs: "Webové stránky, mobilní a webové aplikace, HTML/CSS kódování, e-mailové šablony a newslettery.",
    },
    description: {
      en: "A 6-character alphanumeric notation defining the sRGB color space. Universally recognized by all web browsers, frameworks, and modern digital development tools.",
      sk: "Šesťmiestny alfanumerický kód reprezentujúci sRGB priestor. Je to univerzálny a najrýchlejší formát pre webových vývojárov, frontend a štýly CSS.",
      cs: "Šestimístný alfanumerický kód reprezentující sRGB prostor. Je to univerzální a nejrychlejší formát pro webové vývojáře, frontend a styly CSS.",
    },
  },
  rgb: {
    name: {
      en: "RGB (Red, Green, Blue)",
      sk: "RGB (Červená, Zelená, Modrá)",
      cs: "RGB (Červená, Zelená, Modrá)",
    },
    category: {
      en: "Screens & Multimedia",
      sk: "Obrazovky a Multimédiá",
      cs: "Obrazovky a Multimédia",
    },
    icon: Monitor,
    whenToUse: {
      en: "Digital presentations, social media post graphics, YouTube and video assets, LED displays and digital billboards.",
      sk: "Digitálne prezentácie, grafika na sociálne siete, video podklady, LED obrazovky a digitálne bilboardy.",
      cs: "Digitální prezentace, grafika na sociální sítě, video podklady, LED obrazovky a digitální billboardy.",
    },
    description: {
      en: "An additive color model combining red, green, and blue light channels (values 0 to 255). Standard for creating raster imagery and videos displayed on illuminated monitors.",
      sk: "Aditívny model miešajúci tri svetelné kanály (hodnoty 0 až 255). Primárny štandard pre tvorbu rastrových obrázkov, fotiek a videí určených výhradne na displeje.",
      cs: "Aditivní model míchající tři světelné kanály (hodnoty 0 až 255). Primární standard pro tvorbu rastrových obrázků, fotek a videí určených výhradně na displeje.",
    },
  },
  cmyk: {
    name: {
      en: "CMYK (Cyan, Magenta, Yellow, Black)",
      sk: "CMYK (Ofsetová a digitálna tlač)",
      cs: "CMYK (Ofsetový a digitální tisk)",
    },
    category: {
      en: "Print & Packaging",
      sk: "Polygrafia a Obaly",
      cs: "Polygrafie a Obaly",
    },
    icon: Printer,
    whenToUse: {
      en: "Business cards, brochures, flyers, posters, roll-ups, catalogs, stationery and paper packaging.",
      sk: "Vizitky, letáky, brožúry, katalógy, plagáty, firemné hlavičkové papiere a papierové obaly.",
      cs: "Vizitky, letáky, brožury, katalogy, plakáty, firemní hlavičkové papíry a papírové obaly.",
    },
    description: {
      en: "Subtractive process color model combining four printing inks expressed in percentages (0–100%). Standard requirement for commercial print shops and offset printing presses.",
      sk: "Subtraktívny model miešania 4 základných tlačových atramentov vyjadrených v percentách (0–100%). Základná požiadavka každej tlačiarne pre bežné tlačoviny.",
      cs: "Subtraktivní model míchání 4 základních tiskových inkoustů vyjádřených v procentech (0–100%). Základní požadavek každé tiskárny pro běžné tiskoviny.",
    },
  },
  pantoneC: {
    name: {
      en: "Pantone Coated (PMS C)",
      sk: "Pantone Coated (Natieraný papier)",
      cs: "Pantone Coated (Natíraný papír)",
    },
    category: {
      en: "Spot Color (Coated)",
      sk: "Priama farba (Krieda)",
      cs: "Přímá barva (Křída)",
    },
    icon: Palette,
    whenToUse: {
      en: "High-end corporate identity collateral, luxury glossy packaging, prestige business cards on coated paper.",
      sk: "Prémiové reprezentačné tlačoviny, luxusné obaly, vizitky na kriedovom hladkom papieri a brand merchandise.",
      cs: "Prémiové reprezentační tiskoviny, luxusní obaly, vizitky na křídovém hladkém papíře a brand merchandise.",
    },
    description: {
      en: "Premixed spot color ink formulated specifically for smooth, coated paper stocks. Guarantees 100% exact shade reproduction across any commercial print facility globally.",
      sk: "Špeciálne namiešaná priama farba (Spot Color) pre lesklé a matné kriedové papiere. Zaručuje stopercentnú vernosť a žiarivosť odtieňa bez tlačového rastra.",
      cs: "Speciálně namíchaná přímá barva (Spot Color) pro lesklé a matné křídové papíry. Zaručuje stoprocentní věrnost a zářivost odstínu bez tiskového rastru.",
    },
  },
  pantoneU: {
    name: {
      en: "Pantone Uncoated (PMS U)",
      sk: "Pantone Uncoated (Nenatieraný papier)",
      cs: "Pantone Uncoated (Nenatíraný papír)",
    },
    category: {
      en: "Spot Color (Uncoated)",
      sk: "Priama farba (Prírodný papier)",
      cs: "Přímá barva (Přírodní papír)",
    },
    icon: Palette,
    whenToUse: {
      en: "Official letterheads, invoices, envelopes, natural textured stocks, uncoated recycled paper.",
      sk: "Oficiálne firemné listy, obálky, bloky, fakturačné papiere a recyklované prírodné materiály.",
      cs: "Oficiální firemní dopisy, obálky, bloky, fakturační papíry a recyklované přírodní materiály.",
    },
    description: {
      en: "Calibrated specifically for porous, absorbent uncoated papers where ink sinks into fibers. Prevents color dulling or unexpected dark shade shifts.",
      sk: "Receptúra priamej farby upravená pre sajúce a štruktúrované papiere, kde sa atrament vpíja hlbšie do vlákna. Zabraňuje nežiaducemu stmavnutiu farby.",
      cs: "Receptura přímé barvy upravená pro savé a strukturované papíry, kde se inkoust vpíjí hlouběji do vlákna. Zabraňuje nežádoucímu ztmavnutí barvy.",
    },
  },
  pantoneTcx: {
    name: {
      en: "Pantone TCX (Textile Cotton)",
      sk: "Pantone TCX (Textil a móda)",
      cs: "Pantone TCX (Textil a móda)",
    },
    category: {
      en: "Apparel & Fabrics",
      sk: "Textil a Oblečenie",
      cs: "Textil a Oblečení",
    },
    icon: Shirt,
    whenToUse: {
      en: "Company uniforms, branded workwear, caps, embroidered patches, fabric accessories and merchandise.",
      sk: "Firemné uniformy, pracovné oblečenie, merch (tričká, mikiny), vyšívané nášivky a látky.",
      cs: "Firemní uniformy, pracovní oblečení, merch (trička, mikiny), vyšívané nášivky a látky.",
    },
    description: {
      en: "Global color standard engineered for cotton and fabric dyeing. Used by clothing manufacturers and textile mills worldwide for precise garment color matching.",
      sk: "Medzinárodný vzorkovník vyvinutý pre textilnú výrobu a farbenie bavlny. Poskytuje presný kľúč pre dodávateľov oblečenia a reklamného textilu.",
      cs: "Mezinárodní vzorník vyvinutý pro textilní výrobu a barvení bavlny. Poskytuje přesný klíč pro dodavatele oblečení a reklamního textilu.",
    },
  },
  ral: {
    name: {
      en: "RAL Classic",
      sk: "RAL Classic (Priemysel a laky)",
      cs: "RAL Classic (Průmysl a laky)",
    },
    category: {
      en: "Architecture & Coatings",
      sk: "Priemyselné nátery",
      cs: "Průmyslové nátěry",
    },
    icon: Building2,
    whenToUse: {
      en: "Fleet vehicle liveries, building facades, interior architectural signage, illuminated totems, powder coating.",
      sk: "Polepy firemných vozidiel, fasády predajní, svetelné pylóny, kovové konštrukcie a práškové lakovanie.",
      cs: "Polepy firemních vozidel, fasády prodejen, světelné totemy, kovové konstrukce a práškové lakování.",
    },
    description: {
      en: "European industrial color standard defining precise tints for liquid paints, varnishes, plastics, and powder coatings in automotive and architectural sectors.",
      sk: "Stredoeurópsky priemyselný štandard pre nátery, autolaky, plasty a práškové farby. Kľúčový pre architektov, výrobcov svetelnej reklamy a autoservisy.",
      cs: "Středoevropský průmyslový standard pro nátěry, autolaky, plasty a práškové barvy. Klíčový pro architekty, výrobce světelné reklamy a autoservisy.",
    },
  },
};

export default function M17UniverzalnaEdukativnaTabulkaModule({
  id: moduleId,
  moduleType = "M17_UniverzalnaEdukativnaTabulka",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius } = useBrandCascade();
  const brandRadius = resolveRadius();

  // Parse config safely
  const parsedConfig = useMemo(() => {
    const res = m17GuidelinesTableSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      enabledRows: {
        hex: true,
        rgb: true,
        cmyk: true,
        pantoneC: true,
        pantoneU: false,
        pantoneTcx: false,
        ral: false,
      },
      customNote: undefined,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M17GuidelinesTableConfig>(parsedConfig);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M17GuidelinesTableConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M17 config:", err);
      }
    }
  };

  // Filtered rows to display
  const activeRowKeys = useMemo(() => {
    const keys: (keyof typeof cfg.enabledRows)[] = [
      "hex",
      "rgb",
      "cmyk",
      "pantoneC",
      "pantoneU",
      "pantoneTcx",
      "ral",
    ];
    return keys.filter((key) => Boolean(cfg.enabledRows[key]));
  }, [cfg.enabledRows]);

  const customNoteText = cfg.customNote ? resolveI18nText(cfg.customNote, locale) : "";

  return (
    <div className="relative group/m17 py-4 space-y-4">
      {/* Optional H3 Header */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-4">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m17:opacity-100 transition-opacity duration-150 absolute top-2 right-4 z-30 flex items-center gap-1 bg-[#17212a] border border-border/80 rounded-[3px] p-1 shadow-xl text-xs">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Nastavenia sprievodcu</span>
          </button>
        </div>
      )}

      {/* GUIDELINES TABLE CONTAINER */}
      <div
        className="bg-[#0e161d] border border-border/60 shadow-sm overflow-hidden"
        style={{ borderRadius: brandRadius }}
      >
        {/* Table Header Row */}
        <div className="hidden sm:grid sm:grid-cols-3 bg-[#17212a] border-b border-border/60 px-5 py-3 text-[11px] font-mono uppercase font-bold tracking-wider text-muted-foreground">
          <div className="col-span-1">Farebný systém</div>
          <div className="col-span-2">Odporúčané použitie & Technická definícia</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/40">
          {activeRowKeys.map((key) => {
            const item = COLOR_SYSTEMS_GLOSSARY[key];
            if (!item) return null;
            const Icon = item.icon;
            const title = resolveI18nText(item.name, locale);
            const category = resolveI18nText(item.category, locale);
            const whenToUse = resolveI18nText(item.whenToUse, locale);
            const desc = resolveI18nText(item.description, locale);

            return (
              <div
                key={key}
                className="p-5 sm:grid sm:grid-cols-3 gap-6 items-start hover:bg-neutral-900/30 transition-colors"
              >
                {/* Left Column (1/3): System Name & Icon Badge */}
                <div className="space-y-1.5 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[2px] bg-[#17212a] border border-border/70 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground tracking-tight">
                        {title}
                      </h4>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                        {category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column (2/3): When to use + Definition */}
                <div className="col-span-2 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-primary block tracking-wider mb-0.5">
                      {locale === "sk" ? "Kedy použiť:" : locale === "cs" ? "Kdy použít:" : "When to use:"}
                    </span>
                    <p className="font-semibold text-foreground leading-snug">
                      {whenToUse}
                    </p>
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed pt-0.5">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OPTIONAL CUSTOM NOTE CALLOUT */}
      {customNoteText && (
        <div
          className="p-4 rounded-[3px] bg-[#17212a] border border-border/70 flex items-start gap-3 text-xs shadow-xs"
          style={{ borderRadius: brandRadius }}
        >
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-foreground text-xs block">
              {locale === "sk" ? "Doplňujúce pravidlo značky:" : locale === "cs" ? "Doplňující pravidlo značky:" : "Brand-specific Rule:"}
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {customNoteText}
            </p>
          </div>
        </div>
      )}

      {/* ADMIN SETTINGS MODAL (Pencil Hell Free) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#0e161d] border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{ borderRadius: brandRadius }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-[#17212a]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Nastavenia edukatívneho sprievodcu (M17)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-neutral-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Checkboxes for systems */}
              <div className="space-y-2.5">
                <span className="font-semibold text-foreground text-xs block">
                  Vyberte farebné systémy, ktoré sa majú v tabuľke zobraziť:
                </span>

                <div className="space-y-2 bg-[#17212a] p-3.5 rounded-[3px] border border-border/40">
                  {(
                    [
                      { id: "hex", label: "HEX (Web & Digitálne aplikácie)" },
                      { id: "rgb", label: "RGB (Obrazovky & Prezentácie)" },
                      { id: "cmyk", label: "CMYK (Ofsetová & Digitálna tlač)" },
                      { id: "pantoneC", label: "Pantone Coated (Natieraný kriedový papier)" },
                      { id: "pantoneU", label: "Pantone Uncoated (Nenatieraný papier)" },
                      { id: "pantoneTcx", label: "Pantone TCX (Textil & Móda)" },
                      { id: "ral", label: "RAL Classic (Priemysel & Laky)" },
                    ] as const
                  ).map((sys) => {
                    const isChecked = Boolean(cfg.enabledRows[sys.id]);
                    return (
                      <label key={sys.id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              enabledRows: {
                                ...cfg.enabledRows,
                                [sys.id]: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-primary focus:ring-primary h-4 w-4 bg-[#0e161d] border-border/70"
                        />
                        <span className="text-foreground text-[11px]">{sys.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Note input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground block">
                  Vlastná doplňujúca poznámka značky (voliteľné):
                </label>
                <textarea
                  rows={2}
                  placeholder="Napr. Fólie na polep áut schvaľuje výhradne produkčné oddelenie..."
                  value={typeof cfg.customNote === "object" ? cfg.customNote.sk || cfg.customNote.en || "" : cfg.customNote || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleSaveConfig({
                      ...cfg,
                      customNote: val ? { en: val, sk: val } : undefined,
                    });
                  }}
                  className="w-full bg-[#17212a] border border-border/50 rounded-[2px] p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Táto poznámka sa vykreslí v spodnej časti ako informačný blok.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-border/60 bg-[#17212a]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-[3px] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
