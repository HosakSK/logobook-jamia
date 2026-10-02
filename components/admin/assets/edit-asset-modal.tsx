"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandAsset } from "@/lib/types/asset";
import { updateBrandAssetAction } from "@/actions/assets";
import { suggestLogoName } from "@/lib/utils/asset-naming";
import {
  ASSET_MEDIUMS,
  ASSET_ORIENTATIONS,
  ASSET_BACKGROUNDS,
  AssetMedium,
  AssetOrientation,
  AssetBackground,
} from "@/lib/validations/asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Pencil, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface EditAssetModalProps {
  asset: BrandAsset | null;
  brandId: string;
  brandName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAssetModal({
  asset,
  brandId,
  brandName = "logobook",
  isOpen,
  onClose,
  onSuccess,
}: EditAssetModalProps) {
  const [name, setName] = useState(asset?.name.en || asset?.name.sk || "");
  const [nameSk, setNameSk] = useState(asset?.name.sk || "");
  const [note, setNote] = useState("");
  const [medium, setMedium] = useState<AssetMedium>(asset?.medium || "UNIVERSAL");
  const [orientation, setOrientation] = useState<AssetOrientation>(asset?.orientation || "HORIZONTAL");
  const [background, setBackground] = useState<AssetBackground>(asset?.background || "LIGHT");
  const [hasClaim, setHasClaim] = useState<boolean>(asset?.hasClaim || false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (asset) {
      setName(asset.name.en || asset.name.sk || "");
      setNameSk(asset.name.sk || "");
      setMedium(asset.medium || "UNIVERSAL");
      setOrientation(asset.orientation || "HORIZONTAL");
      setBackground(asset.background || "LIGHT");
      setHasClaim(Boolean(asset.hasClaim));
      setNote("");
      setError(null);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleGenerateName = () => {
    const suggested = suggestLogoName({
      brandName,
      medium,
      orientation,
      hasClaim: orientation === "SYMBOL" ? false : hasClaim,
      background,
      note,
    });
    setName(suggested);
    setNameSk(suggested);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("nameSk", nameSk || name);
    formData.append("medium", medium);
    formData.append("orientation", orientation);
    formData.append("hasClaim", orientation === "SYMBOL" ? "false" : String(hasClaim));
    formData.append("background", background);

    startTransition(async () => {
      const res = await updateBrandAssetAction(asset.id, brandId, formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    });
  };

  const handleOrientationChange = (val: AssetOrientation) => {
    setOrientation(val);
    if (val === "SYMBOL") {
      setHasClaim(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-[3px] bg-card border border-border/60 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/30 pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#c8d400]" />
              <span>Upraviť parametre loga</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Zmena názvu, média a klasifikácie pre maticu logotypov.
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
          {/* Note and Auto-generation */}
          <div className="p-3 rounded-[3px] bg-neutral-900 border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground uppercase font-mono">
                Poznámka pre generovanie názvu
              </Label>
              <button
                type="button"
                onClick={handleGenerateName}
                className="text-[11px] text-[#c8d400] hover:underline flex items-center gap-1 font-mono cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Prepočítať názov z parametrov</span>
              </button>
            </div>
            <Input
              value={note}
              placeholder="napr. poznamka, v2, hlavne"
              onChange={(e) => setNote(e.target.value)}
              className="h-8 text-xs rounded-[3px] bg-neutral-950 border-border/60"
            />
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Názov (EN / Predvolený)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 h-9 rounded-[3px] bg-neutral-900 border-border/60 text-xs font-mono text-[#c8d400]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Názov (SK)</Label>
              <Input
                value={nameSk}
                onChange={(e) => setNameSk(e.target.value)}
                className="mt-1.5 h-9 rounded-[3px] bg-neutral-900 border-border/60 text-xs font-mono"
              />
            </div>
          </div>

          {/* Medium and Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Médium</Label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value as AssetMedium)}
                className="w-full mt-1.5 h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
              >
                <option value="UNIVERSAL">Univerzálne</option>
                <option value="DIGITAL_RGB">Digitál (RGB)</option>
                <option value="PRINT_CMYK">Tlač (CMYK)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Orientácia</Label>
              <select
                value={orientation}
                onChange={(e) => handleOrientationChange(e.target.value as AssetOrientation)}
                className="w-full mt-1.5 h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
              >
                <option value="HORIZONTAL">Horizontálne (width)</option>
                <option value="VERTICAL">Vertikálne (height)</option>
                <option value="SYMBOL">Symbol / Značka</option>
              </select>
            </div>
          </div>

          {/* Background and Claim */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <Label className="text-xs text-muted-foreground">Podklad</Label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value as AssetBackground)}
                className="w-full mt-1.5 h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
              >
                <option value="LIGHT">Svetlý (lightbg)</option>
                <option value="DARK">Tmavý (darkbg)</option>
                <option value="TRANSPARENT">Priehľadný</option>
                <option value="MONOCHROME">Monochróm</option>
                <option value="INVERSE">Inverzný</option>
              </select>
            </div>

            <div className="pt-6">
              <label
                className={`flex items-center gap-2 cursor-pointer text-xs ${
                  orientation === "SYMBOL"
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasClaim}
                  disabled={orientation === "SYMBOL"}
                  onChange={(e) => setHasClaim(e.target.checked)}
                  className="rounded-[2px] accent-[#c8d400]"
                />
                <span>Obsahuje slogan / claim</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs rounded-[3px] border-border/50"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Ukladám...</span>
                </>
              ) : (
                <span>Uložiť zmeny</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
