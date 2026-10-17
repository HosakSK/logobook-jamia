"use client";

import { useEffect, useState, useRef } from "react";
import { useColorPickerStore } from "@/lib/store/color-picker-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Pipette,
  Check,
  RotateCcw,
  Sparkles,
  Palette,
  AlertCircle,
} from "lucide-react";

export function GlobalColorPickerModal() {
  const {
    isOpen,
    title,
    color,
    initialColor,
    palette,
    allowTransparent,
    closeColorPicker,
    setColor,
    onSelect,
  } = useColorPickerStore();

  const [hexInput, setHexInput] = useState(color);
  const [isValidHex, setIsValidHex] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or store color updates
  useEffect(() => {
    if (isOpen) {
      setHexInput(color);
      setIsValidHex(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, color]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        closeColorPicker();
      } else if (e.key === "Enter" && isValidHex) {
        handleApply();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isValidHex, hexInput]);

  if (!isOpen) return null;

  const validateAndFormatHex = (val: string): { valid: boolean; formatted: string } => {
    const clean = val.trim();
    if (allowTransparent && (clean.toLowerCase() === "transparent" || clean === "none")) {
      return { valid: true, formatted: "transparent" };
    }
    const withHash = clean.startsWith("#") ? clean : `#${clean}`;
    const isValid = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(withHash);
    return { valid: isValid, formatted: withHash };
  };

  const handleInputChange = (val: string) => {
    setHexInput(val);
    const { valid, formatted } = validateAndFormatHex(val);
    setIsValidHex(valid);
    if (valid) {
      setColor(formatted);
    }
  };

  const handleSelectPreset = (chosenHex: string) => {
    setHexInput(chosenHex);
    setIsValidHex(true);
    setColor(chosenHex);
  };

  const handleApply = () => {
    const { valid, formatted } = validateAndFormatHex(hexInput);
    if (valid) {
      if (onSelect) {
        onSelect(formatted);
      }
      closeColorPicker();
    }
  };

  const handleResetToInitial = () => {
    handleSelectPreset(initialColor);
  };

  // Browser EyeDropper API (Native pipette)
  const handleNativePipette = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleSelectPreset(result.sRGBHex);
        }
      } catch {
        // User canceled pipette
      }
    }
  };

  const isPipetteSupported = typeof window !== "undefined" && "EyeDropper" in window;
  const isCurrentTransparent = color.toLowerCase() === "transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(63,85,102,0.4)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#c8d400]/15 border border-[#c8d400]/30 flex items-center justify-center text-[#c8d400]">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#fafbfc]">{title}</h2>
              <p className="text-xs text-[#96abbe]">
                Zadajte presný HEX kód, vyberte z palety alebo použite systémovú pipetu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeColorPicker}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Roomy layout with preview & controls */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Visual Preview Tile & HEX Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
            {/* Color Swatch Preview Box */}
            <div className="sm:col-span-5 flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-[#0e161d] min-h-[140px] relative overflow-hidden">
              {/* Checkerboard background for transparency preview */}
              <div
                className="absolute inset-0 opacity-40 bg-[radial-gradient(#2b3b48_1px,transparent_1px)] [background-size:12px_12px]"
                aria-hidden="true"
              />

              {/* Active Color Fill */}
              <div
                className="absolute inset-0 transition-colors duration-150"
                style={{
                  backgroundColor: isCurrentTransparent ? "transparent" : color,
                }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-black/60 text-white font-semibold backdrop-blur-xs">
                  {isCurrentTransparent ? "Bez pozadia" : color}
                </span>

                {initialColor !== color && (
                  <button
                    type="button"
                    onClick={handleResetToInitial}
                    title="Obnoviť pôvodnú farbu"
                    className="flex items-center gap-1 text-[10px] bg-black/60 text-white hover:text-[#c8d400] px-2 py-0.5 rounded-md backdrop-blur-xs cursor-pointer transition-colors"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Pôvodná ({initialColor})</span>
                  </button>
                )}
              </div>

              <div className="relative z-10 flex items-end justify-between pt-6">
                {isPipetteSupported && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleNativePipette}
                    className="h-8 text-xs bg-black/70 hover:bg-black text-white border border-white/20 gap-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <Pipette className="h-3.5 w-3.5 text-[#c8d400]" />
                    <span>Pipeta z obrazovky</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Input & Hex Controls */}
            <div className="sm:col-span-7 flex flex-col justify-center space-y-3 bg-[#0e161d] p-4 rounded-xl border border-white/10">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hex-color-input" className="text-xs font-bold uppercase tracking-wider text-[#96abbe]">
                    HEX Farba
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    #RRGGBB
                  </span>
                </div>

                <div className="relative">
                  <Input
                    id="hex-color-input"
                    ref={inputRef}
                    type="text"
                    value={hexInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="#000000"
                    className={`font-mono text-base uppercase tracking-wider pl-3 pr-10 h-11 bg-[#17212a] border transition-colors ${
                      isValidHex
                        ? "border-white/20 focus:border-[#c8d400]"
                        : "border-red-500/60 focus:border-red-500"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidHex ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                        <AlertCircle className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>

                {!isValidHex && (
                  <p className="text-[11px] text-red-400">
                    Zadajte platný HEX kód (napr. #000000, #FFFFFF, #C8D400).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Palette / Brand Colors section */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-[#96abbe]">
              Rýchly výber z palety značky & systému
            </Label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Transparent option if allowed */}
              {allowTransparent && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset("transparent")}
                  className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrentTransparent
                      ? "ring-2 ring-[#c8d400] border-transparent bg-white/10 text-white"
                      : "border-white/10 hover:border-white/30 bg-[#0e161d] text-muted-foreground"
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-dashed border-white/50 flex items-center justify-center text-[10px]">
                    ∅
                  </span>
                  <span>Bez pozadia</span>
                </button>
              )}

              {/* Standard presets */}
              {[
                { hex: "#000000", name: "Čierna" },
                { hex: "#ffffff", name: "Biela" },
                { hex: "#0e161d", name: "Manuál Slate" },
              ].map((p) => {
                const isSelected = color.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => handleSelectPreset(p.hex)}
                    className={`h-9 px-3 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-[#c8d400] border-transparent font-bold bg-[#0e161d]"
                        : "border-white/10 hover:border-white/30 bg-[#0e161d]"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}

              {/* Project Palette Colors */}
              {palette &&
                palette.map((p, idx) => {
                  const isSelected = color.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={`${p.hex}-${idx}`}
                      type="button"
                      onClick={() => handleSelectPreset(p.hex)}
                      className={`h-9 px-3 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-[#c8d400] border-transparent font-bold bg-[#0e161d]"
                          : "border-white/10 hover:border-white/30 bg-[#0e161d]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="truncate max-w-[120px]">
                        {p.name || p.role || p.hex}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(63,85,102,0.4)] bg-[#0e161d]">
          <span className="text-xs text-[#96abbe]">
            Stlačením <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 font-mono text-[10px]">Enter</kbd> potvrdíte výber
          </span>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={closeColorPicker}
              className="text-xs cursor-pointer text-muted-foreground hover:text-white"
            >
              Zrušiť
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!isValidHex}
              onClick={handleApply}
              className="text-xs font-bold bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] cursor-pointer px-4"
            >
              Použiť farbu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
