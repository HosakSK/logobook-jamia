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
  ExternalLink,
} from "lucide-react";

interface ColorCardProps {
  color: BrandColor;
  brandId: string;
  locale: string;
  index: number;
  total: number;
  dict: Dictionary;
  brandRadius?: string;
  onEdit: (color: BrandColor) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * Modern Split-Card Color Row:
 * - Left ~25-30% is a solid full-height color block (touching outer borders with brand radius).
 * - Right ~70-75% is an organized vertical column of metadata, baseline technical values & WCAG.
 * - 10-100 scale is permanently visible when enabled (hasScale), or cleanly omitted (e.g. for background).
 * - Strictly respects brand border radius from Brand Settings.
 */
export function ColorCard({
  color,
  brandId,
  locale,
  index,
  total,
  dict,
  brandRadius = "var(--brand-radius, 6px)",
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

  const category = resolveColorCategory(color.role, color.category);
  const roleDef = COLOR_ROLE_DEFINITIONS[color.role] || COLOR_ROLE_DEFINITIONS.CUSTOM;
  const catDef = COLOR_CATEGORY_DEFINITIONS[category] || COLOR_CATEGORY_DEFINITIONS.CUSTOM;

  // Resolve human-readable title
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

  // Whether scale should be shown (default true for CORE/DIGITAL, false for BG/SEMANTIC unless specified)
  const shouldShowScale =
    typeof color.hasScale === "boolean"
      ? color.hasScale
      : ["PRIMARY", "SECONDARY", "ACCENT", "DIGITAL"].includes(color.role);

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
    <div
      className="group border border-white/[0.08] bg-[#0e1620]/95 hover:bg-[#121c27] hover:border-white/[0.16] transition-all shadow-sm flex flex-col md:flex-row overflow-hidden"
      style={{ borderRadius: brandRadius }}
    >
      {/* 1. Generous Color Block filling entire left ~28-30% of card */}
      <div
        onClick={handleCopyHex}
        className="w-full md:w-56 lg:w-64 min-h-[140px] md:min-h-[160px] relative cursor-pointer group/swatch flex flex-col justify-between p-4 shrink-0 transition-opacity hover:opacity-95"
        style={{
          backgroundColor: color.hex,
          borderTopLeftRadius: brandRadius,
          borderBottomLeftRadius: brandRadius,
        }}
        title={`Kliknutím skopírujete HEX (${color.hex})`}
      >
        {/* Subtle order indicator on swatch */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xs"
            style={{
              backgroundColor: isTextWhite ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)",
              color: isTextWhite ? "#FFFFFF" : "#000000",
            }}
          >
            #{index + 1}
          </span>

          {copied && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
              ✓ Skopírované
            </span>
          )}
        </div>

        {/* Center/Bottom HEX Pill with Copy Icon */}
        <div className="self-start">
          <button
            type="button"
            onClick={handleCopyHex}
            className={`px-2.5 py-1 text-xs font-mono font-bold tracking-wider shadow-md backdrop-blur-md flex items-center gap-1.5 transition-transform group-hover/swatch:scale-105 ${
              isTextWhite
                ? "bg-black/60 text-white border border-white/20"
                : "bg-white/85 text-black border border-black/20"
            }`}
            style={{ borderRadius: brandRadius }}
          >
            <span>{color.hex}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 opacity-60" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Structured Right Column: Information, Values, WCAG & Permanent Scale */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0">
        
        {/* Top Header: Reorder Controls, Title, Role Tag & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Reorder Arrows */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={index === 0}
                onClick={onMoveUp}
                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Posunúť vyššie"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={index === total - 1}
                onClick={onMoveDown}
                className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Posunúť nižšie"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Title & Role */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-base sm:text-lg font-bold text-white tracking-tight truncate"
                  title={titleName}
                >
                  {titleName}
                </h3>
                {/* Role Pill */}
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-white/[0.06] text-slate-300 border border-white/10"
                  style={{ borderRadius: brandRadius }}
                >
                  {renderRoleIcon()}
                  <span>{roleDef ? roleDef.badgeLabelSk : color.role}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Kategória: <strong className="text-slate-300">{catDef ? catDef.labelSk : category}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onEdit(color)}
              className="h-8 px-3 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              style={{ borderRadius: brandRadius }}
              title="Upraviť farbu"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-400" />
              <span>Upraviť</span>
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              style={{ borderRadius: brandRadius }}
              title="Odstrániť farbu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Middle: Baseline-Aligned Technical Color Values */}
        <div className="flex items-center gap-5 sm:gap-8 flex-wrap py-0.5">
          {/* HEX */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              HEX
            </span>
            <span className="font-mono text-xs sm:text-[13px] font-bold text-white">
              {color.hex}
            </span>
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

          {/* CMYK */}
          {hasCmyk && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                CMYK
              </span>
              <span className="font-mono text-xs sm:text-[13px] text-slate-200">
                {color.cmykC ?? 0}, {color.cmykM ?? 0}, {color.cmykY ?? 0}, {color.cmykK ?? 0}
              </span>
            </div>
          )}

          {/* RAL */}
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

          {/* Pantone / PMS */}
          {(color.pantoneC || color.pantoneU || color.pantoneTCX) && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Pantone
              </span>
              <span className="font-mono text-xs sm:text-[13px] text-slate-200">
                {color.pantoneC || color.pantoneU || color.pantoneTCX}
              </span>
            </div>
          )}

          {/* WCAG Pill alongside values */}
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 bg-black/40 border border-white/10 backdrop-blur-sm text-xs font-mono ml-auto"
            style={{ borderRadius: brandRadius }}
          >
            {/* White Target */}
            <div
              className="flex items-center gap-1.5"
              title={`WCAG kontrast voči Bielej (#FFFFFF): ${contrast.whiteRatio}:1 — Hodnotenie: ${contrast.whiteScore}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs shrink-0" />
              <span className="text-[11px] font-bold text-white">{contrast.whiteRatio.toFixed(1)}:1</span>
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold tracking-tight ${getWcagScoreBadgeClass(
                  contrast.whiteScore
                )}`}
                style={{ borderRadius: brandRadius }}
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
                className={`px-1.5 py-0.5 text-[9px] font-bold tracking-tight ${getWcagScoreBadgeClass(
                  contrast.blackScore
                )}`}
                style={{ borderRadius: brandRadius }}
              >
                {contrast.blackScore === "AA Large" ? "AA+" : contrast.blackScore}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: 10-100 Systematic Scale (Shown permanently when enabled) */}
        {shouldShowScale && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Systematická škála (10 až 100):</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Perceptuálna svetlosť L 7 až L 96 (Jiří Chlebus / IBM Carbon)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShadesOpen(true)}
                className="text-xs text-[#c8d400] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Export kódov ↗</span>
              </button>
            </div>

            {/* 10 continuous interactive steps */}
            <div
              className="grid grid-cols-5 sm:grid-cols-10 gap-1 overflow-hidden p-1 bg-black/40 border border-white/5"
              style={{ borderRadius: brandRadius }}
            >
              {systematicScale.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleCopyStep(s.lightness, s.hex)}
                  className="h-11 transition-all hover:scale-105 hover:z-10 relative flex flex-col justify-between p-1 text-left group/step cursor-pointer border border-white/5 hover:border-white/30 shadow-xs"
                  style={{
                    backgroundColor: s.hex,
                    borderRadius: brandRadius,
                  }}
                  title={`${s.label}: ${s.hex} (L ${s.lightness}) - kliknutím skopírujete`}
                >
                  <span
                    className="text-[9px] font-mono font-bold leading-none px-1 py-0.5 shadow-xs self-start"
                    style={{
                      backgroundColor: s.isTextWhite ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.75)",
                      color: s.isTextWhite ? "#FFFFFF" : "#000000",
                      borderRadius: brandRadius,
                    }}
                  >
                    {s.step}
                  </span>
                  <span
                    className="text-[8px] font-mono font-semibold opacity-75 leading-none self-end"
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
      </div>

      {/* Modal for full code exports */}
      <ColorShadesModal
        color={color}
        isOpen={shadesOpen}
        onClose={() => setShadesOpen(false)}
      />
    </div>
  );
}
