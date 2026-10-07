"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  BookOpen,
  Download,
  ShieldAlert,
  FileText,
  ExternalLink,
  ChevronDown,
  Link as LinkIcon,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { M03BannerConfig, M03BannerVariant } from "@/lib/validations/modules/m03";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction } from "@/actions/pages";

const PRESET_STYLES: Record<
  M03BannerVariant,
  {
    bg: string;
    border: string;
    titleColor: string;
    bodyColor: string;
    iconClass: string;
    role: "alert" | "region";
    defaultIcon: string;
    label: string;
  }
> = {
  info: {
    bg: "color-mix(in srgb, #3b82f6 10%, var(--card))",
    border: "color-mix(in srgb, #3b82f6 40%, transparent)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-blue-500",
    role: "region",
    defaultIcon: "info",
    label: "Info",
  },
  warning: {
    bg: "color-mix(in srgb, #f59e0b 12%, var(--card))",
    border: "color-mix(in srgb, #f59e0b 45%, transparent)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-amber-500",
    role: "alert",
    defaultIcon: "alert-triangle",
    label: "Warning",
  },
  danger: {
    bg: "color-mix(in srgb, #bb4934 12%, var(--card))",
    border: "color-mix(in srgb, #bb4934 45%, transparent)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-rose-500",
    role: "alert",
    defaultIcon: "alert-circle",
    label: "Danger",
  },
  success: {
    bg: "color-mix(in srgb, #009f80 12%, var(--card))",
    border: "color-mix(in srgb, #009f80 45%, transparent)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-emerald-500",
    role: "region",
    defaultIcon: "check-circle",
    label: "Success",
  },
  accent: {
    bg: "color-mix(in srgb, var(--primary, #c8d400) 12%, var(--card))",
    border: "color-mix(in srgb, var(--primary, #c8d400) 45%, transparent)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-primary",
    role: "region",
    defaultIcon: "sparkles",
    label: "Brand Accent",
  },
  custom: {
    bg: "var(--card)",
    border: "var(--border)",
    titleColor: "var(--foreground)",
    bodyColor: "var(--muted-foreground)",
    iconClass: "text-primary",
    role: "region",
    defaultIcon: "info",
    label: "Custom",
  },
};

const AVAILABLE_ICONS = [
  { id: "info", label: "Info", Icon: Info },
  { id: "alert-triangle", label: "Warning", Icon: AlertTriangle },
  { id: "alert-circle", label: "Danger", Icon: AlertCircle },
  { id: "check-circle", label: "Success", Icon: CheckCircle2 },
  { id: "sparkles", label: "Sparkles", Icon: Sparkles },
  { id: "book-open", label: "Book", Icon: BookOpen },
  { id: "download", label: "Download", Icon: Download },
  { id: "shield-alert", label: "Security", Icon: ShieldAlert },
  { id: "file-text", label: "Document", Icon: FileText },
];

export default function M03BannerModule({
  id,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const typedConfig = config as unknown as Partial<M03BannerConfig> | undefined;

  const variant: M03BannerVariant = typedConfig?.variant || "info";
  const preset = PRESET_STYLES[variant] || PRESET_STYLES.info;

  const iconConfig = typedConfig?.icon || {
    source: "system",
    iconId: preset.defaultIcon,
    position: "left",
  };
  const iconPosition = iconConfig.position || "left";

  const buttonConfig = typedConfig?.button || {
    show: false,
    label: { en: "Learn more", sk: "Zistiť viac" },
    url: "#",
  };

  const [isIconMenuOpen, setIsIconMenuOpen] = useState(false);
  const [isUrlMenuOpen, setIsUrlMenuOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(buttonConfig.url || "#");

  // Multilingual text resolution (EN primary, with strict fallback)
  const resolvedTitle =
    resolveI18nText(typedConfig?.title, locale, "en") ||
    (locale === "sk" ? "Dôležité upozornenie" : "Important Notice");

  const resolvedContent =
    resolveI18nText(typedConfig?.content, locale, "en") ||
    (locale === "sk"
      ? "Sem napíšte podrobný popis upozornenia alebo technických pravidiel..."
      : "Write detailed notice description or technical guidelines here...");

  const resolvedButtonLabel =
    resolveI18nText(buttonConfig.label, locale, "en") ||
    (locale === "sk" ? "Stiahnuť návod" : "Learn more");

  // Helper to commit config updates to server
  const handleUpdateConfig = async (patch: Partial<M03BannerConfig>) => {
    const updated: M03BannerConfig = {
      variant,
      backgroundColor: typedConfig?.backgroundColor,
      borderColor: typedConfig?.borderColor,
      textColor: typedConfig?.textColor,
      icon: iconConfig,
      title: typedConfig?.title || { en: "Notice", sk: "Upozornenie" },
      content: typedConfig?.content || { en: "Content", sk: "Obsah" },
      button: buttonConfig,
      styleOverrides: typedConfig?.styleOverrides,
      ...patch,
    };

    if (onConfigChange) {
      onConfigChange(updated as unknown as BaseModuleConfig);
    } else if (id) {
      await updateModuleConfigAction(id, updated as unknown as Record<string, unknown>);
    }
  };

  // Inline Title Save
  const handleSaveTitle = async (newTitle: string) => {
    const updated = setI18nText(typedConfig?.title, locale, newTitle);
    await handleUpdateConfig({ title: updated });
  };

  // Inline Content Save
  const handleSaveContent = async (newContent: string) => {
    const updated = setI18nText(typedConfig?.content, locale, newContent);
    await handleUpdateConfig({ content: updated });
  };

  // Inline Button Label Save
  const handleSaveButtonLabel = async (newLabel: string) => {
    const updatedLabel = setI18nText(buttonConfig.label, locale, newLabel);
    await handleUpdateConfig({
      button: {
        ...buttonConfig,
        label: updatedLabel,
      },
    });
  };

  // Save Button URL
  const handleSaveButtonUrl = async () => {
    setIsUrlMenuOpen(false);
    await handleUpdateConfig({
      button: {
        ...buttonConfig,
        url: tempUrl,
      },
    });
  };

  // Resolve Icon Component
  const activeIconEntry =
    AVAILABLE_ICONS.find((i) => i.id === iconConfig.iconId) || AVAILABLE_ICONS[0];
  const IconComponent = activeIconEntry.Icon;

  return (
    <div className="group/m03 relative w-full py-1">
      {/* Editor Hover Toolbar (Prevents Pencil Hell - only visible on hover) */}
      {isEditor && (
        <div className="absolute -top-9 left-0 z-30 opacity-0 group-hover/m03:opacity-100 transition-opacity bg-[#070b0f] border border-white/20 rounded-[var(--brand-radius,6px)] p-1 flex items-center gap-1 shadow-xl text-white">
          {/* Variant / Tone Selector */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-[2px] p-0.5 border border-white/10">
            {(["info", "warning", "danger", "success", "accent"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  handleUpdateConfig({
                    variant: v,
                    icon: {
                      ...iconConfig,
                      iconId: PRESET_STYLES[v].defaultIcon,
                    },
                  })
                }
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors ${
                  variant === v
                    ? "bg-primary text-[#070b0f] font-bold"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
                title={`Štýl banneru: ${PRESET_STYLES[v].label}`}
              >
                {PRESET_STYLES[v].label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Icon Selector Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsIconMenuOpen(!isIconMenuOpen)}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] border border-white/20 flex items-center gap-1 hover:border-primary/60 text-white/75 hover:text-white transition-colors"
              title="Nastavenie ikony banneru"
            >
              <IconComponent className="h-3 w-3" />
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </button>

            {isIconMenuOpen && (
              <div className="absolute left-0 top-full mt-1 bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-[var(--brand-radius,6px)] p-2.5 shadow-2xl z-50 w-52 space-y-2.5 animate-in fade-in zoom-in-95 text-[#fafbfc]">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#96abbe] border-b border-[rgba(63,85,102,0.45)] pb-1">
                  <span>Výber ikony</span>
                  <button
                    type="button"
                    onClick={() => setIsIconMenuOpen(false)}
                    className="hover:text-[#fafbfc] text-[#96abbe]"
                  >
                    ✕
                  </button>
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-3 gap-1">
                  {AVAILABLE_ICONS.map((item) => {
                    const CurrentIcon = item.Icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleUpdateConfig({
                            icon: { ...iconConfig, iconId: item.id },
                          });
                          setIsIconMenuOpen(false);
                        }}
                        className={`p-1.5 rounded-[2px] border flex flex-col items-center gap-1 text-[9px] transition-colors cursor-pointer ${
                          iconConfig.iconId === item.id
                            ? "bg-primary text-[#070b0f] border-primary font-bold"
                            : "border-[rgba(63,85,102,0.45)] hover:border-primary/60 bg-[#17212a] text-[#fafbfc]"
                        }`}
                      >
                        <CurrentIcon className="h-3.5 w-3.5" />
                        <span className="truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Position Switcher */}
                <div className="pt-1 border-t border-[rgba(63,85,102,0.45)] flex items-center justify-between">
                  <span className="text-[10px] text-[#96abbe]">Pozícia:</span>
                  <div className="flex items-center gap-1">
                    {(["left", "right", "none"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          handleUpdateConfig({
                            icon: { ...iconConfig, position: pos },
                          })
                        }
                        className={`px-1.5 py-0.5 text-[9px] rounded-[1px] uppercase ${
                          iconPosition === pos
                            ? "bg-primary text-[#070b0f] font-bold"
                            : "text-[#96abbe] hover:text-[#fafbfc] bg-[#17212a]"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* CTA Button Toggle & URL Setting */}
          <button
            type="button"
            onClick={() =>
              handleUpdateConfig({
                button: { ...buttonConfig, show: !buttonConfig.show },
              })
            }
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] border transition-colors flex items-center gap-1 ${
              buttonConfig.show
                ? "bg-primary text-[#070b0f] border-primary font-bold"
                : "border-white/20 text-white/75 hover:text-white hover:bg-white/10"
            }`}
            title="Prepnúť CTA akčné tlačidlo"
          >
            <span>Tlačidlo</span>
          </button>

          {buttonConfig.show && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTempUrl(buttonConfig.url || "#");
                  setIsUrlMenuOpen(!isUrlMenuOpen);
                }}
                className="p-1 rounded-[2px] border border-white/20 hover:border-primary/60 text-white/75 hover:text-white transition-colors"
                title="Nastaviť cieľovú URL adresu tlačidla"
              >
                <LinkIcon className="h-3 w-3" />
              </button>

              {isUrlMenuOpen && (
                <div className="absolute left-0 top-full mt-1 bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-[var(--brand-radius,6px)] p-2.5 shadow-2xl z-50 w-60 space-y-2 animate-in fade-in zoom-in-95 text-[#fafbfc]">
                  <div className="text-[10px] uppercase font-bold text-[#96abbe]">
                    URL adresa tlačidla
                  </div>
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-7 px-2 text-xs font-mono rounded-[var(--brand-radius,4px)] bg-[#070b0f] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] focus:border-primary focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsUrlMenuOpen(false)}
                      className="px-2 py-0.5 text-[10px] text-[#96abbe] hover:text-[#fafbfc]"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveButtonUrl}
                      className="px-2.5 py-0.5 text-[10px] font-bold rounded-[2px] bg-primary text-[#070b0f]"
                    >
                      Uložiť
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Locale indicator */}
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[1px] bg-white/10 border border-white/20 text-white/70 ml-0.5">
            {locale}
          </span>
        </div>
      )}

      {/* Banner Callout Container (Dizajnová konzistencia: dedí border-radius a border-width zo značky) */}
      <section
        role={preset.role}
        className="w-full p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 shadow-2xs"
        style={{
          backgroundColor: typedConfig?.backgroundColor || preset.bg,
          borderColor: typedConfig?.borderColor || preset.border,
          borderRadius: "var(--brand-radius, 3px)",
          borderWidth: "var(--brand-border-width, 1px)",
          borderStyle: "solid",
        }}
        aria-label={resolvedTitle}
      >
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Left Icon */}
          {iconPosition === "left" && (
            <div
              className={`p-2 rounded-[var(--brand-radius,4px)] bg-black/10 dark:bg-white/10 border border-current/15 shrink-0 mt-0.5 ${preset.iconClass}`}
              aria-hidden="true"
            >
              <IconComponent className="h-5 w-5" />
            </div>
          )}

          <div className="space-y-1 flex-1 min-w-0">
            {/* Inline Title */}
            {isEditor ? (
              <InlineEditableText
                as="h4"
                value={resolvedTitle}
                onSave={handleSaveTitle}
                className="text-sm sm:text-base font-bold tracking-tight block"
                placeholder={locale === "sk" ? "Názov upozornenia..." : "Notice title..."}
              />
            ) : (
              <h4
                className="text-sm sm:text-base font-bold tracking-tight"
                style={{ color: typedConfig?.textColor || preset.titleColor }}
              >
                {resolvedTitle}
              </h4>
            )}

            {/* Inline Description Content */}
            {isEditor ? (
              <InlineEditableText
                as="p"
                multiline={true}
                value={resolvedContent}
                onSave={handleSaveContent}
                className="text-xs sm:text-sm leading-relaxed block opacity-90"
                placeholder={locale === "sk" ? "Podrobnosti upozornenia..." : "Notice details..."}
              />
            ) : (
              <p
                className="text-xs sm:text-sm leading-relaxed opacity-90"
                style={{ color: typedConfig?.textColor || preset.bodyColor }}
              >
                {resolvedContent}
              </p>
            )}
          </div>

          {/* Right Icon */}
          {iconPosition === "right" && (
            <div
              className={`p-2 rounded-[var(--brand-radius,4px)] bg-black/10 dark:bg-white/10 border border-current/15 shrink-0 mt-0.5 ${preset.iconClass}`}
              aria-hidden="true"
            >
              <IconComponent className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Optional Call to Action Button */}
        {buttonConfig.show && (
          <div className="shrink-0 self-end sm:self-center pt-2 sm:pt-0">
            {isEditor ? (
              <div className="px-3.5 py-1.5 text-xs font-bold rounded-[var(--brand-radius,4px)] bg-card border border-border/80 shadow-xs flex items-center gap-1.5 text-foreground cursor-pointer">
                <InlineEditableText
                  value={resolvedButtonLabel}
                  onSave={handleSaveButtonLabel}
                  className="font-bold"
                  placeholder="Button label..."
                />
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
              </div>
            ) : (
              <Link
                href={buttonConfig.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 text-xs font-bold rounded-[var(--brand-radius,4px)] bg-card hover:bg-muted text-foreground border border-border/80 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>{resolvedButtonLabel}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
