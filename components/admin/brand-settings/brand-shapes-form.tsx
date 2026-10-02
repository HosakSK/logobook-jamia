"use client";

import { useState, useTransition } from "react";
import { updateGlobalShapesAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Square, CircleCheck, AlertTriangle, XCircle } from "lucide-react";

interface BrandShapesFormProps {
  brandId: string;
  initialShapes?: {
    radiusMode?: string;
    customRadiusPx?: number;
    borderWidthPx?: number;
    semanticSuccess?: string;
    semanticWarning?: string;
    semanticDanger?: string;
    semanticInfo?: string;
    manualBgColor?: string;
  } | null;
  dict: Dictionary;
}

export function BrandShapesForm({ brandId, initialShapes, dict }: BrandShapesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form states for live preview
  const rawRadius = (initialShapes?.radiusMode || "rounded").toLowerCase().trim();
  const validRadius = rawRadius === "sharp" || rawRadius === "pill" || rawRadius === "rounded" ? rawRadius : "rounded";

  const [radiusMode, setRadiusMode] = useState<string>(validRadius);
  const [customRadius, setCustomRadius] = useState<number>(initialShapes?.customRadiusPx ?? 3);
  const [borderWidth, setBorderWidth] = useState<number>(initialShapes?.borderWidthPx ?? 1);
  const [successColor, setSuccessColor] = useState<string>(initialShapes?.semanticSuccess || "#009f80");
  const [warningColor, setWarningColor] = useState<string>(initialShapes?.semanticWarning || "#c8d400");
  const [dangerColor, setDangerColor] = useState<string>(initialShapes?.semanticDanger || "#bb4934");
  const [infoColor, setInfoColor] = useState<string>(initialShapes?.semanticInfo || "#2b3b48");
  const [manualBgColor, setManualBgColor] = useState<string>(initialShapes?.manualBgColor || "#0e161d");

  // Effective preview radius
  const previewRadiusPx =
    radiusMode === "sharp" ? 0 : radiusMode === "pill" ? 9999 : customRadius;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("radiusMode", radiusMode);
    formData.set("manualBgColor", manualBgColor);

    startTransition(async () => {
      const res = await updateGlobalShapesAction(brandId, null, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update visual shapes");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/40 rounded-2xl bg-card p-6 sm:p-8 shadow-sm space-y-8">
      <div className="border-b border-border/30 pb-5">
        <h2 className="text-lg font-bold text-foreground">{dict.admin.globalShapesTitle}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {dict.admin.globalShapesDesc}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>{dict.admin.changesSaved}</span>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="p-6 rounded-2xl border border-border/60 bg-background/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            Živý náhľad tvarov a pozadia manuálu
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Pozadie: {manualBgColor}
          </span>
        </div>
        <div
          style={{
            backgroundColor: manualBgColor,
            color: manualBgColor === "#ffffff" || manualBgColor === "#f8fafc" ? "#070b0f" : "#fafbfc",
          }}
          className="p-6 sm:p-8 rounded-xl border border-border/40 transition-colors shadow-inner"
        >
          <div
            style={{
              borderRadius: `${previewRadiusPx}px`,
              borderWidth: `${borderWidth}px`,
              borderColor: manualBgColor === "#ffffff" || manualBgColor === "#f8fafc" ? "rgba(0,0,0,0.12)" : "rgba(63,85,102,0.45)",
              backgroundColor: manualBgColor === "#ffffff" ? "#f8fafc" : manualBgColor === "#f8fafc" ? "#ffffff" : "rgba(23, 33, 42, 0.9)",
            }}
            className="p-6 transition-all flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md"
          >
            <div className="space-y-1.5 text-center sm:text-left">
              <h4 className="text-sm font-bold">Ukážkový kontajner modulu</h4>
              <p className="text-xs opacity-75">
                Zaoblenie: {previewRadiusPx}px | Orámovanie: {borderWidth}px
              </p>
            </div>

            {/* Sample Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span
                style={{
                  borderRadius: `${previewRadiusPx}px`,
                  backgroundColor: `${successColor}25`,
                  borderColor: successColor,
                  color: successColor,
                }}
                className="px-3.5 py-1.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs"
              >
                <CircleCheck className="h-3.5 w-3.5" /> Do&apos;s
              </span>
              <span
                style={{
                  borderRadius: `${previewRadiusPx}px`,
                  backgroundColor: `${warningColor}25`,
                  borderColor: warningColor,
                  color: warningColor,
                }}
                className="px-3.5 py-1.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Notice
              </span>
              <span
                style={{
                  borderRadius: `${previewRadiusPx}px`,
                  backgroundColor: `${dangerColor}25`,
                  borderColor: dangerColor,
                  color: dangerColor,
                }}
                className="px-3.5 py-1.5 text-xs font-bold border flex items-center gap-1.5 shadow-xs"
              >
                <XCircle className="h-3.5 w-3.5" /> Don&apos;ts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Radius Mode Selector */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {dict.admin.cornerRounding}
        </Label>
        <div className="grid grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => setRadiusMode("sharp")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "sharp"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <Square className="h-5 w-5" />
            <span className="font-medium">{dict.admin.radiusSharp}</span>
          </button>

          <button
            type="button"
            onClick={() => setRadiusMode("rounded")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "rounded"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <div className="h-5 w-5 rounded-md border-2 border-current" />
            <span className="font-medium">{dict.admin.radiusRounded}</span>
          </button>

          <button
            type="button"
            onClick={() => setRadiusMode("pill")}
            className={`p-4 sm:p-5 text-xs rounded-xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
              radiusMode === "pill"
                ? "border-[#c8d400] bg-[#c8d400]/10 text-foreground font-semibold shadow-[0_0_20px_rgba(200,212,0,0.12)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40 text-muted-foreground"
            }`}
          >
            <div className="h-4 w-6 rounded-full border-2 border-current" />
            <span className="font-medium">{dict.admin.radiusPill}</span>
          </button>
        </div>
      </div>

      {/* Numerical Adjustments */}
      <div className="grid sm:grid-cols-2 gap-6">
        {radiusMode === "rounded" && (
          <div className="space-y-2.5">
            <Label htmlFor="customRadiusPx" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.customRadiusLabel}
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="32"
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value))}
                className="flex-1 accent-[#c8d400] h-2 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <Input
                id="customRadiusPx"
                name="customRadiusPx"
                type="number"
                min={0}
                max={64}
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value))}
                className="w-20 h-10 text-xs rounded-xl bg-background/50 border-border/60 text-center font-mono"
              />
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <Label htmlFor="borderWidthPx" className="text-xs font-semibold text-muted-foreground">
            {dict.admin.borderWidthLabel} (px)
          </Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="6"
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="flex-1 accent-[#c8d400] h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <Input
              id="borderWidthPx"
              name="borderWidthPx"
              type="number"
              min={0}
              max={8}
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="w-20 h-10 text-xs rounded-xl bg-background/50 border-border/60 text-center font-mono"
            />
          </div>
        </div>
      </div>

      {/* Semantic Color Pickers */}
      <div className="pt-4 border-t border-border/30 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {dict.admin.semanticColorsLabel}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Tieto farby sa používajú na systémové označenia a vizuálne akcenty v moduloch Do&apos;s &amp; Don&apos;ts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Success */}
          <div className="space-y-2">
            <Label htmlFor="semanticSuccess" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.semanticSuccess}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={successColor}
                onChange={(e) => setSuccessColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticSuccess"
                name="semanticSuccess"
                value={successColor}
                onChange={(e) => setSuccessColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="space-y-2">
            <Label htmlFor="semanticWarning" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.semanticWarning}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticWarning"
                name="semanticWarning"
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Danger */}
          <div className="space-y-2">
            <Label htmlFor="semanticDanger" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.semanticDanger}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={dangerColor}
                onChange={(e) => setDangerColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticDanger"
                name="semanticDanger"
                value={dangerColor}
                onChange={(e) => setDangerColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <Label htmlFor="semanticInfo" className="text-xs font-semibold text-muted-foreground">
              {dict.admin.semanticInfo}
            </Label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={infoColor}
                onChange={(e) => setInfoColor(e.target.value)}
                className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
              />
              <Input
                id="semanticInfo"
                name="semanticInfo"
                value={infoColor}
                onChange={(e) => setInfoColor(e.target.value)}
                className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Manual Background Color Setting */}
      <div className="pt-4 border-t border-border/30 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Farba pozadia verejného manuálu
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Zvoľte celkovú farbu plátna / pozadia pre verejný brand manuál. Administrátorské rozhranie ostáva v systémovom tmavom režime.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => setManualBgColor("#0e161d")}
            className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              manualBgColor.toLowerCase() === "#0e161d"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_15px_rgba(200,212,0,0.1)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#0e161d] border border-white/20 shrink-0 shadow-xs" />
            <div>
              <div className="text-xs font-semibold">Tmavá (Default)</div>
              <div className="text-[11px] text-muted-foreground font-mono">#0e161d</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setManualBgColor("#ffffff")}
            className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              manualBgColor.toLowerCase() === "#ffffff"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_15px_rgba(200,212,0,0.1)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#ffffff] border border-black/20 shrink-0 shadow-xs" />
            <div>
              <div className="text-xs font-semibold">Čistá biela</div>
              <div className="text-[11px] text-muted-foreground font-mono">#ffffff</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setManualBgColor("#f8fafc")}
            className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              manualBgColor.toLowerCase() === "#f8fafc"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_15px_rgba(200,212,0,0.1)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#f8fafc] border border-black/20 shrink-0 shadow-xs" />
            <div>
              <div className="text-xs font-semibold">Mäkký papier</div>
              <div className="text-[11px] text-muted-foreground font-mono">#f8fafc</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setManualBgColor("#070b0f")}
            className={`p-4 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
              manualBgColor.toLowerCase() === "#070b0f"
                ? "border-[#c8d400] bg-[#c8d400]/10 shadow-[0_0_15px_rgba(200,212,0,0.1)]"
                : "border-border/60 hover:border-border hover:bg-neutral-800/40"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-[#070b0f] border border-white/20 shrink-0 shadow-xs" />
            <div>
              <div className="text-xs font-semibold">Hlboká čierna</div>
              <div className="text-[11px] text-muted-foreground font-mono">#070b0f</div>
            </div>
          </button>
        </div>

        {/* Custom hex selector */}
        <div className="flex items-center gap-3.5 max-w-xs pt-1">
          <input
            type="color"
            value={manualBgColor.startsWith("#") && manualBgColor.length === 7 ? manualBgColor : "#0e161d"}
            onChange={(e) => setManualBgColor(e.target.value)}
            className="h-10 w-10 rounded-xl border border-border/60 p-0.5 bg-transparent cursor-pointer shrink-0"
          />
          <Input
            id="manualBgColor"
            name="manualBgColor"
            value={manualBgColor}
            onChange={(e) => setManualBgColor(e.target.value)}
            placeholder="#0e161d"
            className="h-10 text-xs rounded-xl bg-background/50 border-border/60 font-mono"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="shadow-md"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {dict.admin.saving}
            </>
          ) : (
            dict.admin.saveChanges
          )}
        </Button>
      </div>
    </form>
  );
}
