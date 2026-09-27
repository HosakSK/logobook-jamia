"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaAsset } from "@/lib/types/media";
import { formatBytes } from "@/lib/validations/media";
import {
  FileText,
  Film,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Eye,
  AlertTriangle,
  ImageIcon,
  Sparkles,
  Grid,
} from "lucide-react";

interface MediaCardProps {
  asset: MediaAsset;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (asset: MediaAsset) => void;
  onDelete: (id: string, name: string) => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  IMAGE: { label: "Obrázok", color: "bg-sky-500/10 text-sky-400 border-sky-500/20", icon: ImageIcon },
  ICON: { label: "Ikona / SVG", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Sparkles },
  PATTERN: { label: "Vzor", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: Grid },
  DOCUMENT: { label: "Dokument", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: FileText },
  VIDEO: { label: "Video", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: Film },
  EXTERNAL: { label: "Externý link", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: ExternalLink },
};

export function MediaCard({
  asset,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: MediaCardProps) {
  const [copied, setCopied] = useState(false);
  const typeInfo = TYPE_CONFIG[asset.fileType] || TYPE_CONFIG.DOCUMENT;
  const TypeIcon = typeInfo.icon;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const urlToCopy = asset.fileUrl || asset.externalUrl || "";
      if (urlToCopy) {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const isImageOrVisual =
    (asset.fileType === "IMAGE" || asset.fileType === "ICON" || asset.fileType === "PATTERN") &&
    Boolean(asset.thumbnailUrl || asset.fileUrl);

  return (
    <div
      onClick={() => onToggleSelect(asset.id)}
      className={`group relative bg-card border rounded-[3px] overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
        isSelected
          ? "border-primary ring-1 ring-primary shadow-md bg-primary/5"
          : "border-border/80 hover:border-border hover:shadow-xs"
      }`}
    >
      {/* Top Overlay Bar: Selection Checkbox & Type Badge */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(asset.id);
          }}
          className="pointer-events-auto"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded-[2px] accent-[#c8d400] cursor-pointer shadow-xs transition-transform group-hover:scale-110"
          />
        </div>

        <span
          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] border backdrop-blur-xs font-semibold ${typeInfo.color}`}
        >
          {typeInfo.label}
        </span>
      </div>

      {/* Media Preview Box */}
      <div className="relative w-full aspect-4/3 bg-background/60 flex items-center justify-center overflow-hidden border-b border-border/40">
        {isImageOrVisual ? (
          <div className="relative w-full h-full p-2 flex items-center justify-center">
            {/* Checkerboard subtle pattern for transparency */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:8px_8px]" />
            <img
              src={asset.thumbnailUrl || asset.fileUrl}
              alt={asset.altText || asset.fileName}
              className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
            <TypeIcon className="w-10 h-10 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            <span className="text-[11px] font-mono text-muted-foreground/80 max-w-[140px] truncate">
              {asset.fileName.split(".").pop()?.toUpperCase() || asset.fileType}
            </span>
          </div>
        )}

        {/* Hover Quick Actions Bar */}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
          {asset.fileUrl && (
            <a
              href={asset.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-[3px] bg-background border border-border/80 text-foreground hover:bg-muted transition-colors shadow-xs"
              title="Otvoriť originál v novom okne"
            >
              <Eye className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-[3px] bg-background border border-border/80 text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Kopírovať odkaz na súbor"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(asset);
            }}
            className="p-1.5 rounded-[3px] bg-background border border-border/80 text-foreground hover:bg-muted transition-colors shadow-xs"
            title="Upraviť metadáta (názov, alt text)"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset.id, asset.fileName);
            }}
            className="p-1.5 rounded-[3px] bg-background border border-border/80 text-destructive hover:bg-destructive/10 transition-colors shadow-xs"
            title="Zmazať súbor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="p-3 space-y-1.5 bg-card">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-xs font-medium text-foreground truncate select-text"
            title={asset.fileName}
          >
            {asset.fileName}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {/* File Size or External Indicator */}
          <span>
            {asset.fileSize ? formatBytes(asset.fileSize) : asset.externalUrl ? "Externý odkaz" : "–"}
          </span>

          {/* Alt text status */}
          {asset.fileType === "IMAGE" && (
            asset.altText ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium"
                title={`Alt text: ${asset.altText}`}
              >
                <Check className="w-3 h-3" /> Alt
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-medium"
                title="Chýba popis (Alt text) pre SEO a prístupnosť"
              >
                <AlertTriangle className="w-3 h-3" /> Chýba alt
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
