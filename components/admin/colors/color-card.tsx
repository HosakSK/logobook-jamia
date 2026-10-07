"use client";

import { useState, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { deleteGlobalColorAction } from "@/actions/colors";
import { getWcagContrast } from "@/lib/utils/color-calc";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import {
  Copy,
  Check,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
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
  const [isDeleting, startDelete] = useTransition();

  const contrast = getWcagContrast(color.hex);
  const isTextWhite = contrast.preferredText === "white";

  const displayName =
    color.name[locale] || color.name.sk || color.name.en || color.name.cs || "Farba";

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
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

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] bg-[#17212a] text-[#fafbfc] overflow-hidden flex flex-col justify-between transition-all hover:border-[rgba(63,85,102,0.8)] shadow-xs group">
      {/* 1. Large Color Swatch Block */}
      <div
        className="h-36 w-full p-4 flex flex-col justify-between relative transition-transform duration-200"
        style={{ backgroundColor: color.hex }}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          {/* Role Badge */}
          <span
            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs ${
              isTextWhite
                ? "bg-black/40 text-white backdrop-blur-xs border border-white/20"
                : "bg-white/70 text-black backdrop-blur-xs border border-black/20"
            }`}
          >
            {color.role === "PRIMARY"
              ? "Primárna"
              : color.role === "SECONDARY"
              ? "Sekundárna"
              : color.role === "ACCENT"
              ? "Akcent"
              : color.role === "NEUTRAL"
              ? "Neutrálna"
              : "Vlastná"}
          </span>

          {/* WCAG Contrast Badge */}
          <span
            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold tracking-wider shadow-xs flex items-center gap-1 ${
              isTextWhite
                ? "bg-black/40 text-white backdrop-blur-xs border border-white/20"
                : "bg-white/70 text-black backdrop-blur-xs border border-black/20"
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
              {isTextWhite ? contrast.whiteScore : contrast.blackScore}
            </span>
          </span>
        </div>

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
        </div>
      </div>

      {/* 2. Color Details and Color Space Values */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-[#17212a] text-[#fafbfc]">
        <div>
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
              <span className="text-[#fafbfc] text-[11px] font-semibold truncate block" title={color.pantoneC || color.pantoneU || ""}>
                {color.pantoneC || color.pantoneU || color.pantoneTCX || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Toolbar */}
        <div className="pt-3 border-t border-[rgba(63,85,102,0.35)] flex items-center justify-between gap-1 text-xs">
          {/* Reordering arrows */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={index === 0}
              onClick={onMoveUp}
              className="h-7 w-7 p-0 rounded-[2px] text-[#96abbe] hover:text-[#fafbfc] hover:bg-white/[0.06] disabled:opacity-30 cursor-pointer"
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
              className="h-7 w-7 p-0 rounded-[2px] text-[#96abbe] hover:text-[#fafbfc] hover:bg-white/[0.06] disabled:opacity-30 cursor-pointer"
              title="Posunúť nižšie v palete"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Edit & Delete */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(color)}
              className="h-7 px-2.5 text-[11px] rounded-[2px] border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc] hover:border-[#c8d400] hover:text-[#c8d400] gap-1 cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              <span>Upraviť</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-7 w-7 p-0 rounded-[2px] text-[#96abbe] hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
              title="Zmazať farbu"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
