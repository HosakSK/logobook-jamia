"use client";

import { useState, useTransition, useRef } from "react";
import { BrandAsset, BrandAssetFile } from "@/lib/types/asset";
import { uploadAssetFileAction, deleteAssetFileAction } from "@/actions/assets";
import { ASSET_FILE_FORMATS, AssetFileFormat } from "@/lib/validations/asset";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  X,
  Download,
  Trash2,
  Upload,
  Loader2,
  FileCheck,
  FileText,
  AlertCircle,
  FolderArchive,
  Cloud,
} from "lucide-react";

interface AssetFilesModalProps {
  asset: BrandAsset | null;
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onFilesUpdated: (assetId: string, updatedFiles: BrandAssetFile[]) => void;
}

export function AssetFilesModal({
  asset,
  brandId,
  isOpen,
  onClose,
  onFilesUpdated,
}: AssetFilesModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<AssetFileFormat>("PDF");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !asset) return null;

  const currentFiles = asset.files || [];

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setError("Vyberte súbor na nahratie.");
      return;
    }

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("fileFormat", selectedFormat);
    formData.append("file", fileToUpload);

    startUpload(async () => {
      const res = await uploadAssetFileAction(asset.id, brandId, formData);
      if (res.success && res.file) {
        setSuccess(res.message);
        const updated = [...currentFiles, res.file];
        onFilesUpdated(asset.id, updated);
        setFileToUpload(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setError(res.message);
      }
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Naozaj chcete vymazať tento formát z Cloudflare R2?")) return;
    setError(null);
    setSuccess(null);
    setIsDeletingId(fileId);

    const res = await deleteAssetFileAction(fileId, brandId);
    setIsDeletingId(null);

    if (res.success) {
      setSuccess(res.message);
      const updated = currentFiles.filter((f) => f.id !== fileId);
      onFilesUpdated(asset.id, updated);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(63,85,102,0.4)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#fafbfc] flex items-center gap-2">
              <FolderArchive className="h-4 w-4 text-[#c8d400]" />
              <span>Súbory a exporty loga</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Správa tlačových a bitmapových balíkov v Cloudflare R2 pre toto logo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-400 rounded-[3px] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 text-xs bg-[#c8d400]/15 border border-[#c8d400]/30 text-[#c8d400] rounded-[3px] flex items-center gap-2">
            <FileCheck className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Current Files List */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Nahrané formáty na stiahnutie ({currentFiles.length})
          </Label>

          {currentFiles.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border/40 rounded-[3px] text-xs text-muted-foreground">
              Zatiaľ nie sú nahrané žiadne prídavné súbory (PDF, EPS, AI).
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-[3px] bg-neutral-900 border border-border/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-[2px] bg-neutral-800 text-[#c8d400] font-mono font-bold text-[10px] shrink-0 border border-border/40">
                      {file.fileFormat}
                    </span>
                    <span className="truncate text-foreground font-mono text-[11px]" title={file.file}>
                      {file.file}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-[3px] text-muted-foreground hover:text-foreground"
                    >
                      <a href={file.fileUrl} download target="_blank" rel="noreferrer" title="Stiahnuť">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDeletingId === file.id}
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-7 w-7 p-0 rounded-[3px] text-muted-foreground hover:text-red-400"
                      title="Vymazať z R2"
                    >
                      {isDeletingId === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="pt-4 border-t border-border/30 space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-[#c8d400]" />
            <span className="text-xs font-bold text-foreground">Nahrať nový formát do Cloudflare R2</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Format Selector */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Formát súboru</Label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as AssetFileFormat)}
                className="w-full mt-1.5 h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
              >
                {ASSET_FILE_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input */}
            <div className="col-span-2">
              <Label className="text-[11px] text-muted-foreground">Vyberte súbor</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setFileToUpload(picked);
                  if (picked) {
                    const ext = picked.name.split(".").pop()?.toUpperCase();
                    if (ext === "SVG" || ext === "PDF" || ext === "EPS" || ext === "AI" || ext === "PNG" || ext === "ZIP") {
                      setSelectedFormat(ext as AssetFileFormat);
                    } else if (ext === "JPG" || ext === "JPEG" || ext === "WEBP") {
                      setSelectedFormat("PNG");
                    }
                  }
                }}
                className="w-full mt-1.5 h-9 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-[2px] file:border-0 file:bg-neutral-800 file:text-foreground file:font-semibold text-muted-foreground cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs rounded-[3px] border-border/50"
            >
              Zavrieť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUploading || !fileToUpload}
              className="h-8 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Nahrávam...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3" />
                  <span>Uložiť formát</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
