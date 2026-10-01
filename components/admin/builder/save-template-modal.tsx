"use client";

import React, { useState } from "react";
import { X, BookmarkPlus, Loader2, Check, Sparkles } from "lucide-react";
import { savePageAsTemplateAction } from "@/actions/templates";
import { TemplateCategory } from "@/lib/validations/template";

interface SaveTemplateModalProps {
  pageId: string;
  defaultName?: string;
  onClose: () => void;
  onSuccess: (templateId: string) => void;
}

const CATEGORIES: TemplateCategory[] = [
  "Logo",
  "Farby",
  "Typografia",
  "Materiály",
  "Všeobecné",
];

export function SaveTemplateModal({
  pageId,
  defaultName = "",
  onClose,
  onSuccess,
}: SaveTemplateModalProps) {
  const [nameEn, setNameEn] = useState(defaultName || "Custom Page Template");
  const [nameSk, setNameSk] = useState(defaultName || "Vlastná šablóna stránky");
  const [descEn, setDescEn] = useState("");
  const [descSk, setDescSk] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("Všeobecné");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() && !nameSk.trim()) {
      setError("Zadajte prosím aspoň jeden názov šablóny.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const res = await savePageAsTemplateAction(pageId, {
        name: {
          en: nameEn.trim() || nameSk.trim(),
          sk: nameSk.trim() || nameEn.trim(),
          cs: nameSk.trim() || nameEn.trim(),
        },
        description: {
          en: descEn.trim(),
          sk: descSk.trim(),
          cs: descSk.trim(),
        },
        category,
      });

      if (!res.success || !res.templateId) {
        setError(res.error || "Nepodarilo sa uložiť šablónu.");
        return;
      }

      onSuccess(res.templateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri ukladaní.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border/70 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-foreground space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Uložiť stránku ako šablónu</h3>
              <p className="text-[11px] text-muted-foreground">
                Vytvorí znovupoužiteľnú šablónu pre ďalšie stránky a značky
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Názov (English) *</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Minimalist Logo Showcase"
                className="w-full px-3 py-1.5 text-xs rounded border border-border/60 bg-background text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Názov (Slovensky) *</label>
              <input
                type="text"
                required
                value={nameSk}
                onChange={(e) => setNameSk(e.target.value)}
                placeholder="napr. Prezentácia loga"
                className="w-full px-3 py-1.5 text-xs rounded border border-border/60 bg-background text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Kategória šablóny</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 text-xs rounded border text-center transition-all cursor-pointer ${
                    category === cat
                      ? "bg-primary text-primary-foreground font-semibold border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Popis šablóny (voliteľné)</label>
            <textarea
              value={descSk}
              onChange={(e) => {
                setDescSk(e.target.value);
                if (!descEn) setDescEn(e.target.value);
              }}
              rows={2}
              placeholder="Krátky popis rozloženia a odporúčaného použitia..."
              className="w-full px-3 py-1.5 text-xs rounded border border-border/60 bg-background text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/40">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Šablóna bude uložená do vašich osobných šablón
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Ukladám..." : "Uložiť šablónu"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
