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

/**
 * Redesigned Horizontal Color Row:
 * 1 farba = 1 čistý, priestranný riadok v admine.
 * - Jediný názov (bez prekladov)
 * - Vypínateľná/zbaliteľná systematická stupnica 10–100
 * - Žiadne rušivé inline plátna pre day/night (rola je čistá meta informácia)
 * - Štandardné prehľadné WCAG kontrasty voči bielej aj čiernej
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

  // Single name logic (no translations)
  const displayName =
    color.name.sk ||
    color.name.en ||
    color.name.cs ||
    (typeof color.name === "string" ? color.name : "Farba");

  const category = resolveColorCategory(color.role, color.category);
  const roleDef = COLOR_ROLE_DEFINITIONS[color.role] || COLOR_ROLE_DEFINITIONS.CUSTOM;
  const catDef = COLOR_CATEGORY_DEFINITIONS[category] || COLOR_CATEGORY_DEFINITIONS.CUSTOM;

  // 10-step systematic perceptual scale (10 to 100, L 7 to L 96)
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
        return <Sun className="h-3 w-3 text-amber-300" />;
      case "BG_NIGHT":
        return <Moon className="h-3 w-3 text-indigo-300" />;
      case "TEXT_DAY":
        return <Type className="h-3 w-3 text-amber-200" />;
      case "TEXT_NIGHT":
        return <Type className="h-3 w-3 text-purple-300" />;
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
    <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] bg-[#17212a] text-[#fafbfc] transition-all hover:border-[rgba(63,85,102,0.8)] shadow-xs overflow-hidden">
      {/* 1. Main Horizontal Row */}
      <div className="p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Section: Reorder + Swatch + Name & Metadata */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Reorder Arrows + Order Index */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              className="h-5 w-5 flex items-center justify-center text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-20 transition-colors"
              title="Posunúť vyššie"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#96abbe]/60 select-none">
              #{index + 1}
            </span>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveDown}
              className="h-5 w-5 flex items-center justify-center text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-20 transition-colors"
              title="Posunúť nižšie"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Swatch (Click to Copy HEX) */}
          <div
            onClick={handleCopyHex}
            className="h-12 w-12 sm:h-13 sm:w-13 rounded-[3px] border border-white/20 shadow-xs shrink-0 cursor-pointer relative group flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: color.hex }}
            title={`Kliknutím skopírujete HEX (${color.hex})`}
          >
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2px]">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-white" />
              )}
            </div>
          </div>

          {/* Name & Metadata (Role / Category) */}
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h3
                className="font-mono text-sm sm:text-base font-bold text-[#fafbfc] truncate"
                title={displayName}
              >
                {displayName}
              </h3>
              {copied && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ Skopírované
                </span>
              )}
            </div>

            {/* Metadata tag: Category & Role */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#070b0f] text-[10px] font-mono text-[#96abbe] border border-[rgba(63,85,102,0.4)] flex items-center gap-1">
                {renderRoleIcon()}
                <span>{roleDef ? roleDef.badgeLabelSk : color.role}</span>
              </span>
              <span className="text-[10px] font-mono text-[#96abbe]/60">
                • {catDef ? catDef.labelSk : category}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Color Codes (HEX, RGB, CMYK, RAL, Pantone) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-mono shrink-0">
          {/* HEX with Copy */}
          <button
            type="button"
            onClick={handleCopyHex}
            className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)] hover:border-[#c8d400] text-[#fafbfc] flex items-center gap-1.5 transition-colors group/hex"
            title="Kliknutím skopírujete HEX kód"
          >
            <span className="text-[10px] text-[#96abbe] group-hover/hex:text-[#c8d400]">HEX</span>
            <span className="font-bold">{color.hex}</span>
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 opacity-40 group-hover/hex:opacity-100" />
            )}
          </button>

          {/* RGB */}
          <div className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.4)] flex items-center gap-1.5">
            <span className="text-[10px] text-[#96abbe]">RGB</span>
            <span className="text-[#fafbfc] font-medium">{color.rgb || "—"}</span>
          </div>

          {/* CMYK */}
          {hasCmyk && (
            <div className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.4)] flex items-center gap-1.5">
              <span className="text-[10px] text-[#96abbe]">CMYK</span>
              <span className="text-[#fafbfc] font-medium">
                {color.cmykC ?? 0}, {color.cmykM ?? 0}, {color.cmykY ?? 0}, {color.cmykK ?? 0}
              </span>
            </div>
          )}

          {/* RAL */}
          {color.ral && (
            <div className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.4)] flex items-center gap-1.5">
              <span className="text-[10px] text-[#96abbe]">RAL</span>
              <span className="text-[#c8d400] font-bold">{color.ral}</span>
            </div>
          )}

          {/* Pantone */}
          {(color.pantoneC || color.pantoneU || color.pantoneTCX) && (
            <div className="px-2 py-1 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.4)] flex items-center gap-1.5">
              <span className="text-[10px] text-[#96abbe]">PMS</span>
              <span className="text-[#fafbfc] font-medium truncate max-w-[120px]">
                {color.pantoneC || color.pantoneU || color.pantoneTCX}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: WCAG Contrast & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end lg:self-auto flex-wrap">
          {/* Dual WCAG Badges (White and Black targets) */}
          <div className="flex items-center gap-2 bg-[#070b0f] px-2.5 py-1.5 rounded-[3px] border border-[rgba(63,85,102,0.4)] text-[10px] font-mono">
            {/* White Target */}
            <div
              className="flex items-center gap-1"
              title={`WCAG kontrast voči Bielej (#FFFFFF): ${contrast.whiteRatio}:1 — Hodnotenie: ${contrast.whiteScore}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/50 shrink-0 shadow-xs" />
              <span className="text-[9px] text-[#96abbe]">Biela</span>
              <span className="font-extrabold text-[#fafbfc]">{contrast.whiteRatio.toFixed(1)}:1</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-black tracking-tight ${getWcagScoreBadgeClass(
                  contrast.whiteScore
                )}`}
              >
                {contrast.whiteScore}
              </span>
            </div>

            <span className="text-white/20">|</span>

            {/* Black Target */}
            <div
              className="flex items-center gap-1"
              title={`WCAG kontrast voči Čiernej (#000000): ${contrast.blackRatio}:1 — Hodnotenie: ${contrast.blackScore}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/60 shrink-0 shadow-xs" />
              <span className="text-[9px] text-[#96abbe]">Čierna</span>
              <span className="font-extrabold text-[#fafbfc]">{contrast.blackRatio.toFixed(1)}:1</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-black tracking-tight ${getWcagScoreBadgeClass(
                  contrast.blackScore
                )}`}
              >
                {contrast.blackScore}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Toggle 10-100 Scale Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowScale(!showScale)}
              className={`h-8 px-2 text-xs font-mono rounded-[2px] border-[rgba(63,85,102,0.6)] gap-1 transition-colors ${
                showScale
                  ? "bg-[#c8d400] text-[#070b0f] font-bold border-[#c8d400]"
                  : "bg-[#070b0f] text-[#c8d400] hover:bg-[#c8d400] hover:text-[#070b0f]"
              }`}
              title="Zobraziť / skryť systematickú stupnicu 10 odtieňov"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">10–100</span>
              {showScale ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {/* Edit Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(color)}
              className="h-8 px-2.5 text-xs font-mono rounded-[2px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#fafbfc] hover:bg-[#1f2c36] gap-1 transition-colors"
              title="Upraviť farbu"
            >
              <Pencil className="h-3.5 w-3.5 text-[#c8d400]" />
              <span className="hidden sm:inline">Upraviť</span>
            </Button>

            {/* Delete Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-[2px]"
              title="Odstrániť farbu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Collapsible 10-100 Systematic Scale Panel */}
      {showScale && (
        <div className="border-t border-[rgba(63,85,102,0.35)] bg-[#0c1319] p-3 sm:p-4 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#fafbfc] font-bold">Systematická stupnica odtieňov (10 až 100):</span>
              <span className="text-[11px] text-[#96abbe]">Perceptuálna svetlosť L 7 až L 96</span>
            </div>
            <button
              type="button"
              onClick={() => setShadesOpen(true)}
              className="text-xs text-[#c8d400] hover:underline flex items-center gap-1 font-semibold self-start sm:self-auto"
            >
              <span>Exporty pre Tailwind / CSS kód ↗</span>
            </button>
          </div>

          {/* 10 Swatches in a row */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {systematicScale.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleCopyStep(s.lightness, s.hex)}
                className="p-1.5 rounded-[2px] border border-white/10 hover:border-[#c8d400] transition-all flex flex-col items-center gap-1 group text-center cursor-pointer"
                style={{ backgroundColor: s.hex }}
                title={`${s.label}: ${s.hex} (L ${s.lightness}) - kliknutím skopírujete`}
              >
                <span
                  className="text-[9px] font-mono font-bold px-1 py-0.2 rounded-[2px]"
                  style={{
                    backgroundColor: s.isTextWhite ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)",
                    color: s.isTextWhite ? "#FFFFFF" : "#000000",
                  }}
                >
                  {s.step}
                </span>
                <span
                  className="text-[8px] font-mono opacity-80"
                  style={{ color: s.isTextWhite ? "#FFFFFF" : "#000000" }}
                >
                  L{s.lightness}
                </span>
              </button>
            ))}
          </div>

          {copiedStepHex && (
            <div className="text-[10px] font-mono text-emerald-400 font-bold">
              ✓ Skopírovaný odtieň: {copiedStepHex}
            </div>
          )}
        </div>
      )}

      {/* 3. Tonal Shades Modal for full code export */}
      <ColorShadesModal
        color={color}
        isOpen={shadesOpen}
        onClose={() => setShadesOpen(false)}
      />
    </div>
  );
}
