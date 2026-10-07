"use client";

import React, { useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Palette,
  Check,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { M01HeadingConfig } from "@/lib/validations/modules/m01";
import { useBrandCascade } from "@/components/modules/cascade";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";

export default function M01NadpisModule({
  id,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveColor } = useBrandCascade();
  const defaultBrandAccent = resolveColor(undefined, "primary");

  const typedConfig = config as unknown as Partial<M01HeadingConfig> | undefined;

  const currentLevel = typedConfig?.level || "h2";
  const currentAlign = typedConfig?.align || "left";
  const showAccentLine = Boolean(typedConfig?.showAccentLine);
  const accentColor = typedConfig?.accentColor || defaultBrandAccent || "#FFC62C";
  const fontFamily = typedConfig?.fontFamily || "var(--font-heading)";

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Multilingual text resolution: active locale first, with strict English fallback
  const resolvedHeading =
    resolveI18nText(typedConfig?.text, locale, "en") ||
    (locale === "sk" ? "Nový nadpis" : "New Heading");

  // Helper to commit config updates to server
  const handleUpdateConfig = async (patch: Partial<M01HeadingConfig>) => {
    const updated: M01HeadingConfig = {
      level: currentLevel,
      fontFamily,
      align: currentAlign,
      showAccentLine,
      accentColor,
      text: typedConfig?.text || { en: "Heading", sk: "Nadpis" },
      styleOverrides: typedConfig?.styleOverrides,
      ...patch,
    };

    if (onConfigChange) {
      onConfigChange(updated as unknown as BaseModuleConfig);
    } else if (id) {
      await updateModuleConfigAction(id, updated as unknown as Record<string, unknown>);
    }
  };

  // Direct Inline Text Editing
  const handleSaveText = async (newText: string) => {
    const updatedTextRecord = setI18nText(typedConfig?.text, locale, newText);
    await handleUpdateConfig({ text: updatedTextRecord });
  };

  // Alignment CSS classes
  const alignClass =
    currentAlign === "center"
      ? "text-center items-center justify-center"
      : currentAlign === "right"
      ? "text-right items-end justify-end"
      : "text-left items-start justify-start";

  const lineAlignClass =
    currentAlign === "center"
      ? "mx-auto"
      : currentAlign === "right"
      ? "ml-auto"
      : "mr-auto";

  // Typography level styling
  const levelClass =
    currentLevel === "h1"
      ? "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
      : currentLevel === "h3"
      ? "text-xl sm:text-2xl font-bold tracking-tight"
      : currentLevel === "h4"
      ? "text-lg sm:text-xl font-semibold tracking-normal"
      : "text-2xl sm:text-3xl font-extrabold tracking-tight"; // h2 default

  const Tag = currentLevel;

  return (
    <div className="group/m01 relative w-full py-1">
      {/* Editor Hover Toolbar (Prevents Pencil Hell - only visible on hover) */}
      {isEditor && (
        <div className="absolute -top-9 left-0 z-30 opacity-0 group-hover/m01:opacity-100 transition-opacity bg-[#070b0f] border border-white/20 rounded-[3px] p-1 flex items-center gap-1 shadow-xl">
          {/* Level Switcher */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-[2px] p-0.5 border border-white/10">
            {(["h1", "h2", "h3", "h4"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleUpdateConfig({ level: lvl })}
                className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[1px] uppercase transition-colors ${
                  currentLevel === lvl
                    ? "bg-primary text-primary-foreground"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                title={`Úroveň nadpisu: ${lvl.toUpperCase()}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Alignment Switcher */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-[2px] p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => handleUpdateConfig({ align: "left" })}
              className={`p-1 rounded-[1px] transition-colors ${
                currentAlign === "left"
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Zarovnať vľavo"
            >
              <AlignLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdateConfig({ align: "center" })}
              className={`p-1 rounded-[1px] transition-colors ${
                currentAlign === "center"
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Zarovnať na stred"
            >
              <AlignCenter className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleUpdateConfig({ align: "right" })}
              className={`p-1 rounded-[1px] transition-colors ${
                currentAlign === "right"
                  ? "bg-primary text-primary-foreground"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Zarovnať vpravo"
            >
              <AlignRight className="h-3 w-3" />
            </button>
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Accent Line Switcher */}
          <button
            type="button"
            onClick={() => handleUpdateConfig({ showAccentLine: !showAccentLine })}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] flex items-center gap-1 transition-colors border ${
              showAccentLine
                ? "bg-primary text-primary-foreground font-bold border-primary"
                : "border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title="Prepnúť dekoračnú podkladovú linku (Accent Line)"
          >
            <Minus className="h-3 w-3" />
            <span>Linka</span>
          </button>

          {/* Accent Color Swatch & Popover */}
          {showAccentLine && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="p-1 rounded-[2px] border border-border/40 flex items-center gap-1 hover:border-primary/60 transition-colors"
                title="Farba dekoračnej linky"
              >
                <div
                  className="w-3 h-3 rounded-full border border-black/40 shadow-xs"
                  style={{ backgroundColor: accentColor }}
                />
                <Palette className="h-2.5 w-2.5 text-muted-foreground" />
              </button>

              {isColorPickerOpen && (
                <div className="absolute left-0 top-full mt-1 bg-neutral-950 border border-border/80 rounded-[3px] p-2.5 shadow-2xl z-50 w-44 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    Farba linky
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      defaultBrandAccent || "#FFC62C",
                      "#3B82F6",
                      "#10B981",
                      "#F43F5E",
                      "#8B5CF6",
                      "#FFFFFF",
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          handleUpdateConfig({ accentColor: col });
                          setIsColorPickerOpen(false);
                        }}
                        className="w-5 h-5 rounded-full border border-border/60 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: col }}
                      >
                        {accentColor.toLowerCase() === col.toLowerCase() && (
                          <Check className="h-2.5 w-2.5 text-black drop-shadow-xs" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex input */}
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => handleUpdateConfig({ accentColor: e.target.value })}
                    className="w-full h-6 px-1.5 text-[10px] font-mono rounded-[2px] bg-neutral-900 border border-border/40 text-foreground"
                    placeholder="#HEX"
                  />
                </div>
              )}
            </div>
          )}

          {/* Active Locale indicator */}
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[1px] bg-neutral-900 border border-border/40 text-muted-foreground">
            {locale}
          </span>
        </div>
      )}

      {/* Main Heading Content */}
      <div className={`w-full flex flex-col ${alignClass}`}>
        {isEditor ? (
          <InlineEditableText
            as={Tag}
            value={resolvedHeading}
            onSave={handleSaveText}
            className={`w-full text-foreground ${levelClass}`}
            placeholder={locale === "sk" ? "Sem napíšte nadpis..." : "Type heading here..."}
          />
        ) : (
          <Tag
            className={`w-full text-foreground ${levelClass}`}
            style={{ fontFamily }}
          >
            {resolvedHeading}
          </Tag>
        )}

        {/* Decorative Accent Line (Mars-X Style: 4px height, 48px width) */}
        {showAccentLine && (
          <div
            className={`h-1 w-12 rounded-full mt-2.5 ${lineAlignClass} shadow-xs`}
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
