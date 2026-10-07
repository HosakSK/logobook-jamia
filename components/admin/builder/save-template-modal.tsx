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
      className="dark fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in duration-200 text-[#fafbfc]"
      data-theme="dark"
      onClick={onClose}
    >
      <div
        className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-[#fafbfc] space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] text-[#fafbfc]"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fafbfc]">Uložiť stránku ako šablónu</h3>
              <p className="text-[11px] text-[#96abbe]">
                Vytvorí znovupoužiteľnú šablónu pre ďalšie stránky a značky
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#96abbe] hover:text-[#fafbfc] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#0e161d] text-[#fafbfc]">
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#96abbe]">Názov (English) *</label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Minimalist Logo Showcase"
                className="w-full px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#96abbe]">Názov (Slovensky) *</label>
              <input
                type="text"
                required
                value={nameSk}
                onChange={(e) => setNameSk(e.target.value)}
                placeholder="napr. Prezentácia loga"
                className="w-full px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#96abbe]">Kategória šablóny</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 text-xs rounded border text-center transition-all cursor-pointer ${
                    category === cat
                      ? "bg-primary text-[#070b0f] font-bold border-primary shadow-xs"
                      : "bg-[#17212a] text-[#96abbe] hover:text-[#fafbfc] border-[rgba(63,85,102,0.45)] hover:bg-[#1f2c36]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#96abbe]">Popis šablóny (voliteľné)</label>
            <textarea
              value={descSk}
              onChange={(e) => {
                setDescSk(e.target.value);
                if (!descEn) setDescEn(e.target.value);
              }}
              rows={2}
              placeholder="Krátky popis rozloženia a odporúčaného použitia..."
              className="w-full px-3 py-1.5 text-xs rounded border border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[rgba(63,85,102,0.45)]">
            <span className="text-[11px] text-[#96abbe] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Šablóna bude uložená do vašich osobných šablón
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium rounded hover:bg-white/10 text-[#96abbe] hover:text-[#fafbfc] cursor-pointer transition-colors"
              >
                Zrušiť
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-bold rounded bg-primary text-[#070b0f] hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
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
