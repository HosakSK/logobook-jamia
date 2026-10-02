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
      <div className="border border-red-500/30 rounded-2xl bg-red-950/20 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {dict.admin.dangerZone}
            </h2>
            <p className="text-xs text-red-300/70 max-w-xl leading-relaxed">
              {dict.admin.dangerZoneDesc}
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={() => {
              setConfirmInput("");
              setError(null);
              setIsOpen(true);
            }}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>{dict.admin.deleteBrand}</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#141e27] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2.5 text-red-400 font-bold text-lg">
                <AlertTriangle className="h-5 w-5" />
                <h3>{dict.admin.deleteBrandModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-4 text-xs bg-red-950/60 border border-red-500/50 text-red-300 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <p>
                Tento krok je <strong>nezvratný</strong>. Zmaže sa celá štruktúra stránok, farby, typografia a priradené assety.
              </p>
              <p>
                {dict.admin.deleteBrandConfirmPrompt}{" "}
                <span className="font-bold text-foreground font-mono bg-neutral-800 px-2 py-0.5 rounded-md">
                  {brandName}
                </span>
              </p>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={brandName}
                className="h-10 text-xs rounded-xl bg-background border-border/60 font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setIsOpen(false)}
              >
                Zrušiť
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="default"
                disabled={!isConfirmed || isPending}
                onClick={handleDelete}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>{dict.admin.deleting}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
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
