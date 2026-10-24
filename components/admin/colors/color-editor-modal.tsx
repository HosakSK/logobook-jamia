"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { saveGlobalColorAction } from "@/actions/colors";
import {
  COLOR_CATEGORIES,
  ColorCategory,
  COLOR_ROLES,
  ColorRole,
  COLOR_CATEGORY_DEFINITIONS,
  COLOR_ROLE_DEFINITIONS,
  resolveColorCategory,
} from "@/lib/validations/color";
import {
  hexToRgb,
  getWcagContrast,
  getWcagScoreBadgeClass,
  findNearestRal,
  generateSystematicScale,
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
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Type,
  Layers,
  Sliders,
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

  const initialCat = resolveColorCategory(color?.role || "PRIMARY", color?.category);
  const [category, setCategory] = useState<ColorCategory>(initialCat);
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
  const [hasScale, setHasScale] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset or initialize state when color prop changes
  useEffect(() => {
    if (color) {
      setHex(color.hex);
      const initialName =
        color.name.sk ||
        color.name.en ||
        color.name.cs ||
        (typeof color.name === "string" ? color.name : "");
      setName(initialName);
      setNameSk(initialName);
      const cat = resolveColorCategory(color.role, color.category);
      setCategory(cat);
      setRole(color.role);
      setRgb(color.rgb);
      setCmykC(color.cmykC?.toString() ?? "");
      setCmykM(color.cmykM?.toString() ?? "");
      setCmykY(color.cmykY?.toString() ?? "");
      setCmykK(color.cmykK?.toString() ?? "");
      setPantoneC(color.pantoneC || "");
      setPantoneU(color.pantoneU || "");
      setRal(color.ral || "");
      setHasScale(
        typeof color.hasScale === "boolean"
          ? color.hasScale
          : ["PRIMARY", "SECONDARY", "ACCENT", "DIGITAL"].includes(color.role)
      );
    } else {
      setHex("#0055FF");
      setName("Nová farba");
      setNameSk("Nová farba");
      setCategory("CORE");
      setRole("PRIMARY");
      setHasScale(true);
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

  // When category changes, auto-select a valid default role for that category
  const handleCategoryChange = (newCat: ColorCategory) => {
    setCategory(newCat);
    setHasScale(newCat === "CORE" || newCat === "DIGITAL");
    const catDef = COLOR_CATEGORY_DEFINITIONS[newCat];
    if (catDef && !catDef.allowedRoles.includes(role)) {
      setRole(catDef.allowedRoles[0]);
    }
  };

  // Compute live contrast, nearest RAL and 12-step systematic scale
  const contrast = getWcagContrast(hex);
  const nearestRal: RalMatch | null = findNearestRal(hex);
  const systematicScale = generateSystematicScale(hex);

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
    formData.append("category", category);
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
    formData.append("hasScale", hasScale ? "true" : "false");

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

  const currentCatDef = COLOR_CATEGORY_DEFINITIONS[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(63,85,102,0.4)] flex items-center justify-between shrink-0 bg-[#0e161d]">
          <div>
            <h2 className="text-base font-bold text-[#fafbfc] flex items-center gap-2 font-mono">
              <Palette className="h-4 w-4 text-[#c8d400]" />
              <span>{isEditing ? "Upraviť farbu značky" : "Pridať novú farbu do palety"}</span>
            </h2>
            <p className="text-xs text-[#96abbe] mt-0.5">
              Kategorizácia, Day/Night režimy, digitálne tokeny a tlačové normy.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] transition-colors"
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

          {/* 1. Category Selector Pills */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#fafbfc]">
              Kategória farby v manuáli
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLOR_CATEGORIES.map((catKey) => {
                const def = COLOR_CATEGORY_DEFINITIONS[catKey];
                const isSelected = category === catKey;

                let iconNode = <Palette className="h-3.5 w-3.5" />;
                if (catKey === "DIGITAL") iconNode = <Monitor className="h-3.5 w-3.5" />;
                if (catKey === "BACKGROUND") iconNode = <Sun className="h-3.5 w-3.5" />;
                if (catKey === "TYPOGRAPHY") iconNode = <Type className="h-3.5 w-3.5" />;
                if (catKey === "SEMANTIC") iconNode = <ShieldCheck className="h-3.5 w-3.5" />;
                if (catKey === "CUSTOM") iconNode = <Layers className="h-3.5 w-3.5" />;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleCategoryChange(catKey)}
                    className={`p-2.5 rounded-[3px] border text-left flex items-start gap-2 transition-all ${
                      isSelected
                        ? "bg-[#c8d400]/15 border-[#c8d400] text-[#fafbfc] shadow-xs"
                        : "bg-[#070b0f] border-[rgba(63,85,102,0.4)] text-[#96abbe] hover:bg-[#131b22] hover:text-[#fafbfc]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 p-1 rounded-[2px] ${
                        isSelected
                          ? "bg-[#c8d400] text-[#070b0f]"
                          : "bg-[#17212a] text-[#96abbe]"
                      }`}
                    >
                      {iconNode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight truncate">
                        {def.labelSk}
                      </div>
                      <div className="text-[10px] text-[#96abbe] line-clamp-1 mt-0.5">
                        {catKey === "BACKGROUND"
                          ? "Day & Night plátna"
                          : catKey === "TYPOGRAPHY"
                          ? "Day & Night texty"
                          : catKey === "SEMANTIC"
                          ? "Do's / Don'ts stavy"
                          : def.descriptionSk}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Specific Role Selector based on Category */}
          <div className="p-3.5 rounded-[3px] bg-[#0e161d] border border-[rgba(63,85,102,0.45)] space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#fafbfc]">
                Sémantická rola: <span className="text-[#c8d400] font-mono">{currentCatDef.labelSk}</span>
              </Label>
              <span className="text-[11px] text-[#96abbe]">
                Vyberte presné určenie farby
              </span>
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ColorRole)}
              className="w-full h-9 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs px-3 text-[#fafbfc] focus:outline-hidden focus:border-[#c8d400]"
            >
              {currentCatDef.allowedRoles.map((r) => {
                const rDef = COLOR_ROLE_DEFINITIONS[r];
                return (
                  <option key={r} value={r}>
                    {rDef ? rDef.labelSk : r}
                  </option>
                );
              })}
            </select>

            {/* Scale 10-100 Toggle */}
            <div className="pt-2.5 border-t border-[rgba(63,85,102,0.3)] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#fafbfc] flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#c8d400]" />
                  <span>Zobraziť systematickú stupnicu (10 až 100)</span>
                </div>
                <p className="text-[10px] text-[#96abbe] mt-0.5">
                  Vhodné pre brandové a digitálne farby. Pre farby pozadia a jednoduché ikony nechajte vypnuté.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasScale}
                  onChange={(e) => setHasScale(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#070b0f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all border border-[rgba(63,85,102,0.6)] peer-checked:bg-[#c8d400]"></div>
              </label>
            </div>
          </div>

          {/* 3. Color Picker & Live Swatch Preview */}
          <div className="p-4 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)] space-y-4">
            <div className="flex items-center gap-4">
              {/* Native picker synced */}
              <div
                className="relative h-14 w-14 shrink-0 rounded-[3px] overflow-hidden border-2 border-[rgba(63,85,102,0.6)] shadow-xs cursor-pointer"
                style={{ backgroundColor: hex }}
              >
                <input
                  type="color"
                  value={hex.length === 7 ? hex : "#0055FF"}
                  onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                  className="absolute -top-3 -left-3 w-20 h-20 cursor-pointer border-0 p-0 opacity-0"
                />
              </div>

              {/* HEX & RGB inputs */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <Label className="text-[11px] text-[#96abbe]">HEX kód</Label>
                  <Input
                    value={hex}
                    onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
                    placeholder="#0055FF"
                    required
                    className="mt-1 h-9 rounded-[3px] bg-[#17212a] border-[rgba(63,85,102,0.6)] font-mono text-xs font-bold text-[#fafbfc] focus:border-[#c8d400]"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#96abbe]">RGB hodnota</Label>
                  <Input
                    value={rgb}
                    onChange={(e) => setRgb(e.target.value)}
                    placeholder="0, 85, 255"
                    className="mt-1 h-9 rounded-[3px] bg-[#17212a] border-[rgba(63,85,102,0.6)] font-mono text-xs text-[#fafbfc] focus:border-[#c8d400]"
                  />
                </div>
              </div>
            </div>

            {/* Live Computed Systematic Scale 10 - 100 */}
            <div className="space-y-2 pt-2 border-t border-[rgba(63,85,102,0.35)]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#fafbfc] font-semibold flex items-center gap-1 font-mono">
                  <Sliders className="h-3 w-3 text-[#c8d400]" />
                  <span>Systematická škála svetlosti (10 až 100 • L 7 až L 96)</span>
                </span>
                <span className="text-[10px] text-[#96abbe] font-mono">10 stupňov HSLuv</span>
              </div>

              {/* 10 Swatches Row */}
              <div className="grid grid-cols-10 gap-1 select-none">
                {systematicScale.map((s) => (
                  <div key={s.id} className="flex flex-col items-center group">
                    <div className="text-[9px] font-mono text-[#96abbe] group-hover:text-[#fafbfc] truncate w-full text-center">
                      {s.step}
                    </div>
                    <div className="h-1.5 w-px bg-[rgba(150,171,190,0.4)] my-0.5" />
                    <div
                      className="w-full h-8 rounded-[2px] flex items-center justify-center font-mono text-[9px] font-bold border border-black/20 shadow-xs cursor-pointer transition-transform hover:scale-110"
                      style={{
                        backgroundColor: s.hex,
                        color: s.isTextWhite ? "#FFFFFF" : "#000000",
                      }}
                      title={`${s.label}: ${s.hex} (L ${s.lightness})`}
                    >
                      L{s.lightness}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live WCAG Contrast & Nearest RAL info strip */}
            <div className="pt-3 border-t border-[rgba(63,85,102,0.35)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* WCAG Preview (White & Black targets) */}
              <div className="p-2.5 rounded-[2px] bg-[#17212a] border border-[rgba(63,85,102,0.4)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#96abbe] uppercase font-mono tracking-wider">
                    WCAG 2.1 Kontrast
                  </span>
                  <span className="text-[10px] font-mono text-[#96abbe]">
                    Odporúčané:{" "}
                    <strong className="text-[#fafbfc]">
                      {contrast.preferredText === "white" ? "Biely text" : "Čierny text"}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* White background */}
                  <div
                    className="p-1.5 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.3)] flex items-center justify-between gap-1"
                    title={`WCAG kontrast voči Bielej (#FFFFFF): ${contrast.whiteRatio}:1 (${contrast.whiteScore})`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/50 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] text-[#96abbe] font-mono leading-tight">Biela</div>
                        <div className="font-mono text-xs font-bold text-[#fafbfc] leading-tight">
                          {contrast.whiteRatio}:1
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded-[2px] shrink-0 ${getWcagScoreBadgeClass(
                        contrast.whiteScore
                      )}`}
                    >
                      {contrast.whiteScore}
                    </span>
                  </div>

                  {/* Black background */}
                  <div
                    className="p-1.5 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.3)] flex items-center justify-between gap-1"
                    title={`WCAG kontrast voči Čiernej (#000000): ${contrast.blackRatio}:1 (${contrast.blackScore})`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/50 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] text-[#96abbe] font-mono leading-tight">Čierna</div>
                        <div className="font-mono text-xs font-bold text-[#fafbfc] leading-tight">
                          {contrast.blackRatio}:1
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded-[2px] shrink-0 ${getWcagScoreBadgeClass(
                        contrast.blackScore
                      )}`}
                    >
                      {contrast.blackScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* RAL Match */}
              <div className="p-2.5 rounded-[2px] bg-[#17212a] border border-[rgba(63,85,102,0.4)] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-[#96abbe] uppercase font-mono block">
                    Najbližšia RAL zhoda ({nearestRal?.similarity}%)
                  </span>
                  <span className="font-mono text-xs font-bold text-[#c8d400] truncate block">
                    {nearestRal?.code} ({nearestRal?.name})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyNearestRal}
                  className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] hover:bg-[#c8d400] hover:text-[#070b0f] text-[10px] font-semibold text-[#fafbfc] transition-colors shrink-0"
                >
                  Použiť
                </button>
              </div>
            </div>
          </div>

          {/* 4. Single Color Name */}
          <div>
            <Label className="text-xs font-semibold text-[#fafbfc]">Názov farby</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameSk(e.target.value);
              }}
              placeholder="napr. Primárna modrá, Základný text, Pozadie..."
              required
              className="mt-1.5 h-9.5 rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-sm text-[#fafbfc] focus:border-[#c8d400]"
            />
          </div>

          {/* 5. Print Standards Section (CMYK, Pantone, RAL) */}
          <div className="space-y-3 pt-3 border-t border-[rgba(63,85,102,0.35)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#fafbfc] uppercase tracking-wider font-mono">
                Tlačové normy (DTP)
              </span>
              <span className="text-[10px] text-[#96abbe] italic">
                *Hodnoty z grafického a tlačového manuálu
              </span>
            </div>

            {/* CMYK Inputs */}
            <div>
              <Label className="text-[11px] text-[#96abbe]">CMYK hodnoty (0 až 100 %)</Label>
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
                      className="pl-7 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc]"
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
                      className="pl-7 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc]"
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
                      className="pl-7 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc]"
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
                      className="pl-7 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RAL and Pantone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-[#96abbe]">RAL kód</Label>
                <Input
                  value={ral}
                  onChange={(e) => setRal(e.target.value.toUpperCase())}
                  placeholder="napr. RAL 5002"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] font-mono text-[#fafbfc]"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#96abbe]">Pantone Coated (C)</Label>
                <Input
                  value={pantoneC}
                  onChange={(e) => setPantoneC(e.target.value)}
                  placeholder="napr. 286 C"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] font-mono text-[#fafbfc]"
                />
              </div>
              <div>
                <Label className="text-[11px] text-[#96abbe]">Pantone Uncoated (U)</Label>
                <Input
                  value={pantoneU}
                  onChange={(e) => setPantoneU(e.target.value)}
                  placeholder="napr. 286 U"
                  className="mt-1 h-8 text-xs rounded-[3px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] font-mono text-[#fafbfc]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[rgba(63,85,102,0.35)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 text-xs rounded-[3px] border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc]"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors shadow-xs"
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
