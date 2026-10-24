"use client";

import { useState, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { deleteGlobalColorAction } from "@/actions/colors";
import {
  getWcagContrast,
  getWcagScoreBadgeClass,
  generateSystematicScale,
  SystematicStepItem,
} from "@/lib/utils/color-calc";
import {
  COLOR_ROLE_DEFINITIONS,
  COLOR_CATEGORY_DEFINITIONS,
  resolveColorCategory,
} from "@/lib/validations/color";
import { ColorShadesModal } from "@/components/admin/colors/color-shades-modal";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import {
  Copy,
  Check,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Palette,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Type,
  Layers,
  Sliders,
} from "lucide-react";

interface ColorCardProps {
  color: BrandColor;
  brandId: string;
  locale: string;
  index: number;
  total: number;
  dict: Dictionary;
  onEdit: (color: BrandColor) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ColorCard({
  color,
  brandId,
  locale,
  index,
  total,
  dict,
  onEdit,
  onMoveUp,
  onMoveDown,
}: ColorCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedStepHex, setCopiedStepHex] = useState<string | null>(null);
  const [shadesOpen, setShadesOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const contrast = getWcagContrast(color.hex);
  const isTextWhite = contrast.preferredText === "white";

  const displayName =
    color.name[locale] || color.name.sk || color.name.en || color.name.cs || "Farba";

  const category = resolveColorCategory(color.role, color.category);
  const roleDef = COLOR_ROLE_DEFINITIONS[color.role] || COLOR_ROLE_DEFINITIONS.CUSTOM;
  const catDef = COLOR_CATEGORY_DEFINITIONS[category] || COLOR_CATEGORY_DEFINITIONS.CUSTOM;

  // 10-step systematic perceptual scale (10 to 100, L 7 to L 96)
  const systematicScale: SystematicStepItem[] = generateSystematicScale(color.hex);

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleCopyStep = async (step: number, stepHex: string) => {
    try {
      await navigator.clipboard.writeText(stepHex);
      setCopiedStepHex(`${step}: ${stepHex}`);
      setTimeout(() => setCopiedStepHex(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    if (!confirm(`Naozaj chcete vymazať farbu „${displayName}“ (${color.hex}) z palety?`)) {
      return;
    }
    startDelete(async () => {
      await deleteGlobalColorAction(color.id, brandId);
    });
  };

  const hasCmyk =
    color.cmykC !== null ||
    color.cmykM !== null ||
    color.cmykY !== null ||
    color.cmykK !== null;

  // Icon selector based on role/category
  const renderRoleIcon = () => {
    switch (color.role) {
      case "BG_DAY":
      case "TEXT_DAY":
        return <Sun className="h-3 w-3 text-amber-300" />;
      case "BG_NIGHT":
      case "TEXT_NIGHT":
        return <Moon className="h-3 w-3 text-indigo-300" />;
      case "SUCCESS":
        return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
      case "WARNING":
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      case "DANGER":
        return <ShieldAlert className="h-3 w-3 text-rose-400" />;
      case "INFO":
        return <Info className="h-3 w-3 text-sky-400" />;
      case "DIGITAL":
        return <Monitor className="h-3 w-3 text-cyan-300" />;
      case "PRIMARY":
      case "SECONDARY":
      case "ACCENT":
        return <Palette className="h-3 w-3 text-[#c8d400]" />;
      default:
        return <Layers className="h-3 w-3 text-[#96abbe]" />;
    }
  };

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] bg-[#17212a] text-[#fafbfc] overflow-hidden flex flex-col justify-between transition-all hover:border-[rgba(63,85,102,0.8)] shadow-xs group">
      {/* 1. Large Color Swatch Block with contextual role preview */}
      <div
        className="min-h-[168px] h-auto w-full p-3.5 flex flex-col justify-between gap-3 relative transition-transform duration-200"
        style={{ backgroundColor: color.hex }}
      >
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-1.5">
          {/* Detailed Role Badge with Category Context */}
          <span className="px-2 py-1 rounded-[3px] text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 bg-[#070b0f]/92 text-[#fafbfc] backdrop-blur-sm border border-white/20 shrink-0">
            {renderRoleIcon()}
            <span>{locale === "en" ? roleDef.badgeLabelEn : roleDef.badgeLabelSk}</span>
          </span>

          {/* WCAG Contrast Indicators (White & Black targets) */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* White Target (#FFFFFF) */}
            <div
              className="flex items-center gap-1.5 bg-[#070b0f]/92 text-[#fafbfc] px-1.5 py-0.5 rounded-[3px] border border-white/20 text-[10px] font-mono shadow-md backdrop-blur-sm"
              title={`WCAG kontrast voči Bielej (#FFFFFF): ${contrast.whiteRatio}:1 — Hodnotenie: ${contrast.whiteScore}`}
            >
              <span className="w-2 h-2 rounded-full bg-white border border-black/50 shrink-0 shadow-xs" />
              <span className="text-[9px] text-[#96abbe] font-semibold">{locale === "en" ? "White" : "Biela"}</span>
              <span className="font-extrabold text-[#fafbfc]">{contrast.whiteRatio}:1</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-black tracking-tight ${getWcagScoreBadgeClass(
                  contrast.whiteScore
                )}`}
              >
                {contrast.whiteScore}
              </span>
            </div>

            {/* Black Target (#000000) */}
            <div
              className="flex items-center gap-1.5 bg-[#070b0f]/92 text-[#fafbfc] px-1.5 py-0.5 rounded-[3px] border border-white/20 text-[10px] font-mono shadow-md backdrop-blur-sm"
              title={`WCAG kontrast voči Čiernej (#000000): ${contrast.blackRatio}:1 — Hodnotenie: ${contrast.blackScore}`}
            >
              <span className="w-2 h-2 rounded-full bg-black border border-white/60 shrink-0 shadow-xs" />
              <span className="text-[9px] text-[#96abbe] font-semibold">{locale === "en" ? "Black" : "Čierna"}</span>
              <span className="font-extrabold text-[#fafbfc]">{contrast.blackRatio}:1</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-black tracking-tight ${getWcagScoreBadgeClass(
                  contrast.blackScore
                )}`}
              >
                {contrast.blackScore}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Contextual Visual Preview */}
        {category === "TYPOGRAPHY" ? (
          <div
            className={`px-2.5 py-1.5 rounded-[3px] text-xs font-sans font-bold flex items-center justify-between shadow-xs ${
              color.role === "TEXT_DAY"
                ? "bg-[#fafbfc] text-[#0e161d]"
                : "bg-[#070b0f] text-[#fafbfc] border border-white/10"
            }`}
          >
            <span className="text-[11px] font-mono opacity-60">
              {color.role === "TEXT_DAY" ? "☀️ Day Canvas" : "🌙 Dark Canvas"}
            </span>
            <span style={{ color: color.hex }} className="font-semibold text-sm">
              Aa Bb Cc 123
            </span>
          </div>
        ) : category === "BACKGROUND" ? (
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-[2px] bg-[#070b0f]/90 text-white border border-white/20 shadow-xs">
              Surface Canvas
            </span>
            <span className="px-2 py-0.5 rounded-[2px] bg-[#070b0f]/90 text-white border border-white/20 shadow-xs">
              {color.role === "BG_DAY" ? "☀️ Svetlý mód" : "🌙 Tmavý mód"}
            </span>
          </div>
        ) : category === "SEMANTIC" ? (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-semibold flex items-center gap-1 bg-[#070b0f]/90 text-white border border-white/20 shadow-xs">
              {renderRoleIcon()}
              <span>
                {color.role === "SUCCESS"
                  ? "Do's (Odporúčané)"
                  : color.role === "DANGER"
                  ? "Don'ts (Zákaz)"
                  : color.role === "WARNING"
                  ? "Varovanie"
                  : "Info banner"}
              </span>
            </span>
          </div>
        ) : null}

        {/* HEX with 1-click Copy */}
        <div className="flex items-end justify-between pt-1">
          <button
            type="button"
            onClick={handleCopyHex}
            className={`flex items-center gap-1.5 font-mono text-xl font-black tracking-wider transition-opacity hover:opacity-80 ${
              isTextWhite ? "text-white drop-shadow-md" : "text-black drop-shadow-xs"
            }`}
            title="Kliknutím skopírujete HEX kód"
          >
            <span>{color.hex}</span>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>

          {/* Quick feedback if a step was copied from strip */}
          {copiedStepHex && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] bg-emerald-500/90 text-white shadow-xs">
              ✓ {copiedStepHex}
            </span>
          )}
        </div>
      </div>

      {/* 2. Mini Systematic Scale Strip (L 0 - L 100) */}
      <div className="border-t border-b border-[rgba(63,85,102,0.5)] bg-[#070b0f] flex h-4.5 w-full">
        {systematicScale.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleCopyStep(s.lightness, s.hex)}
            className="flex-1 h-full transition-all hover:scale-y-125 hover:z-10 focus:outline-hidden"
            style={{ backgroundColor: s.hex }}
            title={`${s.label}: ${s.hex} (L ${s.lightness}) - kliknutím skopírujete`}
          />
        ))}
      </div>

      {/* 3. Color Details and Category Descriptor */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-[#17212a] text-[#fafbfc]">
        <div>
          {/* Category Pill Tag */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#96abbe] flex items-center gap-1">
              {renderRoleIcon()}
              <span>{locale === "en" ? catDef.labelEn : catDef.labelSk}</span>
            </span>
            <span className="text-[10px] font-mono text-[#96abbe]/60">
              #{index + 1}
            </span>
          </div>

          <h3 className="font-bold text-sm text-[#fafbfc] font-mono" title={displayName}>
            {displayName}
          </h3>

          {/* Values Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
            {/* RGB */}
            <div className="p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)]">
              <span className="text-[10px] uppercase text-[#96abbe] block">RGB</span>
              <span className="text-[#fafbfc] text-[11px] font-semibold">
                {color.rgb || "—"}
              </span>
            </div>

            {/* CMYK */}
            <div className="p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)]">
              <span className="text-[10px] uppercase text-[#96abbe] block">CMYK</span>
              <span className="text-[#fafbfc] text-[11px] font-semibold">
                {hasCmyk
                  ? `${color.cmykC ?? 0}, ${color.cmykM ?? 0}, ${color.cmykY ?? 0}, ${color.cmykK ?? 0}`
                  : "—"}
              </span>
            </div>

            {/* RAL */}
            <div className="p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)]">
              <span className="text-[10px] uppercase text-[#96abbe] block">RAL</span>
              <span className="text-[#fafbfc] text-[11px] font-semibold">
                {color.ral || "—"}
              </span>
            </div>

            {/* Pantone */}
            <div className="p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)]">
              <span className="text-[10px] uppercase text-[#96abbe] block">Pantone</span>
              <span
                className="text-[#fafbfc] text-[11px] font-semibold truncate block"
                title={color.pantoneC || color.pantoneU || color.pantoneTCX || ""}
              >
                {color.pantoneC || color.pantoneU || color.pantoneTCX || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Action Toolbar */}
        <div className="pt-3 border-t border-[rgba(63,85,102,0.35)] flex items-center justify-between gap-1 text-xs">
          {/* Reordering arrows */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={index === 0}
              onClick={onMoveUp}
              className="h-7 w-7 p-0 text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] disabled:opacity-30 rounded-[2px]"
              title="Posunúť vyššie v palete"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={index === total - 1}
              onClick={onMoveDown}
              className="h-7 w-7 p-0 text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] disabled:opacity-30 rounded-[2px]"
              title="Posunúť nižšie v palete"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Action buttons: Shades 50-900, Edit, Delete */}
          <div className="flex items-center gap-1">
            {/* Systematic Shades 10-100 Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShadesOpen(true)}
              className="h-7 px-2 text-xs font-mono rounded-[2px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#c8d400] hover:bg-[#c8d400] hover:text-[#070b0f] gap-1 transition-colors"
              title="Zobraziť systematickú stupnicu 10 odtieňov (10 až 100 • L 7 až L 96)"
            >
              <Sliders className="h-3 w-3" />
              <span>10–100</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(color)}
              className="h-7 px-2.5 text-xs font-mono rounded-[2px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc] hover:bg-[#1f2c36] gap-1 transition-colors"
            >
              <Pencil className="h-3 w-3 text-[#c8d400]" />
              <span>Upraviť</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-[2px]"
              title="Odstrániť farbu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Tonal Shades Modal (50 to 900) */}
      <ColorShadesModal
        color={color}
        isOpen={shadesOpen}
        onClose={() => setShadesOpen(false)}
      />
    </div>
  );
}
