"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { saveGlobalColorAction } from "@/actions/colors";
import { COLOR_ROLES, ColorRole } from "@/lib/validations/color";
import {
  hexToRgb,
  getWcagContrast,
  findNearestRal,
  RalMatch,
} from "@/lib/utils/color-calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Palette,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
  Check,
  ArrowRight,
} from "lucide-react";

interface ColorEditorModalProps {
  color: BrandColor | null;
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ColorEditorModal({
  color,
  brandId,
  isOpen,
  onClose,
  onSuccess,
}: ColorEditorModalProps) {
  const isEditing = Boolean(color);

  const [hex, setHex] = useState(color?.hex || "#0055FF");
  const [name, setName] = useState(color?.name.en || color?.name.sk || "");
  const [nameSk, setNameSk] = useState(color?.name.sk || "");
  const [role, setRole] = useState<ColorRole>(color?.role || "PRIMARY");

  // Color values
  const [rgb, setRgb] = useState(color?.rgb || "");
  const [cmykC, setCmykC] = useState<string>(color?.cmykC?.toString() ?? "");
  const [cmykM, setCmykM] = useState<string>(color?.cmykM?.toString() ?? "");
  const [cmykY, setCmykY] = useState<string>(color?.cmykY?.toString() ?? "");
  const [cmykK, setCmykK] = useState<string>(color?.cmykK?.toString() ?? "");

  const [pantoneC, setPantoneC] = useState(color?.pantoneC || "");
  const [pantoneU, setPantoneU] = useState(color?.pantoneU || "");
  const [ral, setRal] = useState(color?.ral || "");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset or initialize state when color prop changes
  useEffect(() => {
    if (color) {
      setHex(color.hex);
      setName(color.name.en || color.name.sk || "");
      setNameSk(color.name.sk || "");
      setRole(color.role);
      setRgb(color.rgb);
      setCmykC(color.cmykC?.toString() ?? "");
      setCmykM(color.cmykM?.toString() ?? "");
      setCmykY(color.cmykY?.toString() ?? "");
      setCmykK(color.cmykK?.toString() ?? "");
      setPantoneC(color.pantoneC || "");
      setPantoneU(color.pantoneU || "");
      setRal(color.ral || "");
    } else {
      setHex("#0055FF");
      setName("Primary Blue");
      setNameSk("Primárna modrá");
      setRole("PRIMARY");
      setRgb("0, 85, 255");
      setCmykC("");
      setCmykM("");
      setCmykY("");
      setCmykK("");
      setPantoneC("");
      setPantoneU("");
      setRal("");
    }
  }, [color, isOpen]);

  // Compute live contrast and nearest RAL
  const contrast = getWcagContrast(hex);
  const nearestRal: RalMatch | null = findNearestRal(hex);

  // Handle HEX change from color picker or input
  const handleHexChange = (newHex: string) => {
    setHex(newHex);
    const parsedRgb = hexToRgb(newHex);
    if (parsedRgb) {
      setRgb(`${parsedRgb.r}, ${parsedRgb.g}, ${parsedRgb.b}`);
    }
  };

  const handleApplyNearestRal = () => {
    if (nearestRal) {
      setRal(nearestRal.code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("nameSk", nameSk);
    formData.append("role", role);
    formData.append("hex", hex);
    formData.append("rgb", rgb);

    if (cmykC) formData.append("cmykC", cmykC);
    if (cmykM) formData.append("cmykM", cmykM);
    if (cmykY) formData.append("cmykY", cmykY);
    if (cmykK) formData.append("cmykK", cmykK);

    if (pantoneC) formData.append("pantoneC", pantoneC);
    if (pantoneU) formData.append("pantoneU", pantoneU);
    if (ral) formData.append("ral", ral);

    startTransition(async () => {
      const res = await saveGlobalColorAction(brandId, color?.id || null, formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(63,85,102,0.4)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#fafbfc] flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#c8d400]" />
              <span>{isEditing ? "Upraviť farbu značky" : "Pridať novú farbu do palety"}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Definícia presných hodnôt pre digitál (RGB/HEX) a tlačové štandardy (CMYK, Pantone, RAL).
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-400 rounded-[3px] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Color Picker & Live Swatch Preview */}
          <div className="p-4 rounded-[3px] bg-neutral-900 border border-border/40 space-y-4">
            <div className="flex items-center gap-4">
              {/* Native picker synced */}
              <div className="relative h-14 w-14 shrink-0 rounded-[3px] overflow-hidden border-2 border-border/60 shadow-xs cursor-pointer">
                <input
                  type="color"
                  value={hex.length === 7 ? hex : "#0055FF"}
                  onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                  className="absolute -top-3 -left-3 w-20 h-20 cursor-pointer border-0 p-0"
                />
              </div>

              {/* HEX & RGB inputs */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <Label className="text-[11px] text-muted-foreground">HEX kód</Label>
                  <Input
                    value={hex}
                    onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                    placeholder="#0055FF"
                    required
                    className="mt-1 h-9 rounded-[3px] bg-neutral-950 border-border/60 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">RGB hodnota</Label>
                  <Input
                    value={rgb}
                    onChange={(e) => setRgb(e.target.value)}
                    placeholder="0, 85, 255"
                    className="mt-1 h-9 rounded-[3px] bg-neutral-950 border-border/60 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live WCAG Contrast & Nearest RAL info strip */}
            <div className="pt-3 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* WCAG Preview */}
              <div className="p-2.5 rounded-[2px] bg-neutral-950/60 border border-border/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">WCAG Kontrast</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-foreground">
                      {contrast.preferredText === "white"
                        ? `${contrast.whiteRatio}:1 (Biela)`
                        : `${contrast.blackRatio}:1 (Čierna)`}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] ${
                        (contrast.preferredText === "white"
                          ? contrast.whiteScore
                          : contrast.blackScore) === "Fail"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {contrast.preferredText === "white" ? contrast.whiteScore : contrast.blackScore}
                    </span>
                  </div>
                </div>
                <div
                  className="h-8 w-12 rounded-[2px] flex items-center justify-center font-bold text-[10px] shadow-xs"
                  style={{ backgroundColor: hex, color: contrast.preferredText }}
                >
                  Text
                </div>
              </div>

              {/* RAL Match */}
              <div className="p-2.5 rounded-[2px] bg-neutral-950/60 border border-border/30 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                    Najbližšia RAL zhoda ({nearestRal?.similarity}%)
                  </span>
                  <span className="font-mono text-xs font-bold text-[#c8d400] truncate block">
                    {nearestRal?.code} ({nearestRal?.name})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyNearestRal}
                  className="px-2 py-1 rounded-[2px] bg-neutral-800 hover:bg-[#c8d400] hover:text-[#070b0f] text-[10px] font-semibold text-foreground transition-colors shrink-0"
                >
                  Použiť
                </button>
              </div>
            </div>
          </div>

          {/* Names and Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Názov (EN / Predvolený)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Primary Blue"
                required
                className="mt-1 h-9 rounded-[3px] bg-neutral-900 border-border/60 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Názov (SK)</Label>
              <Input
                value={nameSk}
                onChange={(e) => setNameSk(e.target.value)}
                placeholder="napr. Primárna modrá"
                className="mt-1 h-9 rounded-[3px] bg-neutral-900 border-border/60 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sémantická rola</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ColorRole)}
                className="w-full mt-1 h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
              >
                <option value="PRIMARY">PRIMARY (Primárna farba značky)</option>
                <option value="SECONDARY">SECONDARY (Sekundárna farba)</option>
                <option value="ACCENT">ACCENT (Akcent / Tlačidlá)</option>
                <option value="NEUTRAL">NEUTRAL (Neutrálna / Podklad)</option>
                <option value="CUSTOM">CUSTOM (Doplnková)</option>
              </select>
            </div>
          </div>

          {/* Print Standards Section (CMYK, Pantone, RAL) */}
          <div className="space-y-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Tlačové normy (DTP)
              </span>
              <span className="text-[10px] text-muted-foreground italic">
                *CMYK sa neautopočíta, zadajte hodnoty z tlačového manuálu
              </span>
            </div>

            {/* CMYK Inputs */}
            <div>
              <Label className="text-[11px] text-muted-foreground">CMYK hodnoty (0 až 100 %)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1 font-mono">
                <div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-400">
                      C
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={cmykC}
                      onChange={(e) => setCmykC(e.target.value)}
                      placeholder="0"
                      className="pl-7 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-fuchsia-400">
                      M
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={cmykM}
                      onChange={(e) => setCmykM(e.target.value)}
                      placeholder="0"
                      className="pl-7 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-yellow-400">
                      Y
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={cmykY}
                      onChange={(e) => setCmykY(e.target.value)}
                      placeholder="0"
                      className="pl-7 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">
                      K
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={cmykK}
                      onChange={(e) => setCmykK(e.target.value)}
                      placeholder="0"
                      className="pl-7 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RAL and Pantone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">RAL kód</Label>
                <Input
                  value={ral}
                  onChange={(e) => setRal(e.target.value.toUpperCase())}
                  placeholder="napr. RAL 5002"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60 font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Pantone Coated (C)</Label>
                <Input
                  value={pantoneC}
                  onChange={(e) => setPantoneC(e.target.value)}
                  placeholder="napr. 286 C"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60 font-mono"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Pantone Uncoated (U)</Label>
                <Input
                  value={pantoneU}
                  onChange={(e) => setPantoneU(e.target.value)}
                  placeholder="napr. 286 U"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-neutral-900 border-border/60 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={isPending}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Ukladám...</span>
                </>
              ) : (
                <span>{isEditing ? "Uložiť zmeny" : "Pridať farbu do palety"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
