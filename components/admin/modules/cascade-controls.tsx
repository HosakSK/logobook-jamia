"use client";

import React, { useState } from "react";
import {
  Link as LinkIcon,
  Unlink,
  RotateCcw,
  Palette,
  Square,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CascadeRadiusMode } from "@/lib/types/module";
import { computeBrandRadiusValue } from "@/lib/utils/cascade";
import { WcagContrastBadge } from "./wcag-contrast-badge";

/**
 * Reusable wrapper providing the Level 1/2 vs Level 3 toggle UX.
 */
export function CascadeControlWrapper({
  label,
  description,
  isOverridden,
  onToggleOverride,
  inheritedLabel = "Zdedené z globálnych nastavení",
  overrideLabel = "Lokálny Override",
  children,
  inheritedPreview,
}: {
  label: string;
  description?: string;
  isOverridden: boolean;
  onToggleOverride: (override: boolean) => void;
  inheritedLabel?: string;
  overrideLabel?: string;
  children: React.ReactNode;
  inheritedPreview: React.ReactNode;
}) {
  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-4 bg-[#17212a] text-[#fafbfc] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {label}
          </Label>
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>

        {/* State Badge & Detach/Re-link Toggle */}
        <div className="flex items-center gap-2">
          {isOverridden ? (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Unlink className="h-2.5 w-2.5" />
                {overrideLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleOverride(false)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 rounded-[2px]"
                title="Obnoviť dedičnosť z globálnych nastavení"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Obnoviť</span>
              </Button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <LinkIcon className="h-2.5 w-2.5" />
                {inheritedLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onToggleOverride(true)}
                className="h-6 px-2 text-[11px] gap-1 rounded-[2px] border-border/60 hover:border-primary/50 text-foreground"
                title="Odpojiť od globálneho štýlu a nastaviť vlastnú hodnotu"
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span>Odpojiť</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Body content based on override state */}
      <div>{isOverridden ? children : inheritedPreview}</div>
    </div>
  );
}

/**
 * Cascade Color Picker with Level 1/2 inheritance and Level 3 override.
 */
export function CascadeColorPicker({
  label,
  description,
  value,
  inheritedColor = "#c8d400",
  inheritedRoleName = "Brand Primary",
  palette = [],
  compareContrastWithHex,
  onChange,
}: {
  label: string;
  description?: string;
  value?: string;
  inheritedColor?: string;
  inheritedRoleName?: string;
  palette?: Array<{ hex: string; role: string; name: string }>;
  compareContrastWithHex?: string;
  onChange: (color: string | undefined) => void;
}) {
  const isOverridden = Boolean(value && value.trim().length > 0);
  const [localColor, setLocalColor] = useState(value || inheritedColor);

  const handleToggle = (override: boolean) => {
    if (override) {
      const initial = localColor || inheritedColor;
      setLocalColor(initial);
      onChange(initial);
    } else {
      onChange(undefined);
    }
  };

  const handleColorChange = (hex: string) => {
    setLocalColor(hex);
    onChange(hex);
  };

  return (
    <CascadeControlWrapper
      label={label}
      description={description}
      isOverridden={isOverridden}
      onToggleOverride={handleToggle}
      inheritedLabel="Zdedená farba značky"
      inheritedPreview={
        <div className="flex items-center gap-3 p-2.5 rounded-[2px] bg-neutral-900/60 border border-border/40">
          <div
            className="h-7 w-7 rounded-[2px] border border-white/20 shadow-2xs shrink-0"
            style={{ backgroundColor: inheritedColor }}
          />
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>{inheritedRoleName}</span>
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                ({inheritedColor})
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Modul automaticky preberá hodnotu z globálnej palety značky.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-3 pt-1">
        {/* Color Input Row */}
        <div className="flex items-center gap-2">
          {/* Visual Swatch with native color picker hidden behind */}
          <label className="relative cursor-pointer shrink-0">
            <div
              className="h-8 w-8 rounded-[2px] border border-white/20 shadow-2xs hover:scale-105 transition-transform"
              style={{ backgroundColor: localColor }}
            />
            <input
              type="color"
              value={localColor.startsWith("#") ? localColor : "#c8d400"}
              onChange={(e) => handleColorChange(e.target.value.toUpperCase())}
              className="sr-only"
            />
          </label>

          {/* Hex text input */}
          <div className="flex-1">
            <Input
              type="text"
              value={localColor}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#FFFFFF"
              className="font-mono text-xs uppercase h-8 rounded-[2px]"
            />
          </div>
        </div>

        {/* Quick Palette Picker (if brand colors are available) */}
        {palette.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
              Rýchly výber z palety značky:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {palette.map((item, idx) => {
                const isSelected = item.hex.toUpperCase() === localColor.toUpperCase();
                return (
                  <button
                    key={`${item.hex}-${idx}`}
                    type="button"
                    onClick={() => handleColorChange(item.hex)}
                    className={`group relative flex items-center gap-1 px-1.5 py-1 rounded-[2px] text-[10px] font-mono border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-[1px] border border-white/20 inline-block shrink-0"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span>{item.name || item.hex}</span>
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live WCAG Contrast Evaluation if background color comparison is requested */}
        {compareContrastWithHex && (
          <div className="pt-2 border-t border-border/30">
            <WcagContrastBadge
              foregroundHex={localColor}
              backgroundHex={compareContrastWithHex}
            />
          </div>
        )}
      </div>
    </CascadeControlWrapper>
  );
}

/**
 * Cascade Radius Picker with Level 1/2 inheritance and Level 3 override.
 */
export function CascadeRadiusPicker({
  label,
  description,
  radiusMode,
  customRadiusPx,
  inheritedRadiusMode = "rounded",
  inheritedCustomRadiusPx = 3,
  onChange,
}: {
  label: string;
  description?: string;
  radiusMode?: CascadeRadiusMode;
  customRadiusPx?: number;
  inheritedRadiusMode?: "sharp" | "rounded" | "pill";
  inheritedCustomRadiusPx?: number;
  onChange: (mode: CascadeRadiusMode | undefined, customPx?: number) => void;
}) {
  const isOverridden = Boolean(radiusMode && radiusMode !== "inherit");

  const effectiveCustomPx = customRadiusPx ?? inheritedCustomRadiusPx;
  const inheritedPreviewRadius = computeBrandRadiusValue(
    inheritedRadiusMode,
    inheritedCustomRadiusPx
  );

  const handleToggle = (override: boolean) => {
    if (override) {
      onChange("sharp", 0);
    } else {
      onChange(undefined, undefined);
    }
  };

  const getInheritedModeLabel = () => {
    switch (inheritedRadiusMode) {
      case "sharp":
        return "Ostré rohy (0px)";
      case "pill":
        return "Kapsula / Pill (9999px)";
      case "rounded":
      default:
        return `Zaoblené (${inheritedCustomRadiusPx}px)`;
    }
  };

  return (
    <CascadeControlWrapper
      label={label}
      description={description}
      isOverridden={isOverridden}
      onToggleOverride={handleToggle}
      inheritedLabel="Zdedené tvary značky"
      inheritedPreview={
        <div className="flex items-center gap-3 p-2.5 rounded-[2px] bg-neutral-900/60 border border-border/40">
          <div
            className="h-8 w-8 bg-primary/20 border-2 border-primary shrink-0 transition-all flex items-center justify-center text-[10px] font-mono text-primary"
            style={{ borderRadius: inheritedPreviewRadius }}
          >
            {inheritedCustomRadiusPx}px
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground">
              {getInheritedModeLabel()}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Modul automaticky rešpektuje globálne zaoblenie nastavené pre celú značku.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-3 pt-1">
        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { mode: "sharp", label: "Ostré", px: 0 },
              { mode: "rounded", label: "Oblé", px: 4 },
              { mode: "pill", label: "Pill", px: 9999 },
              { mode: "custom", label: "Vlastné", px: effectiveCustomPx },
            ] as const
          ).map((opt) => {
            const isSelected = radiusMode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onChange(opt.mode, opt.mode === "custom" ? effectiveCustomPx : opt.px)}
                className={`py-1.5 px-2 rounded-[2px] text-xs font-medium border text-center transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                    : "border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom Radius Slider (visible when rounded or custom) */}
        {(radiusMode === "rounded" || radiusMode === "custom") && (
          <div className="space-y-1.5 p-2.5 rounded-[2px] bg-neutral-900/50 border border-border/30">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Polomer zaoblenia:</span>
              <span className="font-mono font-bold text-foreground">
                {effectiveCustomPx}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="48"
              step="1"
              value={effectiveCustomPx}
              onChange={(e) =>
                onChange(radiusMode, parseInt(e.target.value, 10))
              }
              className="w-full accent-[#c8d400] h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Live Mini Preview Box */}
        <div className="flex items-center gap-3 pt-1">
          <div
            className="h-9 w-16 bg-primary/20 border-2 border-primary flex items-center justify-center text-[10px] font-mono text-primary font-semibold transition-all shrink-0"
            style={{
              borderRadius: computeBrandRadiusValue(
                radiusMode === "custom" ? "rounded" : radiusMode,
                effectiveCustomPx
              ),
            }}
          >
            {radiusMode === "sharp"
              ? "0px"
              : radiusMode === "pill"
              ? "Pill"
              : `${effectiveCustomPx}px`}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Lokálny náhľad kontajnera tohto modulu po prebití.
          </span>
        </div>
      </div>
    </CascadeControlWrapper>
  );
}
