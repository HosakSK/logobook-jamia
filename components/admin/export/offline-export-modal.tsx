"use client";

import React from "react";
import {
  FileArchive,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HardDriveDownload,
  Sparkles,
} from "lucide-react";
import { PublishedBrandSnapshot, getBrandPublishedSnapshotAction } from "@/actions/publish";
import { useOfflineExport } from "@/lib/hooks/use-offline-export";
import { Button } from "@/components/ui/button";

export interface OfflineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandSlug: string;
  brandName: string;
  snapshot?: PublishedBrandSnapshot | null;
}

export function OfflineExportModal({
  isOpen,
  onClose,
  brandId,
  brandSlug,
  brandName,
  snapshot,
}: OfflineExportModalProps) {
  const { isExporting, progress, statusText, error, startExport, reset } = useOfflineExport();
  const [activeSnapshot, setActiveSnapshot] = React.useState<PublishedBrandSnapshot | null>(snapshot || null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = React.useState(false);

  React.useEffect(() => {
    if (snapshot) {
      setActiveSnapshot(snapshot);
    } else if (isOpen && brandId) {
      setIsLoadingSnapshot(true);
      getBrandPublishedSnapshotAction(brandId).then((res) => {
        if (res.success && res.snapshot) {
          setActiveSnapshot(res.snapshot);
        }
        setIsLoadingSnapshot(false);
      });
    }
  }, [snapshot, isOpen, brandId]);

  if (!isOpen) return null;

  const isPublished = Boolean(activeSnapshot && activeSnapshot.pages && activeSnapshot.pages.length > 0);

  const handleStart = async () => {
    if (!activeSnapshot) return;
    await startExport(activeSnapshot, brandSlug);
  };

  const handleClose = () => {
    if (isExporting) return; // prevent closing while packaging
    reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
    >
      <div
        className="w-full max-w-lg bg-[#0e161d] border border-border/80 rounded-[4px] shadow-2xl p-6 space-y-6 relative animate-in zoom-in-95 duration-150 text-foreground"
        style={{ backgroundColor: "#0e161d" }}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {!isExporting && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Zatvoriť"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-[3px] bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileArchive className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Offline ZIP Export Manuálu
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Zabaľte kompletný brand manuál značky <strong>{brandName}</strong> do jedného statického
              ZIP archívu. Funguje kdekoľvek bez internetového pripojenia.
            </p>
          </div>
        </div>

        {/* Status & Warning Notice */}
        {!isPublished ? (
          <div className="p-4 rounded-[3px] bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Manuál ešte nebol publikovaný.</strong> Offline archív je možné vygenerovať iba
              z publikovanej verzie. Vráťte sa do Page Buildera a kliknite na <em>Publikovať</em>.
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-[3px] bg-muted/30 border border-border/50 text-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
              <span>Publikovaná verzia:</span>
              <span className="text-foreground font-bold">v{activeSnapshot?.version}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
              <span>Počet kapitol:</span>
              <span className="text-foreground font-bold">{activeSnapshot?.pages?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
              <span>Dátum snapshotu:</span>
              <span className="text-foreground">
                {activeSnapshot?.publishedAt
                  ? new Date(activeSnapshot.publishedAt).toLocaleDateString()
                  : "Dnes"}
              </span>
            </div>
          </div>
        )}

        {/* Progress Display */}
        {isExporting && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                <span>Prebieha balenie archívu</span>
              </span>
              <span className="font-mono text-primary font-bold">{progress}%</span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-neutral-900 border border-border/40 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground font-mono truncate">{statusText}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-[3px] bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Features Checklist */}
        <div className="border-t border-border/40 pt-4 space-y-2 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
            Obsah ZIP balíčka:
          </div>
          <ul className="space-y-1 text-[11px]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Samostatný <code>index.html</code> s interaktívnou navigáciou kapitol</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Lokálne stiahnuté grafické materiály a SVG logá v priečinku <code>assets/</code></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Design tokeny v priečinku <code>tokens/</code> (CSS premenné a W3C JSON)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Klientske spracovanie bez zaťaženia servera (Client-side JSZip)</span>
            </li>
          </ul>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isExporting}
            className="text-xs h-9 cursor-pointer"
          >
            {isExporting ? "Počkajte..." : "Zatvoriť"}
          </Button>

          {isPublished && (
            <Button
              type="button"
              onClick={handleStart}
              disabled={isExporting}
              className="text-xs h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generujem ZIP ({progress}%)...</span>
                </>
              ) : (
                <>
                  <HardDriveDownload className="h-3.5 w-3.5" />
                  <span>Stiahnuť Offline ZIP</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
