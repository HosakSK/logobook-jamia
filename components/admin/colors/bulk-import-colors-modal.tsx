"use client";

import { useState, useTransition } from "react";
import { bulkImportColorsAction } from "@/actions/colors";
import { hexColorRegex } from "@/lib/validations/color";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  X,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface BulkImportColorsModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportColorsModal({
  brandId,
  isOpen,
  onClose,
  onSuccess,
}: BulkImportColorsModalProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  // Real-time extracted valid hex colors
  const matches = text.match(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  const validHexes: string[] = [];
  for (const m of matches) {
    const formatted = m.startsWith("#") ? m.toUpperCase() : `#${m.toUpperCase()}`;
    if (hexColorRegex.test(formatted) && !validHexes.includes(formatted)) {
      validHexes.push(formatted);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validHexes.length === 0) {
      setError("Vložte aspoň jeden platný HEX kód farby.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await bulkImportColorsAction(brandId, text);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(63,85,102,0.4)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#fafbfc] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#c8d400]" />
              <span>Hromadný import farieb (HEX)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vložte zoznam HEX kódov oddelených čiarkami alebo novými riadkami.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-400 rounded-[3px] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">HEX kódy (zoznam)</Label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="#0055FF, #C8D400, #BB4934, #17212A, #FFFFFF"
              className="w-full mt-1.5 p-3 rounded-[3px] bg-neutral-900 border border-border/60 text-xs font-mono text-foreground focus:outline-hidden focus:border-[#c8d400] resize-y"
            />
          </div>

          {/* Live parsed preview chips */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
              <span>Rozpoznané farby ({validHexes.length}):</span>
              {validHexes.length > 0 && (
                <span className="text-[#c8d400] font-mono">Pripravené na import</span>
              )}
            </div>

            {validHexes.length === 0 ? (
              <div className="p-4 rounded-[3px] border border-dashed border-border/40 text-center text-xs text-muted-foreground italic">
                Zatiaľ neboli rozpoznané žiadne platné farby.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-[3px] bg-neutral-950 border border-border/40">
                {validHexes.map((hex) => (
                  <div
                    key={hex}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-neutral-900 border border-border/50 text-xs font-mono"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-[2px] border border-white/20 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[11px] font-bold text-foreground">{hex}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs rounded-[3px] border-border/50"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || validHexes.length === 0}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Importujem...</span>
                </>
              ) : (
                <span>Importovať {validHexes.length} farieb</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
