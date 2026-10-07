"use client";

import { useState, useEffect, useTransition } from "react";
import { MediaAsset, MediaType } from "@/lib/types/media";
import { updateMediaMetadataAction } from "@/actions/media";
import { formatBytes } from "@/lib/validations/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Loader2,
  AlertCircle,
  Pencil,
  Copy,
  Check,
  ExternalLink,
  FileText,
  ImageIcon,
} from "lucide-react";

interface MediaEditModalProps {
  asset: MediaAsset | null;
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MediaEditModal({
  asset,
  brandId,
  isOpen,
  onClose,
  onSuccess,
}: MediaEditModalProps) {
  const [fileName, setFileName] = useState(asset?.fileName || "");
  const [fileType, setFileType] = useState<MediaType>(asset?.fileType || "IMAGE");
  const [altText, setAltText] = useState(asset?.altText || "");
  const [externalUrl, setExternalUrl] = useState(asset?.externalUrl || "");
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (asset) {
      setFileName(asset.fileName);
      setFileType(asset.fileType);
      setAltText(asset.altText || "");
      setExternalUrl(asset.externalUrl || "");
    }
    setError(null);
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const handleCopyLink = async () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fileName.trim()) {
      setError("Názov súboru je povinný.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("fileName", fileName.trim());
      formData.append("fileType", fileType);
      formData.append("altText", altText.trim());
      if (externalUrl.trim()) {
        formData.append("externalUrl", externalUrl.trim());
      }

      const res = await updateMediaMetadataAction(brandId, asset.id, formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    });
  };

  const isImageOrVisual =
    (asset.fileType === "IMAGE" || asset.fileType === "ICON" || asset.fileType === "PATTERN") &&
    Boolean(asset.thumbnailUrl || asset.fileUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] rounded-[3px] shadow-2xl p-6 my-8 animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(63,85,102,0.4)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#fafbfc]">Upraviť metadáta média</h2>
              <p className="text-xs text-[#96abbe] truncate max-w-xs">{asset.fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[3px] text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#070b0f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-[3px] bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Thumbnail / File Info Snippet */}
          <div className="flex items-center gap-3.5 p-3 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.45)]">
            <div className="w-16 h-16 rounded-[2px] bg-[#17212a] border border-[rgba(63,85,102,0.6)] flex items-center justify-center shrink-0 overflow-hidden">
              {isImageOrVisual ? (
                <img
                  src={asset.thumbnailUrl || asset.fileUrl}
                  alt={asset.fileName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground/60" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-xs font-semibold text-foreground truncate">{asset.fileName}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{asset.fileSize ? formatBytes(asset.fileSize) : "Externý odkaz"}</span>
                <span>•</span>
                <span className="font-mono uppercase">{asset.fileType}</span>
              </div>
              {asset.fileUrl && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Odkaz skopírovaný" : "Kopírovať odkaz"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-1.5">
            <Label htmlFor="editName" className="text-xs font-medium">
              Názov súboru <span className="text-destructive">*</span>
            </Label>
            <Input
              id="editName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-9 text-xs rounded-[3px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editType" className="text-xs font-medium">
              Typ / Kategória média
            </Label>
            <select
              id="editType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as MediaType)}
              className="w-full h-9 px-3 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="IMAGE">Obrázok (Fotografia, Banner, Mockup)</option>
              <option value="ICON">Ikona / Grafický symbol (SVG)</option>
              <option value="PATTERN">Vzor / Textúra</option>
              <option value="DOCUMENT">Dokument (PDF, PSD, AI, ZIP)</option>
              <option value="VIDEO">Video</option>
              <option value="EXTERNAL">Externý odkaz (Google Drive, Dropbox)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="editAlt" className="text-xs font-medium">
                Popis pre prístupnosť a SEO (Alt text)
              </Label>
              <span className="text-[10px] text-muted-foreground">Odporúčané pre obrázky</span>
            </div>
            <Input
              id="editAlt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Detailný popis obsahu obrázku pre vyhľadávače a čítačky"
              className="h-9 text-xs rounded-[3px]"
            />
          </div>

          {asset.externalUrl && (
            <div className="space-y-1.5">
              <Label htmlFor="editUrl" className="text-xs font-medium">
                Externá URL adresa
              </Label>
              <Input
                id="editUrl"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="h-9 text-xs font-mono rounded-[3px]"
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs rounded-[3px]"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs rounded-[3px] gap-2 font-medium"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Uložiť zmeny
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
