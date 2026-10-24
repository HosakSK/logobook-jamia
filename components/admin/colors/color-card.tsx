"use client";

import { useState, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { deleteGlobalColorAction } from "@/actions/colors";
import { getWcagContrast, generateTonalSteps, TonalStepItem } from "@/lib/utils/color-calc";
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

  // 10-step tonal scale
  const tonalSteps: TonalStepItem[] = generateTonalSteps(color.hex);

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
        className="h-40 w-full p-4 flex flex-col justify-between relative transition-transform duration-200"
        style={{ backgroundColor: color.hex }}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          {/* Detailed Role Badge with Category Context */}
          <span
            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs flex items-center gap-1.5 ${
              isTextWhite
                ? "bg-black/60 text-white backdrop-blur-md border border-white/20"
                : "bg-white/85 text-black backdrop-blur-md border border-black/20"
            }`}
          >
            {renderRoleIcon()}
            <span>{locale === "en" ? roleDef.badgeLabelEn : roleDef.badgeLabelSk}</span>
          </span>

          {/* WCAG Contrast Ratio */}
          <span
            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold tracking-wider shadow-xs flex items-center gap-1 ${
              isTextWhite
                ? "bg-black/60 text-white backdrop-blur-md border border-white/20"
                : "bg-white/85 text-black backdrop-blur-md border border-black/20"
            }`}
            title={`Kontrast voči bielemu: ${contrast.whiteRatio}:1 (${contrast.whiteScore}), voči čiernemu: ${contrast.blackRatio}:1 (${contrast.blackScore})`}
          >
            <span>WCAG</span>
            <span
              className={
                (isTextWhite ? contrast.whiteScore : contrast.blackScore) === "Fail"
                  ? "text-red-400 font-extrabold"
                  : "text-emerald-400 font-extrabold"
              }
            >
              {isTextWhite ? contrast.whiteRatio : contrast.blackRatio}:1
            </span>
          </span>
        </div>

        {/* Center: Contextual Visual Preview */}
        {category === "TYPOGRAPHY" ? (
          <div
            className={`px-2.5 py-1.5 rounded-[2px] text-xs font-sans font-bold flex items-center justify-between ${
              color.role === "TEXT_DAY"
                ? "bg-[#fafbfc] text-[#0e161d] shadow-sm"
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
          <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-80">
            <span
              className={`px-1.5 py-0.5 rounded-[2px] border ${
                isTextWhite ? "border-white/30 text-white" : "border-black/30 text-black"
              }`}
            >
              Surface Canvas
            </span>
            <span className={isTextWhite ? "text-white/80" : "text-black/80"}>
              {color.role === "BG_DAY" ? "☀️ Svetlý mód" : "🌙 Tmavý mód"}
            </span>
          </div>
        ) : category === "SEMANTIC" ? (
          <div className="flex items-center gap-1">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-semibold flex items-center gap-1 ${
                isTextWhite ? "bg-black/50 text-white" : "bg-white/70 text-black"
              }`}
            >
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
        <div className="flex items-end justify-between">
          <button
            type="button"
            onClick={handleCopyHex}
            className={`flex items-center gap-1.5 font-mono text-xl font-extrabold tracking-wider transition-opacity hover:opacity-80 ${
              isTextWhite ? "text-white" : "text-black"
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

      {/* 2. Mini Tonal Scale Strip (50 - 900) */}
      <div className="border-t border-b border-[rgba(63,85,102,0.5)] bg-[#070b0f] flex h-4.5 w-full">
        {tonalSteps.map((step) => (
          <button
            key={step.step}
            type="button"
            onClick={() => handleCopyStep(step.step, step.hex)}
            className="flex-1 h-full transition-all hover:scale-y-125 hover:z-10 focus:outline-hidden"
            style={{ backgroundColor: step.hex }}
            title={`Odtieň ${step.step}: ${step.hex} (kliknutím skopírujete)`}
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
            {/* Odtiene 50-900 Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShadesOpen(true)}
              className="h-7 px-2 text-xs font-mono rounded-[2px] bg-[#070b0f] border-[rgba(63,85,102,0.6)] text-[#c8d400] hover:bg-[#c8d400] hover:text-[#070b0f] gap-1 transition-colors"
              title="Zobraziť kompletnú stupnicu 10 odtieňov (50 až 900)"
            >
              <Sliders className="h-3 w-3" />
              <span>50–900</span>
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
