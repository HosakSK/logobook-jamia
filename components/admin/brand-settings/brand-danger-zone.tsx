"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface BrandDangerZoneProps {
  brandId: string;
  brandName: string;
  dict: Dictionary;
}

export function BrandDangerZone({ brandId, brandName, dict }: BrandDangerZoneProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConfirmed = confirmInput.trim() === brandName.trim();

  const handleDelete = () => {
    if (!isConfirmed) return;
    setError(null);

    startTransition(async () => {
      const res = await deleteBrandAction(brandId, confirmInput);
      if (res.success) {
        setIsOpen(false);
        router.push("/admin");
      } else {
        setError(res.error || "Failed to delete brand");
      }
    });
  };

  return (
    <>
      <div className="border border-red-500/30 rounded-[3px] bg-red-950/20 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {dict.admin.dangerZone}
            </h2>
            <p className="text-xs text-red-300/70 max-w-xl">
              {dict.admin.dangerZoneDesc}
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setConfirmInput("");
              setError(null);
              setIsOpen(true);
            }}
            className="h-9 px-4 text-xs font-semibold rounded-[3px] shrink-0 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {dict.admin.deleteBrand}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0e161d] border border-red-500/40 rounded-[3px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <AlertTriangle className="h-5 w-5" />
                <h3>{dict.admin.deleteBrandModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-300 rounded-[3px]">
                {error}
              </div>
            )}

            <div className="space-y-3 text-xs text-muted-foreground">
              <p>
                Tento krok je <strong>nezvratný</strong>. Zmaže sa celá štruktúra stránok, farby, typografia a priradené assety.
              </p>
              <p>
                {dict.admin.deleteBrandConfirmPrompt}{" "}
                <span className="font-bold text-foreground font-mono bg-neutral-800/80 px-1.5 py-0.5 rounded-[3px]">
                  {brandName}
                </span>
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={brandName}
                className="h-9 text-xs rounded-[3px] bg-background border-border/60 font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-9 text-xs rounded-[3px] border-border/60"
              >
                Zrušiť
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!isConfirmed || isPending}
                onClick={handleDelete}
                className="h-9 text-xs font-semibold rounded-[3px] gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{dict.admin.deleting}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{dict.admin.deleteConfirmButton}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
