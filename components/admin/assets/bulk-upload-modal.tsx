"use client";

import { useState, useRef, useTransition } from "react";
import { uploadBrandAssetAction } from "@/actions/assets";
import {
  ASSET_MEDIUMS,
  ASSET_ORIENTATIONS,
  ASSET_BACKGROUNDS,
  AssetMedium,
  AssetOrientation,
  AssetBackground,
} from "@/lib/validations/asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  X,
  Plus,
  Loader2,
  Trash2,
  Sparkles,
  FileCheck2,
  AlertCircle,
  Layers,
  ArrowRight,
} from "lucide-react";

interface QueuedSvgItem {
  id: string;
  file: File;
  name: string;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim: boolean;
  background: AssetBackground;
  svgContent: string;
}

interface BulkUploadModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({
  brandId,
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [queue, setQueue] = useState<QueuedSvgItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process dropped or selected files
  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const newItems: QueuedSvgItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".svg")) {
        continue;
      }

      try {
        const svgText = await file.text();
        const baseName = file.name
          .replace(/\.svg$/i, "")
          .replace(/[-_]/g, " ")
          .trim();

        // Auto heuristic tags from filename
        const lowerName = file.name.toLowerCase();
        let medium: AssetMedium = "UNIVERSAL";
        if (lowerName.includes("cmyk") || lowerName.includes("print")) {
          medium = "PRINT_CMYK";
        } else if (lowerName.includes("rgb") || lowerName.includes("web") || lowerName.includes("screen")) {
          medium = "DIGITAL_RGB";
        }

        let orientation: AssetOrientation = "HORIZONTAL";
        if (lowerName.includes("symbol") || lowerName.includes("mark") || lowerName.includes("icon")) {
          orientation = "SYMBOL";
        } else if (lowerName.includes("vert") || lowerName.includes("stack")) {
          orientation = "VERTICAL";
        }

        let background: AssetBackground = "LIGHT";
        if (lowerName.includes("dark") || lowerName.includes("black")) {
          background = "DARK";
        } else if (lowerName.includes("inverse") || lowerName.includes("inv") || lowerName.includes("white")) {
          background = "INVERSE";
        } else if (lowerName.includes("trans")) {
          background = "TRANSPARENT";
        }

        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: baseName,
          medium,
          orientation,
          hasClaim: orientation === "SYMBOL" ? false : lowerName.includes("claim") || lowerName.includes("slogan"),
          background,
          svgContent: svgText,
        });
      } catch (err) {
        console.error("Failed to read SVG file:", err);
      }
    }

    if (newItems.length === 0) {
      setError("Nevybrali ste žiadne platné .SVG súbory.");
      return;
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const updateItem = (id: string, updates: Partial<QueuedSvgItem>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If orientation was changed to SYMBOL, enforce rule: symbol never has claim
          if (updated.orientation === "SYMBOL") {
            updated.hasClaim = false;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Convert SVG to small PNG thumbnail blob via browser canvas
  const generatePngThumbnail = async (svgText: string): Promise<File | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          // Draw image centered and scaled
          const scale = Math.min(260 / img.width, 260 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (300 - w) / 2;
          const y = (300 - h) / 2;
          ctx.drawImage(img, x, y, w, h);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                resolve(new File([blob], "thumbnail.png", { type: "image/png" }));
              } else {
                resolve(null);
              }
            },
            "image/png",
            0.85
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        img.src = url;
      } catch {
        resolve(null);
      }
    });
  };

  // Upload all items in queue sequentially
  const handleUploadAll = () => {
    if (queue.length === 0) return;
    setError(null);

    startTransition(async () => {
      const total = queue.length;
      for (let i = 0; i < total; i++) {
        const item = queue[i];
        setUploadProgress({
          current: i + 1,
          total,
          currentName: item.name,
        });

        const formData = new FormData();
        formData.append("name", item.name);
        formData.append("medium", item.medium);
        formData.append("orientation", item.orientation);
        formData.append("hasClaim", String(item.hasClaim));
        formData.append("background", item.background);
        formData.append("svgContent", item.svgContent);
        formData.append("svgFile", item.file);

        // Try to generate thumbnail
        const thumbnail = await generatePngThumbnail(item.svgContent);
        if (thumbnail) {
          formData.append("previewFile", thumbnail);
        }

        const res = await uploadBrandAssetAction(brandId, formData);
        if (!res.success) {
          setError(`Chyba pri nahrávaní loga „${item.name}“: ${res.message}`);
          setUploadProgress(null);
          return;
        }
      }

      setUploadProgress(null);
      setQueue([]);
      onSuccess();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[3px] bg-card border border-border/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/30 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#c8d400]" />
              <span>Hromadné nahrávanie vektorových lôg (Bulk Upload)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Presuňte sem viacero SVG súborov naraz a priraďte im vlastnosti pre maticu logotypov.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-950/40 border border-red-500/30 text-red-400 rounded-[3px] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[3px] p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-[#c8d400] bg-[#c8d400]/5"
                : "border-border/60 hover:border-border/90 bg-neutral-950/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".svg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files);
                }
              }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-neutral-900 border border-border/40 text-[#c8d400]">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-xs text-foreground font-semibold">
                Kliknite alebo pretiahnite .SVG súbory sem
              </div>
              <p className="text-[11px] text-muted-foreground">
                Môžete nahrať všetky varianty loga naraz (RGB, CMYK, horizontálne, vertikálne, symboly).
              </p>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">
                  Pripravené na nahratie ({queue.length})
                </span>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="text-red-400 hover:underline text-[11px]"
                >
                  Vyčistiť zoznam
                </button>
              </div>

              <div className="space-y-3">
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-[3px] bg-neutral-900 border border-border/40 flex flex-col md:flex-row items-start md:items-center gap-4 text-xs"
                  >
                    {/* Thumbnail preview */}
                    <div
                      className={`h-20 w-24 rounded-[3px] shrink-0 flex items-center justify-center p-2 border border-border/40 overflow-hidden ${
                        item.background === "LIGHT"
                          ? "bg-white text-black"
                          : item.background === "DARK" || item.background === "INVERSE"
                          ? "bg-[#070b0f] text-white"
                          : "bg-neutral-800 text-white"
                      }`}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: item.svgContent }}
                      />
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
                      {/* Name */}
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label className="text-[10px] text-muted-foreground uppercase font-mono">Názov loga</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="h-8 text-xs mt-1 rounded-[3px] bg-neutral-950 border-border/60"
                        />
                      </div>

                      {/* Medium */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase font-mono">Médium</Label>
                        <select
                          value={item.medium}
                          onChange={(e) => updateItem(item.id, { medium: e.target.value as AssetMedium })}
                          className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                        >
                          <option value="UNIVERSAL">Univerzálne</option>
                          <option value="DIGITAL_RGB">Digitál (RGB)</option>
                          <option value="PRINT_CMYK">Tlač (CMYK)</option>
                        </select>
                      </div>

                      {/* Orientation */}
                      <div>
                        <Label className="text-[10px] text-muted-foreground uppercase font-mono">Orientácia</Label>
                        <select
                          value={item.orientation}
                          onChange={(e) => updateItem(item.id, { orientation: e.target.value as AssetOrientation })}
                          className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                        >
                          <option value="HORIZONTAL">Horizontálne</option>
                          <option value="VERTICAL">Vertikálne</option>
                          <option value="SYMBOL">Symbol / Značka</option>
                        </select>
                      </div>

                      {/* Background & Claim */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-mono">Podklad</Label>
                          <select
                            value={item.background}
                            onChange={(e) => updateItem(item.id, { background: e.target.value as AssetBackground })}
                            className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                          >
                            <option value="LIGHT">Svetlý</option>
                            <option value="DARK">Tmavý</option>
                            <option value="TRANSPARENT">Priehľadný</option>
                            <option value="MONOCHROME">Monochróm</option>
                            <option value="INVERSE">Inverzný</option>
                          </select>
                        </div>

                        <div className="pt-4 shrink-0">
                          <label
                            className={`flex items-center gap-1.5 cursor-pointer text-[11px] ${
                              item.orientation === "SYMBOL"
                                ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                : "text-foreground"
                            }`}
                            title={
                              item.orientation === "SYMBOL"
                                ? "Pravidlo: Symbol nemôže obsahovať slogan/claim"
                                : "Označte, ak logo obsahuje slogan"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={item.hasClaim}
                              disabled={item.orientation === "SYMBOL"}
                              onChange={(e) => updateItem(item.id, { hasClaim: e.target.checked })}
                              className="rounded-[2px] accent-[#c8d400]"
                            />
                            <span>Claim</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-[3px] text-muted-foreground hover:text-red-400 hover:bg-neutral-800 transition-colors self-end md:self-center"
                      title="Odstrániť zo zoznamu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploadProgress && (
            <div className="p-4 rounded-[3px] bg-[#c8d400]/10 border border-[#c8d400]/30 space-y-2 animate-in fade-in-0">
              <div className="flex items-center justify-between text-xs text-foreground font-mono">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c8d400]" />
                  <span>
                    Nahrávam logo {uploadProgress.current} z {uploadProgress.total} do R2...
                  </span>
                </span>
                <span className="font-bold text-[#c8d400] truncate max-w-xs">{uploadProgress.currentName}</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#c8d400] h-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/30 bg-card/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            {queue.length > 0
              ? `${queue.length} ${queue.length === 1 ? "logo pripravené" : "lôg pripravených"} na nahratie.`
              : "Pretiahnite súbory na začatie."}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onClose}
              className="h-9 px-4 text-xs rounded-[3px] border-border/50"
            >
              Zrušiť
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || queue.length === 0}
              onClick={handleUploadAll}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Nahrávam do R2...</span>
                </>
              ) : (
                <>
                  <span>Nahrať všetky logá ({queue.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
