"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FilePlus, Loader2, LayoutGrid, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedInitialBrandPagesAction, createPageAction } from "@/actions/pages";
import { DimensionMatrixWizardModal } from "./dimension-matrix-wizard-modal";

interface BuilderEmptyStateProps {
  brandId: string;
  brandName: string;
}

export function BuilderEmptyState({ brandId, brandName }: BuilderEmptyStateProps) {
  const router = useRouter();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [blankTitle, setBlankTitle] = useState("");
  const [blankSlug, setBlankSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setError(null);
      const res = await seedInitialBrandPagesAction(brandId);
      if (!res.success) {
        setError(res.error || "Nepodarilo sa vygenerovať stránky.");
        return;
      }
      if (res.firstPageId) {
        router.push(`/admin/brand/${brandId}/builder/${res.firstPageId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri generovaní.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateBlank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blankTitle.trim() || !blankSlug.trim()) return;

    try {
      setIsCreatingBlank(true);
      setError(null);
      const res = await createPageAction(brandId, {
        title: blankTitle.trim(),
        slug: blankSlug.trim(),
        menuStyle: "main",
      });

      if (!res.success) {
        setError(res.error || "Nepodarilo sa vytvoriť stránku.");
        return;
      }

      router.push(`/admin/brand/${brandId}/builder/${res.pageId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri vytváraní.");
    } finally {
      setIsCreatingBlank(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-[3px] bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
          <LayoutGrid className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Váš brand manuál zatiaľ nemá žiadne stránky
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Zvoľte si vygenerovanie overenej štruktúry kapitol na jedno kliknutie,
          alebo začnite s prázdnou stránkou podľa vlastných potrieb.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-[3px] bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 text-center">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Option 1: Generate Starter Structure */}
        <div className="border border-primary/40 rounded-[3px] p-6 bg-primary/5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Odporúčaný štart</span>
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Vygenerovať základnú štruktúru
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vytvorí 4 kľúčové kapitoly: <strong>Úvod</strong>, <strong>Logo</strong>,{" "}
              <strong>Farby</strong> a <strong>Typografia</strong> s predkonfigurovanými
              blokmi.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="w-full text-xs font-bold rounded-[2px] bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Spustiť Sprievodcu (Wizard)</span>
          </Button>
        </div>

        {/* Option 2: Blank Page Form */}
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-6 bg-[#17212a] text-[#fafbfc] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#96abbe] font-bold text-xs uppercase tracking-wider">
              <FilePlus className="h-4 w-4" />
              <span>Vlastná stránka</span>
            </div>
            <h3 className="text-sm font-bold text-[#fafbfc]">
              Vytvoriť prázdnu stránku
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vytvorí čistú stránku s jedným riadkom, kde môžete vkladať moduly manuálne.
            </p>
          </div>

          <form onSubmit={handleCreateBlank} className="space-y-2">
            <Input
              type="text"
              required
              value={blankTitle}
              onChange={(e) => {
                setBlankTitle(e.target.value);
                setBlankSlug(
                  e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                );
              }}
              placeholder="Názov (napr. Úvod)"
              className="h-7 text-xs rounded-[2px]"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={isCreatingBlank || !blankTitle.trim()}
              className="w-full text-xs font-semibold rounded-[2px] border-border/60 hover:border-foreground text-foreground"
            >
              {isCreatingBlank ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Vytvoriť prázdnu stránku"
              )}
            </Button>
          </form>
        </div>
      </div>

      {isWizardOpen && (
        <DimensionMatrixWizardModal
          brandId={brandId}
          brandName={brandName}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={(firstPageId) => {
            setIsWizardOpen(false);
            if (firstPageId) {
              router.push(`/admin/brand/${brandId}/builder/${firstPageId}`);
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </div>
  );
}
