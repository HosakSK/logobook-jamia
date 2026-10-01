"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Sparkles,
  LayoutTemplate,
  Trash2,
  Check,
  Search,
  Loader2,
  FolderKanban,
  User,
  ArrowRight,
  Layers,
  AlertCircle,
  CopyPlus,
  RefreshCw,
} from "lucide-react";
import { PageTemplateItem } from "@/lib/types/template";
import {
  getPageTemplatesAction,
  applyTemplateToPageAction,
  deletePageTemplateAction,
} from "@/actions/templates";
import { resolveI18nText } from "@/lib/validations/module";

interface TemplateBrowserModalProps {
  pageId: string;
  hasExistingContent: boolean;
  locale?: string;
  onClose: () => void;
  onApplied: () => void;
}

export function TemplateBrowserModal({
  pageId,
  hasExistingContent,
  locale = "en",
  onClose,
  onApplied,
}: TemplateBrowserModalProps) {
  const [activeTab, setActiveTab] = useState<"system" | "personal">("system");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<PageTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply dialog state
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<PageTemplateItem | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Load templates
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getPageTemplatesAction();
      if (!res.success || !res.templates) {
        setError(res.error || "Nepodarilo sa načítať šablóny.");
        return;
      }
      setTemplates(res.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri načítavaní.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((tpl) => {
      // System vs personal tab
      if (activeTab === "system" && !tpl.isSystem) return false;
      if (activeTab === "personal" && tpl.isSystem) return false;

      // Category filter
      if (selectedCategory !== "all" && tpl.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;

      // Search match
      const nameCurrent = resolveI18nText(tpl.name, locale)?.toLowerCase() || "";
      const nameAll = Object.values(tpl.name).join(" ").toLowerCase();
      const desc = tpl.description ? Object.values(tpl.description).join(" ").toLowerCase() : "";
      return nameCurrent.includes(q) || nameAll.includes(q) || desc.includes(q);
    });
  }, [templates, activeTab, selectedCategory, searchQuery, locale]);

  // Unique categories in active tab
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    templates
      .filter((t) => (activeTab === "system" ? t.isSystem : !t.isSystem))
      .forEach((t) => {
        if (t.category) set.add(t.category);
      });
    return Array.from(set);
  }, [templates, activeTab]);

  // Execute apply action
  const handleApply = async (templateId: string, mode: "replace" | "append") => {
    try {
      setIsApplying(true);
      setError(null);

      const res = await applyTemplateToPageAction(pageId, templateId, mode);
      if (!res.success) {
        setError(res.error || "Nepodarilo sa aplikovať šablónu.");
        return;
      }

      setSelectedTemplateForApply(null);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri aplikovaní.");
    } finally {
      setIsApplying(false);
    }
  };

  // Delete personal template
  const handleDeletePersonalTemplate = async (templateId: string) => {
    if (!confirm("Naozaj chcete vymazať túto osobnú šablónu?")) return;
    try {
      setIsDeletingId(templateId);
      const res = await deletePageTemplateAction(templateId);
      if (!res.success) {
        alert(res.error || "Nepodarilo sa zmazať šablónu.");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err) {
      alert("Chyba pri mazaní.");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/70 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Galéria šablón stránok (Templates)</h3>
              <p className="text-[11px] text-muted-foreground">
                Zvoľte overené rozloženie a okamžite naplňte stránku pripravenými modulmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (System vs Personal) */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("system");
                setSelectedCategory("all");
              }}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "system"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Systémové šablóny ({templates.filter((t) => t.isSystem).length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("personal");
                setSelectedCategory("all");
              }}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "personal"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Moje vlastné šablóny ({templates.filter((t) => !t.isSystem).length})</span>
            </button>
          </div>

          <div className="relative w-48 sm:w-64 pb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrovať šablóny..."
              className="w-full pl-8 pr-3 py-1 text-xs rounded border border-border/60 bg-background text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        {availableCategories.length > 0 && (
          <div className="px-6 py-2 border-b border-border/30 flex items-center gap-1.5 overflow-x-auto text-xs bg-muted/5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Všetky kategórie
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Načítavam galériu šablón...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-border/60 rounded-xl p-8 bg-muted/10">
              <FolderKanban className="w-10 h-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {activeTab === "personal"
                    ? "Zatiaľ nemáte žiadne vlastné šablóny"
                    : "Nenašli sa žiadne vyhovujúce šablóny"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {activeTab === "personal"
                    ? "Akúkoľvek hotovú stránku s modulmi si môžete uložiť do vlastných šablón pomocou tlačidla 'Uložiť stránku ako šablónu'."
                    : "Skúste upraviť filter alebo vyhľadávanie."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const title = resolveI18nText(tpl.name, locale) || "Untitled Template";
                const desc = tpl.description ? resolveI18nText(tpl.description, locale) : null;
                const containerCount = tpl.structure?.containers?.length || 0;

                // Extract all module types contained in this template
                const moduleTypes: string[] = [];
                tpl.structure?.containers?.forEach((c) => {
                  c.columns?.forEach((col) => {
                    col.modules?.forEach((m) => {
                      if (!moduleTypes.includes(m.moduleType)) {
                        moduleTypes.push(m.moduleType);
                      }
                    });
                  });
                });

                return (
                  <div
                    key={tpl.id}
                    className="border border-border/60 rounded-lg p-5 bg-card/50 hover:bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 shadow-2xs group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {tpl.category || "Všeobecné"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {containerCount} {containerCount === 1 ? "riadok" : "riadkov"}
                          </span>
                          {!tpl.isSystem && (
                            <button
                              onClick={() => handleDeletePersonalTemplate(tpl.id)}
                              disabled={isDeletingId === tpl.id}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                              title="Vymazať vlastnú šablónu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {title}
                        </h4>
                        {desc && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {desc}
                          </p>
                        )}
                      </div>

                      {/* Modules tags preview */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {moduleTypes.map((mType) => {
                          const shortName = mType.split("_")[0];
                          return (
                            <span
                              key={mType}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
                              title={mType}
                            >
                              {shortName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        if (hasExistingContent) {
                          // Prompt user for Replace vs Append (Option A!)
                          setSelectedTemplateForApply(tpl);
                        } else {
                          // Page is empty: apply directly
                          handleApply(tpl.id, "replace");
                        }
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground border border-border/60 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Použiť túto šablónu</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-muted/10 text-xs text-muted-foreground">
          <span>
            Zobrazených <strong>{filteredTemplates.length}</strong> šablón
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Zavrieť
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Replace vs Append (Option A) */}
      {selectedTemplateForApply && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedTemplateForApply(null)}
        >
          <div
            className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-md w-full p-6 text-foreground space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Aplikovanie šablóny na existujúci obsah
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Táto stránka už obsahuje vytvorené riadky a moduly. Ako si želáte šablónu použiť?
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {/* Option 1: Replace */}
              <button
                type="button"
                disabled={isApplying}
                onClick={() => handleApply(selectedTemplateForApply.id, "replace")}
                className="w-full text-left p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Nahradiť existujúci obsah stránky
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Vymaže všetky súčasné riadky na tejto stránke a kompletne ich nahradí vybranou šablónou.
                </p>
              </button>

              {/* Option 2: Append */}
              <button
                type="button"
                disabled={isApplying}
                onClick={() => handleApply(selectedTemplateForApply.id, "append")}
                className="w-full text-left p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CopyPlus className="w-3.5 h-3.5 text-primary" />
                    Pridať šablónu pod existujúci obsah
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Ponechá vaše doterajšie riadky nedotknuté a vloží riadky zo šablóny na koniec stránky.
                </p>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isApplying}
                onClick={() => setSelectedTemplateForApply(null)}
                className="px-3 py-1.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
