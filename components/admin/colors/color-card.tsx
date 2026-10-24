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
  ExternalLink,
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

/**
 * Modern Startup-Grade Color Row (Linear / Vercel inspired).
 * - Clean visual hierarchy & baseline-aligned data
 * - Human-friendly color titles with subtle pills
 * - No cluttered nested boxes
 * - Sleek glass WCAG badges & interactive 10-100 ramp
 */
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
  const [showScale, setShowScale] = useState(false);
  const [shadesOpen, setShadesOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const contrast = getWcagContrast(color.hex);

  const category = resolveColorCategory(color.role, color.category);
  const roleDef = COLOR_ROLE_DEFINITIONS[color.role] || COLOR_ROLE_DEFINITIONS.CUSTOM;
  const catDef = COLOR_CATEGORY_DEFINITIONS[category] || COLOR_CATEGORY_DEFINITIONS.CUSTOM;

  // Resolve clean human title
  const rawName =
    color.name.sk ||
    color.name.en ||
    color.name.cs ||
    (typeof color.name === "string" ? color.name : "");

  const isGenericOrHexName =
    !rawName ||
    rawName.trim().startsWith("#") ||
    rawName.trim().toLowerCase() === color.hex.toLowerCase();

  const titleName = isGenericOrHexName
    ? roleDef
      ? roleDef.labelSk.split("(")[0].trim()
      : "Farba značky"
    : rawName;

  // 10-step systematic scale (10 to 100, L 7 to L 96)
  const systematicScale: SystematicStepItem[] = generateSystematicScale(color.hex);

  const handleCopyHex = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      setTimeout(() => setCopiedStepHex(null), 2200);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    if (!confirm(`Naozaj chcete vymazať farbu „${titleName}“ (${color.hex}) z palety?`)) {
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

  // Modern micro-icon for roles
  const renderRoleIcon = () => {
    switch (color.role) {
      case "BG_DAY":
        return <Sun className="h-3 w-3 text-amber-400" />;
      case "BG_NIGHT":
        return <Moon className="h-3 w-3 text-indigo-400" />;
      case "TEXT_DAY":
        return <Type className="h-3 w-3 text-amber-300" />;
      case "TEXT_NIGHT":
        return <Type className="h-3 w-3 text-purple-300" />;
      case "SUCCESS":
        return <ShieldCheck className="h-3 w-3 text-emerald-400" />;
      case "WARNING":
        return <AlertTriangle className="h-3 w-3 text-amber-400" />;
      case "DANGER":
        return <ShieldAlert className="h-3 w-3 text-rose-400" />;
      case "INFO":
        return <Info className="h-3 w-3 text-sky-400" />;
      case "DIGITAL":
        return <Monitor className="h-3 w-3 text-cyan-400" />;
      case "PRIMARY":
      case "SECONDARY":
      case "ACCENT":
        return <Palette className="h-3 w-3 text-[#c8d400]" />;
      default:
        return <Layers className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="group rounded-xl border border-white/[0.08] bg-[#0e1620]/95 hover:bg-[#121c27] hover:border-white/[0.16] transition-all shadow-sm overflow-hidden">
      {/* Main Single Row */}
      <div className="p-3 sm:px-4 sm:py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        
        {/* 1. Left Section: Reorder + Swatch + Name & Role */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Subtle Reorder Controls */}
          <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
              title="Posunúť vyššie"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono font-medium text-slate-500 select-none">
              #{index + 1}
            </span>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveDown}
              className="h-4 w-4 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
              title="Posunúť nižšie"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Swatch with Smooth Corner & Hover Feedback */}
          <div
            onClick={handleCopyHex}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-white/15 shadow-md shrink-0 cursor-pointer relative group/swatch flex items-center justify-center transition-all hover:scale-105 hover:border-white/30"
            style={{ backgroundColor: color.hex }}
            title={`Kliknutím skopírujete ${color.hex}`}
          >
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/swatch:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-white drop-shadow-sm" />
              )}
            </div>
          </div>

          {/* Name & Subtle Pill */}
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h3
                className="text-sm sm:text-base font-semibold text-white tracking-tight truncate"
                title={titleName}
              >
                {titleName}
              </h3>
              {copied && (
                <span className="text-[11px] font-mono text-emerald-400 font-semibold animate-pulse">
                  ✓ Skopírované
                </span>
              )}
            </div>

            {/* Role & Category Pill */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-slate-300 border border-white/10">
                {renderRoleIcon()}
                <span>{roleDef ? roleDef.badgeLabelSk : color.role}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                • {catDef ? catDef.labelSk : category}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Middle Section: Baseline-Aligned Technical Color Values */}
        <div className="flex items-center gap-5 sm:gap-7 flex-wrap shrink-0 py-1">
          {/* HEX */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              HEX
            </span>
            <button
              type="button"
              onClick={handleCopyHex}
              className="font-mono text-xs sm:text-[13px] font-bold text-white hover:text-[#c8d400] flex items-center gap-1 transition-colors group/hex"
              title="Kliknutím skopírujete HEX kód"
            >
              <span>{color.hex}</span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-slate-500 opacity-0 group-hover/hex:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* RGB */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              RGB
            </span>
            <span className="font-mono text-xs sm:text-[13px] text-slate-200">
              {color.rgb || "—"}
            </span>
          </div>

          {/* CMYK (if defined) */}
          {hasCmyk && (
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                CMYK
              </span>
              <span className="font-mono text-xs sm:text-[13px] text-slate-200">
                {color.cmykC ?? 0}, {color.cmykM ?? 0}, {color.cmykY ?? 0}, {color.cmykK ?? 0}
              </span>
            </div>
          )}

          {/* RAL (if defined) */}
          {color.ral && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                RAL
              </span>
              <span className="font-mono text-xs sm:text-[13px] font-bold text-[#c8d400]">
                {color.ral}
              </span>
            </div>
          )}

          {/* Pantone / PMS (if defined) */}
          {(color.pantoneC || color.pantoneU || color.pantoneTCX) && (
            <div className="flex flex-col hidden md:flex">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Pantone
              </span>
              <span className="font-mono text-xs sm:text-[13px] text-slate-200 truncate max-w-[110px]">
                {color.pantoneC || color.pantoneU || color.pantoneTCX}
              </span>
            </div>
          )}
        </div>

        {/* 3. Right Section: Glass WCAG Contrast Capsule + Clean Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-end xl:self-auto flex-wrap">
          {/* Glass WCAG Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 backdrop-blur-sm text-xs font-mono">
            {/* White Target */}
            <div
              className="flex items-center gap-1.5"
              title={`WCAG kontrast voči Bielej (#FFFFFF): ${contrast.whiteRatio}:1 — Hodnotenie: ${contrast.whiteScore}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs shrink-0" />
              <span className="text-[11px] font-bold text-white">{contrast.whiteRatio.toFixed(1)}:1</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight ${getWcagScoreBadgeClass(
                  contrast.whiteScore
                )}`}
              >
                {contrast.whiteScore === "AA Large" ? "AA+" : contrast.whiteScore}
              </span>
            </div>

            <span className="text-white/15">|</span>

            {/* Black Target */}
            <div
              className="flex items-center gap-1.5"
              title={`WCAG kontrast voči Čiernej (#000000): ${contrast.blackRatio}:1 — Hodnotenie: ${contrast.blackScore}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/40 shadow-xs shrink-0" />
              <span className="text-[11px] font-bold text-white">{contrast.blackRatio.toFixed(1)}:1</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight ${getWcagScoreBadgeClass(
                  contrast.blackScore
                )}`}
              >
                {contrast.blackScore === "AA Large" ? "AA+" : contrast.blackScore}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Toggle 10-100 Scale */}
            <button
              type="button"
              onClick={() => setShowScale(!showScale)}
              className={`h-8 px-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showScale
                  ? "bg-[#c8d400] text-[#0b1219] font-bold shadow-sm"
                  : "text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
              }`}
              title="Systematická stupnica odtieňov 10–100"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>10–100</span>
              {showScale ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-60" />
              )}
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => onEdit(color)}
              className="h-8 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Upraviť farbu"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-400" />
              <span>Upraviť</span>
            </button>

            {/* Delete Button */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Odstrániť farbu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Collapsible 10-100 Systematic Scale Panel */}
      {showScale && (
        <div className="border-t border-white/[0.06] bg-black/20 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Systematická škála (10 až 100):</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Perceptuálna svetlosť L 7 až L 96 (Jiří Chlebus / IBM Carbon)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShadesOpen(true)}
              className="text-xs text-[#c8d400] hover:underline font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Exporty pre Tailwind / CSS kód</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          {/* 10 continuous interactive steps */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 rounded-xl overflow-hidden p-1 bg-black/40 border border-white/5">
            {systematicScale.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleCopyStep(s.lightness, s.hex)}
                className="h-14 rounded-lg transition-all hover:scale-105 hover:z-10 relative flex flex-col justify-between p-1.5 text-left group/step cursor-pointer border border-white/5 hover:border-white/30 shadow-xs"
                style={{ backgroundColor: s.hex }}
                title={`${s.label}: ${s.hex} (L ${s.lightness}) - kliknutím skopírujete`}
              >
                <span
                  className="text-[9px] font-mono font-bold leading-none px-1 py-0.5 rounded shadow-xs"
                  style={{
                    backgroundColor: s.isTextWhite ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.75)",
                    color: s.isTextWhite ? "#FFFFFF" : "#000000",
                  }}
                >
                  {s.step}
                </span>
                <span
                  className="text-[8px] font-mono font-semibold opacity-75 leading-none"
                  style={{ color: s.isTextWhite ? "#FFFFFF" : "#000000" }}
                >
                  L{s.lightness}
                </span>
              </button>
            ))}
          </div>

          {copiedStepHex && (
            <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Skopírovaný odtieň: {copiedStepHex}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Tonal Shades Modal for complete code export */}
      <ColorShadesModal
        color={color}
        isOpen={shadesOpen}
        onClose={() => setShadesOpen(false)}
      />
    </div>
  );
}
