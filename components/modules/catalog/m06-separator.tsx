"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Minus,
  MoveVertical,
  Maximize2,
  AlignCenter,
  AlignLeft,
  EyeOff,
  Palette,
  Check,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M06SeparatorConfig,
  m06SeparatorSchema,
} from "@/lib/validations/modules/m06";
import { resolveI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";

const SPACER_HEIGHTS = ["8", "16", "24", "32", "48", "64", "96", "128"] as const;

export default function M06OddelovacMedzeraModule({
  id: moduleId,
  moduleType = "M06_OddelovacMedzera",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { tokens } = useBrandCascade();

  // Safely parse config with defaults
  const parsedConfig = useMemo(() => {
    const res = m06SeparatorSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      type: "divider" as const,
      height: "32" as const,
      margin: "medium" as const,
      style: "solid" as const,
      thickness: 1,
      color: "neutral" as const,
      customHex: null,
      width: "100" as const,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M06SeparatorConfig>(parsedConfig);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Save changes handler
  const handleSaveConfig = async (newConfig: M06SeparatorConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M06 config:", err);
      }
    }
  };

  // Resolve margin classes
  const marginClasses = useMemo(() => {
    switch (cfg.margin) {
      case "none":
        return "my-0";
      case "small":
        return "my-3";
      case "large":
        return "my-10";
      case "medium":
      default:
        return "my-6";
    }
  }, [cfg.margin]);

  // Resolve divider width classes
  const widthClasses = useMemo(() => {
    switch (cfg.width) {
      case "50_center":
        return "w-1/2 mx-auto";
      case "25_left":
        return "w-1/4 mr-auto";
      case "100":
      default:
        return "w-full";
    }
  }, [cfg.width]);

  // Resolve divider border color
  const dividerColor = useMemo(() => {
    if (cfg.color === "custom" && cfg.customHex) {
      return cfg.customHex;
    }
    if (cfg.color === "accent") {
      return tokens?.colors?.accent || tokens?.colors?.primary || "#009f80";
    }
    // neutral
    return "var(--border, rgba(255, 255, 255, 0.15))";
  }, [cfg.color, cfg.customHex, tokens]);

  // Check if divider line is invisible (style none or thickness 0)
  const isInvisibleDivider = cfg.style === "none" || cfg.thickness === 0;

  return (
    <div className="relative group/m06 w-full">
      {/* Optional H3 header if configured */}
      {showH3 && h3Title && (
        <h3 className="text-base font-bold tracking-tight text-foreground mb-2">
          {resolveI18nText(h3Title, locale)}
        </h3>
      )}

      {/* Editor Floating Hover Toolbar */}
      {isEditor && (
        <div className="opacity-0 group-hover/m06:opacity-100 transition-opacity duration-150 absolute -top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#17212a] border border-border/80 rounded-[3px] p-1 shadow-xl text-xs whitespace-nowrap">
          {/* Mode Switch: Divider vs Spacer */}
          <div className="flex items-center border-r border-border/50 pr-1 mr-1">
            <button
              type="button"
              title="Deliaca čiara (Divider)"
              onClick={() => handleSaveConfig({ ...cfg, type: "divider" })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] transition-colors ${
                cfg.type === "divider"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Čiara</span>
            </button>
            <button
              type="button"
              title="Vertikálna medzera (Spacer)"
              onClick={() => handleSaveConfig({ ...cfg, type: "spacer" })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[2px] transition-colors ${
                cfg.type === "spacer"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
              }`}
            >
              <MoveVertical className="w-3.5 h-3.5" />
              <span>Medzera</span>
            </button>
          </div>

          {/* Spacer Controls */}
          {cfg.type === "spacer" && (
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground px-1 font-mono uppercase">
                Výška:
              </span>
              {SPACER_HEIGHTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  title={`${h}px`}
                  onClick={() => handleSaveConfig({ ...cfg, height: h })}
                  className={`px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors ${
                    cfg.height === h
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}

          {/* Divider Controls */}
          {cfg.type === "divider" && (
            <>
              {/* Style Selector (Solid, Dashed, Dotted, None/0px) */}
              <div className="flex items-center border-r border-border/50 pr-1 mr-1">
                {(
                  [
                    { id: "solid", label: "Plná" },
                    { id: "dashed", label: "Čiarkovaná" },
                    { id: "dotted", label: "Bodkovaná" },
                    { id: "none", label: "0px (neviditeľná)" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    title={`Štýl: ${st.label}`}
                    onClick={() =>
                      handleSaveConfig({
                        ...cfg,
                        style: st.id,
                        thickness: st.id === "none" ? 0 : cfg.thickness === 0 ? 1 : cfg.thickness,
                      })
                    }
                    className={`px-1.5 py-0.5 rounded-[2px] text-[11px] transition-colors ${
                      cfg.style === st.id
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                    }`}
                  >
                    {st.id === "none" ? <EyeOff className="w-3 h-3" /> : st.label}
                  </button>
                ))}
              </div>

              {/* Thickness Selector if not style "none" */}
              {cfg.style !== "none" && (
                <div className="flex items-center border-r border-border/50 pr-1 mr-1">
                  {[0, 1, 2, 4].map((th) => (
                    <button
                      key={th}
                      type="button"
                      title={th === 0 ? "0px (neviditeľná čiara)" : `${th}px hrúbka`}
                      onClick={() =>
                        handleSaveConfig({
                          ...cfg,
                          thickness: th,
                          style: th === 0 ? "none" : cfg.style === "none" ? "solid" : cfg.style,
                        })
                      }
                      className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono transition-colors ${
                        cfg.thickness === th
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                      }`}
                    >
                      {th}px
                    </button>
                  ))}
                </div>
              )}

              {/* Width Selector */}
              <div className="flex items-center border-r border-border/50 pr-1 mr-1">
                <button
                  type="button"
                  title="Šírka 100%"
                  onClick={() => handleSaveConfig({ ...cfg, width: "100" })}
                  className={`p-1 rounded-[2px] transition-colors ${
                    cfg.width === "100"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                  }`}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Šírka 50% na stred"
                  onClick={() => handleSaveConfig({ ...cfg, width: "50_center" })}
                  className={`p-1 rounded-[2px] transition-colors ${
                    cfg.width === "50_center"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                  }`}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Šírka 25% vľavo"
                  onClick={() => handleSaveConfig({ ...cfg, width: "25_left" })}
                  className={`p-1 rounded-[2px] transition-colors ${
                    cfg.width === "25_left"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                  }`}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
              </div>

              {/* Margin Selector (Small, Medium, Large, None) */}
              <div className="flex items-center border-r border-border/50 pr-1 mr-1">
                <span className="text-[10px] text-muted-foreground px-1 font-mono uppercase">
                  Medzera:
                </span>
                {(
                  [
                    { id: "none", label: "0" },
                    { id: "small", label: "S" },
                    { id: "medium", label: "M" },
                    { id: "large", label: "L" },
                  ] as const
                ).map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    title={`Medzera: ${mg.id}`}
                    onClick={() => handleSaveConfig({ ...cfg, margin: mg.id })}
                    className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono transition-colors ${
                      cfg.margin === mg.id
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                    }`}
                  >
                    {mg.label}
                  </button>
                ))}
              </div>

              {/* Color Selector */}
              {!isInvisibleDivider && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Neutrálna farba"
                    onClick={() => handleSaveConfig({ ...cfg, color: "neutral" })}
                    className={`px-1.5 py-0.5 rounded-[2px] text-[10px] transition-colors ${
                      cfg.color === "neutral"
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                    }`}
                  >
                    Neutral
                  </button>
                  <button
                    type="button"
                    title="Akcentná farba značky"
                    onClick={() => handleSaveConfig({ ...cfg, color: "accent" })}
                    className={`px-1.5 py-0.5 rounded-[2px] text-[10px] transition-colors ${
                      cfg.color === "accent"
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                    }`}
                  >
                    Akcent
                  </button>
                  <button
                    type="button"
                    title="Vlastná farba"
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    className={`p-1 rounded-[2px] transition-colors ${
                      cfg.color === "custom"
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-800/60"
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Color Picker Flyout for Custom Hex */}
      {isEditor && isColorPickerOpen && (
        <div className="absolute top-0 right-4 z-40 bg-[#17212a] border border-border/80 rounded-[3px] p-2.5 shadow-2xl flex items-center gap-2">
          <input
            type="color"
            value={cfg.customHex || "#009f80"}
            onChange={(e) =>
              handleSaveConfig({
                ...cfg,
                color: "custom",
                customHex: e.target.value,
              })
            }
            className="w-7 h-7 rounded border border-border/60 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={cfg.customHex || ""}
            placeholder="#009f80"
            onChange={(e) =>
              handleSaveConfig({
                ...cfg,
                color: "custom",
                customHex: e.target.value,
              })
            }
            className="w-24 bg-[#0e161d] border border-border/70 rounded-[2px] px-2 py-1 text-foreground font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => setIsColorPickerOpen(false)}
            className="p-1 rounded bg-primary text-primary-foreground hover:opacity-90"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Render Component */}
      {cfg.type === "spacer" ? (
        /* Spacer Mode */
        <div
          style={{ height: `${cfg.height}px` }}
          className={`w-full transition-all duration-150 ${
            isEditor
              ? "border border-dashed border-border/50 rounded-[2px] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_8px,rgba(255,255,255,0.035)_8px,rgba(255,255,255,0.035)_16px)] flex items-center justify-center select-none"
              : ""
          }`}
        >
          {isEditor && (
            <span className="text-[10px] font-mono text-muted-foreground/80 px-2 py-0.5 rounded-[2px] bg-[#0e161d]/80 border border-border/40">
              Spacer: {cfg.height}px
            </span>
          )}
        </div>
      ) : (
        /* Divider Mode */
        <div className={`w-full ${marginClasses}`}>
          {isInvisibleDivider ? (
            /* Invisible / 0px Divider acting as pure vertical spacing */
            <div className="w-full flex items-center justify-center">
              {isEditor ? (
                <div className={`w-full border-t border-dashed border-border/30 py-1 flex items-center justify-center select-none`}>
                  <span className="text-[9px] font-mono text-muted-foreground/60 px-1.5 py-0.5 rounded bg-[#0e161d]/70 border border-border/30">
                    0px Divider (neviditeľná čiara)
                  </span>
                </div>
              ) : (
                /* On client / public site: pure transparent spacer */
                <div className="h-0 w-full" aria-hidden="true" />
              )}
            </div>
          ) : (
            /* Visible Divider HR */
            <hr
              className={`${widthClasses} transition-all duration-150`}
              style={{
                borderTopStyle: cfg.style as any,
                borderTopWidth: `${cfg.thickness}px`,
                borderColor: dividerColor,
                borderBottom: "none",
                borderLeft: "none",
                borderRight: "none",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
