"use client";

import { useState, useTransition, useMemo } from "react";
import { BrandAsset, BrandAssetFile } from "@/lib/types/asset";
import { deleteBrandAssetAction } from "@/actions/assets";
import { normalizeAndScopeSvg } from "@/lib/utils/svg";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import {
  Copy,
  Check,
  Download,
  FileCode,
  FolderArchive,
  MoreVertical,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Grid,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface AssetCardProps {
  asset: BrandAsset;
  brandId: string;
  locale: string;
  dict: Dictionary;
  onOpenFiles: (asset: BrandAsset) => void;
  onEdit: (asset: BrandAsset) => void;
  onDelete?: (assetId: string) => void;
}

export function AssetCard({
  asset,
  brandId,
  locale,
  dict,
  onOpenFiles,
  onEdit,
  onDelete,
}: AssetCardProps) {
  // Local background toggle: "auto" (from asset.background), "light", "dark", or "checkered"
  const [bgMode, setBgMode] = useState<"auto" | "light" | "dark" | "checkered">("auto");
  const [copied, setCopied] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  // Memoize isolated scoped SVG to eliminate class collisions with other cards
  const scopedSvg = useMemo(() => {
    if (!asset.svgContent) return "";
    return normalizeAndScopeSvg(asset.svgContent, `card_${asset.id}`);
  }, [asset.svgContent, asset.id]);

  // Compute display name based on current locale
  const displayName =
    asset.name[locale] || asset.name.sk || asset.name.en || asset.name.cs || "Nepomenované logo";

  // Compute actual canvas background class
  let canvasBgClass = "";
  const effectiveBg = bgMode === "auto" ? asset.background : bgMode.toUpperCase();

  if (effectiveBg === "LIGHT") {
    canvasBgClass = "bg-white text-neutral-900";
  } else if (effectiveBg === "DARK" || effectiveBg === "INVERSE") {
    canvasBgClass = "bg-[#070b0f] text-white";
  } else if (effectiveBg === "MONOCHROME") {
    canvasBgClass = "bg-neutral-800 text-neutral-100";
  } else {
    // Checkerboard for TRANSPARENT or CHECKERED
    canvasBgClass =
      "bg-neutral-900 text-white [background-image:linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px]";
  }

  // Copy SVG content to clipboard
  const handleCopySvg = async () => {
    if (!asset.svgContent) return;
    try {
      await navigator.clipboard.writeText(asset.svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  // Download SVG directly
  const handleDownloadSvg = () => {
    // If there is an SVG file in asset.files, use its URL
    const svgFile = asset.files.find((f) => f.fileFormat === "SVG");
    if (svgFile?.fileUrl) {
      window.open(svgFile.fileUrl, "_blank");
      return;
    }

    if (!asset.svgContent) return;
    const blob = new Blob([asset.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "logo"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Delete
  const handleDelete = () => {
    if (!confirm(`Naozaj chcete vymazať logo „${displayName}“ a všetky jeho súbory z Cloudflare R2?`)) {
      return;
    }
    setMenuOpen(false);
    startDelete(async () => {
      try {
        const res = await deleteBrandAssetAction(asset.id, brandId);
        if (res.success) {
          onDelete?.(asset.id);
        } else {
          alert(res.message || "Nepodarilo sa vymazať logo.");
        }
      } catch (err: any) {
        console.error("Delete error:", err);
        alert(err.message || "Chyba pri odstraňovaní loga.");
      }
    });
  };

  return (
    <div className="border border-border/40 rounded-[3px] bg-card overflow-hidden flex flex-col justify-between transition-all hover:border-border/80 shadow-xs relative group">
      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#c8d400]" />
          <span className="text-xs font-semibold text-white">Odstraňujem logo...</span>
        </div>
      )}
      {/* 1. Header with title & badges */}
      <div className="p-4 border-b border-border/30 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-foreground truncate font-mono" title={displayName}>
            {displayName}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Medium Badge */}
            <span
              className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold tracking-wider uppercase ${
                asset.medium === "DIGITAL_RGB"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : asset.medium === "PRINT_CMYK"
                  ? "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30"
                  : asset.medium === "PRINT_PANTONE"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : asset.medium === "PRINT_MONOCHROME"
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                  : asset.medium === "PRINT_WB"
                  ? "bg-neutral-500/15 text-neutral-300 border border-neutral-500/30"
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {asset.medium === "DIGITAL_RGB"
                ? "RGB"
                : asset.medium === "PRINT_CMYK"
                ? "CMYK"
                : asset.medium === "PRINT_PANTONE"
                ? "PANTONE"
                : asset.medium === "PRINT_MONOCHROME"
                ? "MONO"
                : asset.medium === "PRINT_WB"
                ? "WB"
                : "UNI"}
            </span>

            {/* Orientation Badge */}
            <span className="px-1.5 py-0.5 rounded-[3px] bg-neutral-800 text-[10px] text-muted-foreground font-mono">
              {asset.orientation === "HORIZONTAL"
                ? "Horizontálne"
                : asset.orientation === "VERTICAL"
                ? "Vertikálne"
                : "Symbol"}
            </span>

            {/* Claim Badge */}
            {asset.hasClaim && (
              <span className="px-1.5 py-0.5 rounded-[3px] bg-[#c8d400]/15 text-[#c8d400] text-[10px] font-mono font-semibold">
                + Slogan
              </span>
            )}
          </div>
        </div>

        {/* Menu & Background controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Background Toggle button */}
          <div className="inline-flex rounded-[3px] bg-neutral-900 border border-border/40 p-0.5">
            <button
              type="button"
              onClick={() => setBgMode("light")}
              title="Svetlé plátno"
              className={`p-1 rounded-[2px] transition-colors ${
                bgMode === "light"
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setBgMode("dark")}
              title="Tmavé plátno"
              className={`p-1 rounded-[2px] transition-colors ${
                bgMode === "dark"
                  ? "bg-[#070b0f] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setBgMode("checkered")}
              title="Priehľadná mriežka"
              className={`p-1 rounded-[2px] transition-colors ${
                bgMode === "checkered"
                  ? "bg-neutral-700 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3 w-3" />
            </button>
          </div>

          {/* Quick Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 rounded-[3px] bg-neutral-950 border border-border/60 shadow-lg py-1 z-30 animate-in fade-in-0"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => onEdit(asset)}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-900 flex items-center gap-2"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                  <span>Upraviť</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenFiles(asset)}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-neutral-900 flex items-center gap-2"
                >
                  <FolderArchive className="h-3 w-3 text-muted-foreground" />
                  <span>Súbory ({asset.files.length})</span>
                </button>
                <div className="my-1 border-t border-border/40" />
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                  <span>Zmazať</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Visual Canvas Area */}
      <div
        className={`h-48 w-full flex items-center justify-center p-6 relative transition-colors ${canvasBgClass}`}
      >
        {scopedSvg ? (
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain drop-shadow-xs"
            dangerouslySetInnerHTML={{ __html: scopedSvg }}
          />
        ) : (
          <div className="text-center text-xs text-muted-foreground">
            <span>Žiadny SVG náhľad</span>
          </div>
        )}

        {/* Floating Quick Action Overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopySvg}
            title="Kopírovať SVG kód do schránky"
            className="p-1.5 rounded-[3px] bg-black/60 hover:bg-black text-white text-xs backdrop-blur-xs transition-colors flex items-center gap-1 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 pr-0.5">Skopírované</span>
              </>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            title="Stiahnuť SVG súbor"
            className="p-1.5 rounded-[3px] bg-black/60 hover:bg-black text-white text-xs backdrop-blur-xs transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Footer: Attached formats & files manager button */}
      <div className="p-3 border-t border-border/30 bg-card/60 flex items-center justify-between gap-2">
        {/* Formats list chips */}
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {asset.files.length === 0 ? (
            <span className="text-[10px] text-muted-foreground italic">Iba inline SVG</span>
          ) : (
            asset.files.map((file) => (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                title={`Stiahnuť ${file.fileFormat} z Cloudflare R2`}
                className="px-1.5 py-0.5 rounded-[2px] bg-neutral-800 hover:bg-neutral-700 text-foreground font-mono text-[9px] font-bold tracking-wider transition-colors flex items-center gap-0.5 border border-border/40"
              >
                <span>{file.fileFormat}</span>
                <Download className="h-2 w-2 opacity-60" />
              </a>
            ))
          )}
        </div>

        {/* Manage files button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenFiles(asset)}
          className="h-7 px-2.5 text-[11px] font-semibold rounded-[3px] border-border/50 hover:border-[#c8d400]/60 hover:text-[#c8d400] transition-colors shrink-0 gap-1"
        >
          <FolderArchive className="h-3 w-3" />
          <span>Súbory ({asset.files.length})</span>
        </Button>
      </div>
    </div>
  );
}
