"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandTypography } from "@/lib/types/typography";
import { deleteBrandTypographyAction } from "@/actions/typography";
import { DEFAULT_PANGRAMS } from "@/lib/validations/typography";
import { Button } from "@/components/ui/button";
import {
  Type,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Upload,
  Cloud,
  Sliders,
  RotateCcw,
} from "lucide-react";

interface TypographyCardProps {
  typography: BrandTypography;
  brandId: string;
  headingColor?: string;
  index: number;
  total: number;
  onEdit: (typography: BrandTypography) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const ROLE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  HEADING: { label: "Nadpisy (Heading)", desc: "H1 – H6, hlavné nadpisy", color: "bg-primary/10 text-primary border-primary/20" },
  BODY: { label: "Základný text (Body)", desc: "Odstavce, články, UI prvky", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  DISPLAY: { label: "Display / Titulky", desc: "Hero bannery, pútače, veľké slogany", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  MONOSPACE: { label: "Kód / Monospace", desc: "Čísla, kódy, technické dáta", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  EMAIL: { label: "Email / Web-Safe", desc: "Newsletter a systémové fallbacky", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const SOURCE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  GOOGLE_FONTS: { label: "Google Fonts", icon: Globe, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  ADOBE_FONTS: { label: "Adobe Fonts", icon: Cloud, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  CUSTOM_UPLOAD: { label: "Vlastný súbor (WOFF2)", icon: Upload, color: "text-lime-400 bg-lime-500/10 border-lime-500/20" },
};

export function TypographyCard({
  typography,
  brandId,
  headingColor,
  index,
  total,
  onEdit,
  onMoveUp,
  onMoveDown,
}: TypographyCardProps) {
  const [isDeleting, startDelete] = useTransition();
  const [copied, setCopied] = useState(false);
  const [previewWithHeadingColor, setPreviewWithHeadingColor] = useState(
    typography.role === "HEADING"
  );

  // Preview interactive state
  const defaultSample = typography.sampleText || DEFAULT_PANGRAMS[0];
  const [sampleText, setSampleText] = useState(defaultSample);
  const [fontSize, setFontSize] = useState<number>(typography.settings.defaultSize || 28);
  const availableWeights = typography.settings.weights && typography.settings.weights.length > 0
    ? typography.settings.weights
    : [400, 700];
  const [selectedWeight, setSelectedWeight] = useState<number>(availableWeights[0] || 400);

  // Compute CSS font-family name
  const customFamilyAlias = `LB_Font_${typography.id}`;
  const cssFamily =
    typography.fontSource === "CUSTOM_UPLOAD"
      ? `"${customFamilyAlias}", ${typography.settings.fallback || "sans-serif"}`
      : typography.fontSource === "ADOBE_FONTS"
      ? `"${typography.fontFamilyName || typography.name}", ${typography.settings.fallback || "sans-serif"}`
      : `"${typography.googleFontFamily || typography.fontFamilyName || typography.name}", ${typography.settings.fallback || "sans-serif"}`;

  // Dynamically inject stylesheet or @font-face
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (typography.fontSource === "GOOGLE_FONTS") {
      const family = typography.googleFontFamily || typography.fontFamilyName || typography.name;
      const elementId = `gfont-${typography.id}`;
      if (!document.getElementById(elementId)) {
        const link = document.createElement("link");
        link.id = elementId;
        link.rel = "stylesheet";
        const cleanName = encodeURIComponent(family.trim()).replace(/%20/g, "+");
        const weightsParam = availableWeights.length > 0 ? availableWeights.join(";") : "400;700";
        link.href = `https://fonts.googleapis.com/css2?family=${cleanName}:wght@${weightsParam}&display=swap`;
        document.head.appendChild(link);
      }
    } else if (typography.fontSource === "ADOBE_FONTS" && typography.adobeProjectId) {
      const elementId = `adobe-font-${typography.id}`;
      if (!document.getElementById(elementId)) {
        const link = document.createElement("link");
        link.id = elementId;
        link.rel = "stylesheet";
        link.href = `https://use.typekit.net/${typography.adobeProjectId}.css`;
        document.head.appendChild(link);
      }
    } else if (typography.fontSource === "CUSTOM_UPLOAD" && typography.customFontUrl) {
      const elementId = `custom-font-${typography.id}`;
      if (!document.getElementById(elementId)) {
        const style = document.createElement("style");
        style.id = elementId;
        style.innerHTML = `
          @font-face {
            font-family: '${customFamilyAlias}';
            src: url('${typography.customFontUrl}') format('woff2'), url('${typography.customFontUrl}');
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [typography, availableWeights, customFamilyAlias]);

  const handleCopyCss = async () => {
    try {
      const cssString = `font-family: ${cssFamily};`;
      await navigator.clipboard.writeText(cssString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDelete = () => {
    if (confirm(`Naozaj chcete odstrániť písmo "${typography.name}"? Táto akcia je nevratná.`)) {
      startDelete(async () => {
        await deleteBrandTypographyAction(brandId, typography.id);
      });
    }
  };

  const roleInfo = ROLE_LABELS[typography.role] || ROLE_LABELS.BODY;
  const sourceInfo = SOURCE_LABELS[typography.fontSource] || SOURCE_LABELS.GOOGLE_FONTS;
  const SourceIcon = sourceInfo.icon;

  return (
    <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-5 shadow-xs transition-all hover:border-[rgba(63,85,102,0.8)] flex flex-col justify-between gap-5 relative group">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg text-[#fafbfc] tracking-tight flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              {typography.name}
            </h3>
            {/* Role Badge */}
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[3px] border ${roleInfo.color}`}
            >
              {roleInfo.label}
            </span>
            {/* Source Badge */}
            <span
              className={`text-[10px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border ${sourceInfo.color}`}
            >
              <SourceIcon className="w-3 h-3" />
              {sourceInfo.label}
            </span>

            {/* Heading Color Badge */}
            {typography.role === "HEADING" && headingColor && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] border border-[rgba(63,85,102,0.6)] flex items-center gap-1.5 bg-[#070b0f] text-[#fafbfc]"
                title="Globálna farba aplikovaná na nadpisy v brand manuáli"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/40 shrink-0"
                  style={{ backgroundColor: headingColor }}
                />
                <span>Farba: {headingColor}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-[#96abbe]">{roleInfo.desc}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <div className="flex items-center border border-[rgba(63,85,102,0.5)] rounded-[3px] bg-[#070b0f] p-0.5">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-white/[0.06] text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 disabled:pointer-events-none rounded-[2px]"
              title="Posunúť vyššie"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="p-1 hover:bg-white/[0.06] text-[#96abbe] hover:text-[#fafbfc] disabled:opacity-30 disabled:pointer-events-none rounded-[2px]"
              title="Posunúť nižšie"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(typography)}
            className="h-7 px-2.5 text-xs rounded-[3px] gap-1.5 bg-[#070b0f] text-[#fafbfc] border-[rgba(63,85,102,0.6)] hover:border-[#c8d400] hover:text-[#c8d400]"
          >
            <Pencil className="w-3 h-3" /> Upraviť
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-7 w-7 p-0 text-[#96abbe] hover:text-red-400 hover:bg-red-500/10 rounded-[3px]"
            title="Odstrániť písmo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Live Font Sandbox / Interactive Preview Canvas */}
      <div className="rounded-[3px] border border-[rgba(63,85,102,0.5)] bg-[#070b0f] p-4 space-y-3">
        {/* Sandbox Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(63,85,102,0.35)] pb-2 text-xs text-[#96abbe]">
          {/* Weight Selectors */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#96abbe]/80">Rez:</span>
            {availableWeights.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWeight(w)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded-[3px] transition-colors border ${
                  selectedWeight === w
                    ? "bg-[#c8d400] text-[#070b0f] border-[#c8d400] font-bold"
                    : "bg-[#17212a] hover:bg-[#1f2c36] border-[rgba(63,85,102,0.6)] text-[#fafbfc]"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Size slider / buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#fafbfc]">{fontSize}px</span>
            <input
              type="range"
              min="14"
              max="60"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20 h-1.5 accent-[#c8d400] cursor-pointer"
            />
            {/* Heading Color toggle if HEADING role */}
            {typography.role === "HEADING" && headingColor && (
              <button
                type="button"
                onClick={() => setPreviewWithHeadingColor(!previewWithHeadingColor)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded-[3px] transition-colors border flex items-center gap-1.5 cursor-pointer ${
                  previewWithHeadingColor
                    ? "bg-[#c8d400]/20 text-[#fafbfc] border-[#c8d400]/60 font-semibold"
                    : "bg-[#17212a] text-[#96abbe] border-[rgba(63,85,102,0.6)] hover:text-[#fafbfc]"
                }`}
                title="Prepnúť náhľad vo farbe nadpisov"
              >
                <span
                  className="w-2 h-2 rounded-full border border-black/40 shrink-0"
                  style={{ backgroundColor: headingColor }}
                />
                <span>Farba nadpisu</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSampleText(defaultSample);
                setFontSize(typography.settings.defaultSize || 28);
                setSelectedWeight(availableWeights[0] || 400);
              }}
              title="Obnoviť predvolené nastavenie náhľadu"
              className="p-1 hover:text-[#fafbfc] text-[#96abbe]"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Editable Text Output */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => setSampleText(e.currentTarget.textContent || "")}
          className="focus:outline-hidden focus:ring-1 focus:ring-[#c8d400]/40 rounded-[2px] p-1 transition-all select-text"
          style={{
            fontFamily: cssFamily,
            fontSize: `${fontSize}px`,
            fontWeight: selectedWeight,
            lineHeight: 1.25,
            wordBreak: "break-word",
            color: previewWithHeadingColor && headingColor ? headingColor : "#fafbfc",
          }}
        >
          {sampleText}
        </div>

        {/* Pangram Presets Quick Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[#96abbe]/80">
          <span>Vzory:</span>
          {DEFAULT_PANGRAMS.slice(0, 3).map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSampleText(p)}
              className="hover:text-[#c8d400] transition-colors underline decoration-dotted text-[#96abbe]"
            >
              {i === 0 ? "Žltý kôň" : i === 1 ? "Kŕdeľ ďatľov" : "Grófa dcéra"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSampleText("ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789")}
            className="hover:text-[#c8d400] transition-colors underline decoration-dotted text-[#96abbe]"
          >
            Abeceda & Čísla
          </button>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[rgba(63,85,102,0.35)] text-xs">
        {/* CSS font-family & Copy Button */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#96abbe] bg-[#070b0f] px-2 py-1 rounded-[3px] border border-[rgba(63,85,102,0.5)] max-w-full overflow-x-auto">
          <span className="text-[#fafbfc]">{cssFamily}</span>
          <button
            onClick={handleCopyCss}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Kopírovať CSS pravidlo font-family"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* License & Offline Export DRM Status */}
        <div className="flex items-center gap-2">
          {typography.fontSource === "CUSTOM_UPLOAD" && (
            typography.licenseAllowsOfflineDistribution ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[3px]"
                title="Tento font má povolenú distribúciu v offline ZIP balíkoch"
              >
                <ShieldCheck className="w-3 h-3" /> Offline ZIP povolený
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[3px]"
                title="V offline ZIP exporte bude font nahradený systémovým fallbackom (Inter / sans-serif) kvôli ochrane DRM licencií"
              >
                <ShieldAlert className="w-3 h-3" /> Offline Fallback (DRM ochrana)
              </span>
            )
          )}

          {typography.fontSource === "ADOBE_FONTS" && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[3px]"
              title="Adobe Fonts sú chránené DRM. V offline ZIP manuáli sa použije systémový fallback."
            >
              <ShieldAlert className="w-3 h-3" /> Typekit ID: {typography.adobeProjectId}
            </span>
          )}

          {typography.fontSource === "GOOGLE_FONTS" && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-[3px]"
              title="Google Fonts sa načítavajú cez CDN z fonts.googleapis.com"
            >
              <Globe className="w-3 h-3" /> Open Source CDN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
