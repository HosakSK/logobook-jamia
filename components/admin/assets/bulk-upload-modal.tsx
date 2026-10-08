"use client";

import { useState, useRef, useTransition } from "react";
import { uploadBrandAssetAction } from "@/actions/assets";
import { normalizeAndScopeSvg } from "@/lib/utils/svg";
import { suggestLogoName } from "@/lib/utils/asset-naming";
import { removeCanvasWhiteBackground } from "@/lib/utils/image";
import {
  ASSET_MEDIUMS,
  ASSET_ORIENTATIONS,
  ASSET_BACKGROUNDS,
  AssetMedium,
  AssetOrientation,
  AssetBackground,
  AssetFileFormat,
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
  FileText,
  FileCode,
  FolderArchive,
  Image as ImageIcon,
} from "lucide-react";

interface QueuedAttachedFile {
  file: File;
  format: AssetFileFormat;
  sizeFormatted: string;
}

interface QueuedLogoItem {
  id: string;
  baseKey: string;
  originalFileName: string;
  name: string;
  nameCustomized?: boolean;
  medium: AssetMedium;
  orientation: AssetOrientation;
  hasClaim: boolean;
  background: AssetBackground;
  svgContent: string;
  svgFile: File | null;
  previewFile?: File | null;
  attachedFiles: QueuedAttachedFile[];
}

interface BulkUploadModalProps {
  brandId: string;
  brandName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function detectFileFormat(fileName: string): AssetFileFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "svg") return "SVG";
  if (ext === "pdf") return "PDF";
  if (ext === "eps") return "EPS";
  if (ext === "ai") return "AI";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "PNG";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "ZIP";
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getBaseKey(fileName: string): string {
  const withoutExt = fileName.replace(/\.[a-zA-Z0-9]+$/i, "");
  return withoutExt.trim().toLowerCase();
}

export function BulkUploadModal({
  brandId,
  brandName = "logobook",
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [queue, setQueue] = useState<QueuedLogoItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters for previewing/inspecting queued items before upload
  const [filterMedium, setFilterMedium] = useState<string>("ALL");
  const [filterOrientation, setFilterOrientation] = useState<string>("ALL");
  const [filterBackground, setFilterBackground] = useState<string>("ALL");
  const [filterSearch, setFilterSearch] = useState<string>("");

  const filteredQueue = queue.filter((item) => {
    if (filterMedium !== "ALL" && item.medium !== filterMedium) return false;
    if (filterOrientation !== "ALL" && item.orientation !== filterOrientation) return false;
    if (filterBackground !== "ALL" && item.background !== filterBackground) return false;
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchFile = item.originalFileName.toLowerCase().includes(q);
      if (!matchName && !matchFile) return false;
    }
    return true;
  });

  if (!isOpen) return null;

  // Process dropped or selected files (supports SVG, PNG, PDF, EPS, AI, ZIP)
  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const incomingFiles = Array.from(files);
    if (incomingFiles.length === 0) return;

    // Group incoming files by their base name (e.g. "Logo_width_RGB" matches .svg, .png, .pdf, .eps, .ai)
    const groups = new Map<string, File[]>();
    for (const file of incomingFiles) {
      const fmt = detectFileFormat(file.name);
      if (!fmt) continue; // Skip unsupported files
      const baseKey = getBaseKey(file.name);
      if (!groups.has(baseKey)) {
        groups.set(baseKey, []);
      }
      groups.get(baseKey)!.push(file);
    }

    if (groups.size === 0) {
      setError("Nevybrali ste žiadne podporované súbory lôg (.SVG, .PNG, .PDF, .EPS, .AI, .ZIP).");
      return;
    }

    setQueue((prevQueue) => {
      const updatedQueue = [...prevQueue];

      for (const [baseKey, groupFiles] of groups.entries()) {
        // Check if an item with this baseKey already exists in the queue
        let existingIndex = updatedQueue.findIndex((item) => item.baseKey === baseKey);

        // Find primary SVG file if present
        const svgFile = groupFiles.find((f) => f.name.toLowerCase().endsWith(".svg")) || null;

        const newAttached: QueuedAttachedFile[] = groupFiles.map((f) => ({
          file: f,
          format: detectFileFormat(f.name) || "ZIP",
          sizeFormatted: formatFileSize(f.size),
        }));

        if (existingIndex >= 0) {
          // Merge into existing item
          const existingItem = updatedQueue[existingIndex];
          const mergedFiles = [...existingItem.attachedFiles];

          for (const att of newAttached) {
            if (!mergedFiles.some((m) => m.file.name === att.file.name)) {
              mergedFiles.push(att);
            }
          }

          updatedQueue[existingIndex] = {
            ...existingItem,
            attachedFiles: mergedFiles,
            svgFile: existingItem.svgFile || svgFile,
          };
        } else {
          // Auto heuristic tags from filename
          const firstFile = groupFiles[0];
          const lowerName = firstFile.name.toLowerCase();

          let medium: AssetMedium = "UNIVERSAL";
          if (lowerName.includes("pantone")) {
            medium = "PRINT_PANTONE";
          } else if (lowerName.includes("cmyk")) {
            medium = "PRINT_CMYK";
          } else if (lowerName.includes("wb") || lowerName.includes("black_white") || lowerName.includes("blackwhite") || lowerName.includes("bw")) {
            medium = "PRINT_WB";
          } else if (lowerName.includes("mono")) {
            medium = "PRINT_MONOCHROME";
          } else if (lowerName.includes("print")) {
            medium = "PRINT_CMYK";
          } else if (lowerName.includes("rgb") || lowerName.includes("web") || lowerName.includes("screen")) {
            medium = "DIGITAL_RGB";
          }

          let orientation: AssetOrientation = "HORIZONTAL";
          if (lowerName.includes("symbol") || lowerName.includes("mark") || lowerName.includes("icon")) {
            orientation = "SYMBOL";
          } else if (lowerName.includes("vert") || lowerName.includes("stack") || lowerName.includes("height")) {
            orientation = "VERTICAL";
          }

          let background: AssetBackground = "LIGHT";
          if (lowerName.includes("dark") || lowerName.includes("_d.") || lowerName.includes("-d.") || lowerName.includes("_d_") || lowerName.includes("black")) {
            background = "DARK";
          } else {
            background = "LIGHT";
          }

          const hasClaim = orientation === "SYMBOL" ? false : lowerName.includes("claim") || lowerName.includes("slogan");

          // Suggest structured name based on parameters
          const suggestedName = suggestLogoName({
            brandName,
            medium,
            orientation,
            hasClaim,
            background,
          });

          const itemId = Math.random().toString(36).substring(2, 9);

          updatedQueue.push({
            id: itemId,
            baseKey,
            originalFileName: firstFile.name,
            name: suggestedName,
            nameCustomized: false,
            medium,
            orientation,
            hasClaim,
            background,
            svgContent: "", // Will be parsed asynchronously
            svgFile,
            attachedFiles: newAttached,
          });
        }
      }

      return updatedQueue;
    });

    // Asynchronously parse SVGs / images / PDFs for preview in queue
    for (const [baseKey, groupFiles] of groups.entries()) {
      const svgFile = groupFiles.find((f) => f.name.toLowerCase().endsWith(".svg"));
      const pngFile = groupFiles.find((f) => /\.(png|jpg|jpeg|webp)$/i.test(f.name));
      const pdfFile = groupFiles.find((f) => f.name.toLowerCase().endsWith(".pdf"));

      if (svgFile) {
        try {
          const text = await svgFile.text();
          const scoped = normalizeAndScopeSvg(text, `bulk_${baseKey.replace(/[^a-z0-9]/g, "")}`);
          setQueue((curr) =>
            curr.map((it) => (it.baseKey === baseKey ? { ...it, svgContent: scoped } : it))
          );
        } catch (err) {
          console.error("Failed to read SVG:", err);
        }
      } else if (pngFile) {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            const rawUrl = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const maxDim = Math.max(img.width, img.height) || 400;
              const scale = Math.min(1, 500 / maxDim);
              const w = Math.floor(img.width * scale);
              const h = Math.floor(img.height * scale);
              const c = document.createElement("canvas");
              c.width = w;
              c.height = h;
              const ctx = c.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(img, 0, 0, w, h);
                removeCanvasWhiteBackground(c);
                const compactUrl = c.toDataURL("image/png");
                c.toBlob((blob) => {
                  const pFile = blob ? new File([blob], "thumbnail.png", { type: "image/png" }) : null;
                  const rasterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><image href="${compactUrl}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" /></svg>`;
                  setQueue((curr) =>
                    curr.map((it) => (it.baseKey === baseKey ? { ...it, svgContent: rasterSvg, previewFile: pFile } : it))
                  );
                }, "image/png");
              }
            };
            img.src = rawUrl;
          };
          reader.readAsDataURL(pngFile);
        } catch (err) {
          console.error("Failed to read PNG preview:", err);
        }
      } else {
        // Fallback document SVG for PDF, EPS, AI, ZIP when no SVG or PNG is present
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" rx="12" fill="#1f2c36" /><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="#c8d400">VECTOR</text><text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#96abbe">${groupFiles[0]?.name.split(".").pop()?.toUpperCase() || "FORMAT"}</text></svg>`;
        setQueue((curr) =>
          curr.map((it) => (it.baseKey === baseKey && !it.svgContent ? { ...it, svgContent: fallbackSvg } : it))
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const updateItem = (id: string, updates: Partial<QueuedLogoItem>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newMedium = updates.medium ?? item.medium;
          const newOrientation = updates.orientation ?? item.orientation;
          const newHasClaim =
            newOrientation === "SYMBOL"
              ? false
              : updates.hasClaim !== undefined
              ? updates.hasClaim
              : item.hasClaim;
          const newBackground = updates.background ?? item.background;

          let newName = updates.name !== undefined ? updates.name : item.name;
          let isCustomized = item.nameCustomized ?? false;

          if (updates.name !== undefined) {
            isCustomized = true;
          } else if (!isCustomized) {
            newName = suggestLogoName({
              brandName,
              medium: newMedium,
              orientation: newOrientation,
              hasClaim: newHasClaim,
              background: newBackground,
            });
          }

          return {
            ...item,
            ...updates,
            medium: newMedium,
            orientation: newOrientation,
            hasClaim: newHasClaim,
            background: newBackground,
            name: newName,
            nameCustomized: isCustomized,
          };
        }
        return item;
      })
    );
  };

  const regenerateItemName = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const generated = suggestLogoName({
            brandName,
            medium: item.medium,
            orientation: item.orientation,
            hasClaim: item.orientation === "SYMBOL" ? false : item.hasClaim,
            background: item.background,
          });
          return {
            ...item,
            name: generated,
            nameCustomized: false,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const removeAttachedFile = (itemId: string, fileName: string) => {
    setQueue((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const remaining = item.attachedFiles.filter((f) => f.file.name !== fileName);
            if (remaining.length === 0) return null;
            return {
              ...item,
              attachedFiles: remaining,
              svgFile: item.svgFile?.name === fileName ? null : item.svgFile,
            };
          }
          return item;
        })
        .filter((item): item is QueuedLogoItem => item !== null)
    );
  };

  // Remove all .AI format files from attachedFiles across all queued logos
  const handleRemoveAllAi = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        attachedFiles: item.attachedFiles.filter((f) => f.format !== "AI"),
      }))
    );
  };

  // Remove attached SVG file from print mediums (PRINT_CMYK, PRINT_PANTONE, PRINT_MONOCHROME, PRINT_WB)
  // Keeps item.svgContent intact so the visual preview remains, but removes SVG from downloadable attachments
  const handleRemoveSvgFromPrint = () => {
    setQueue((prev) =>
      prev.map((item) => {
        const isPrint = item.medium.startsWith("PRINT_");
        if (!isPrint) return item;

        return {
          ...item,
          attachedFiles: item.attachedFiles.filter((f) => f.format !== "SVG"),
          svgFile: null,
        };
      })
    );
  };

  // Convert SVG to small PNG thumbnail blob via browser canvas with timeout
  const generatePngThumbnail = async (svgText: string): Promise<File | null> => {
    if (!svgText) return null;
    return new Promise((resolve) => {
      let isSettled = false;
      const safeResolve = (file: File | null, urlToRevoke?: string) => {
        if (isSettled) return;
        isSettled = true;
        if (urlToRevoke) {
          try {
            URL.revokeObjectURL(urlToRevoke);
          } catch {}
        }
        resolve(file);
      };

      // 3 second safety timeout to avoid hanging the upload
      const timer = setTimeout(() => {
        safeResolve(null);
      }, 3000);

      try {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
              safeResolve(null, url);
              return;
            }

            const scale = Math.min(260 / (img.width || 300), 260 / (img.height || 300));
            const w = (img.width || 300) * scale;
            const h = (img.height || 300) * scale;
            const x = (300 - w) / 2;
            const y = (300 - h) / 2;
            ctx.drawImage(img, x, y, w, h);

            // Strip any white background from SVG rasterization
            removeCanvasWhiteBackground(canvas);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  safeResolve(new File([blob], "thumbnail.png", { type: "image/png" }), url);
                } else {
                  safeResolve(null, url);
                }
              },
              "image/png"
            );
          } catch {
            safeResolve(null, url);
          }
        };

        img.onerror = () => {
          clearTimeout(timer);
          safeResolve(null, url);
        };

        img.src = url;
      } catch {
        clearTimeout(timer);
        safeResolve(null);
      }
    });
  };

  // Upload all items in queue sequentially with all their attached formats
  const handleUploadAll = () => {
    if (queue.length === 0) return;
    setError(null);

    startTransition(async () => {
      try {
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
          formData.append("background", item.background || "LIGHT");
          let contentToSend = item.svgContent || "<svg viewBox='0 0 100 100'></svg>";
          if (contentToSend.length > 400000) {
            contentToSend = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" rx="12" fill="#1f2c36" /><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold" fill="#c8d400">VECTOR</text><text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#96abbe">${item.medium}</text></svg>`;
          }
          formData.append("svgContent", contentToSend);

          // Append all attached format files (file_SVG, file_PNG, file_PDF, file_EPS, file_AI, file_ZIP)
          for (const att of item.attachedFiles) {
            formData.append(`file_${att.format}`, att.file);
          }

          if (item.svgFile) {
            formData.append("svgFile", item.svgFile);
            formData.append("hasRealSvg", "true");
          } else {
            formData.append("hasRealSvg", "false");
          }

          // Append preview thumbnail (prefer direct transparent previewFile, or fallback to generating from svgContent)
          if (item.previewFile) {
            formData.append("previewFile", item.previewFile);
          } else if (item.svgContent) {
            try {
              const thumbnail = await generatePngThumbnail(item.svgContent);
              if (thumbnail) {
                formData.append("previewFile", thumbnail);
              }
            } catch (thumbErr) {
              console.warn("Thumbnail generation skipped due to error:", thumbErr);
            }
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
      } catch (err: any) {
        console.error("Unhanded error in bulk upload:", err);
        setError(`Nastala chyba pri spracovaní nahrávania: ${err?.message || "Nešpecifikovaná chyba spojenia"}`);
        setUploadProgress(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(63,85,102,0.4)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#fafbfc] flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#c8d400]" />
              <span>Hromadné nahrávanie lôg & exportov (Bulk Upload)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Názvy lôg sa automaticky navrhujú podľa zvolených parametrov (napr. <code className="text-[#c8d400] font-mono">logobook_print_cmyk_width_darkbg</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors cursor-pointer"
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
              accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.eps,.ai,.zip"
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
                Kliknite alebo pretiahnite súbory sem (.SVG, .PNG, .PDF, .EPS, .AI, .ZIP)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Môžete nahrať všetky varianty a formáty naraz. Súbory sa zlúčia podľa rovnakého názvu a názov loga sa automaticky navrhne z parametrov.
              </p>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground pb-1">
                <span className="font-semibold uppercase tracking-wider font-mono">
                  Pripravené na nahratie ({queue.length})
                  {filteredQueue.length !== queue.length && (
                    <span className="text-[#c8d400] normal-case font-normal ml-1">
                      (zobrazených {filteredQueue.length})
                    </span>
                  )}
                </span>

                {/* Bulk cleanup actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAllAi}
                    className="h-6 px-2 text-[10px] font-mono border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/60 rounded-[2px]"
                    title="Odstráni súbory .AI zo všetkých položiek na nahratie (klientom zostane EPS a PDF)"
                  >
                    Odstrániť všetky .AI
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveSvgFromPrint}
                    className="h-6 px-2 text-[10px] font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/60 rounded-[2px]"
                    title="Odstráni priložený .SVG súbor z tlačových formátov (CMYK/Pantone/Mono/WB). Vizuálny náhľad zostane zachovaný."
                  >
                    Odstrániť SVG z tlačových formátov
                  </Button>

                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-red-400 hover:underline text-[11px] cursor-pointer ml-1"
                  >
                    Vyčistiť zoznam
                  </button>
                </div>
              </div>

              {/* Filter controls toolbar */}
              <div className="p-2.5 rounded-[3px] bg-neutral-950/70 border border-border/50 flex flex-wrap items-center gap-2.5 text-xs">
                {/* Search input */}
                <div className="flex-1 min-w-[140px]">
                  <Input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Filtrovať podľa názvu súboru..."
                    className="h-7 text-xs bg-neutral-900 border-border/60"
                  />
                </div>

                {/* Medium Filter Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground mr-1">Médium:</span>
                  {[
                    { id: "ALL", label: "Všetky" },
                    { id: "CMYK", label: "CMYK" },
                    { id: "RGB", label: "RGB" },
                    { id: "PANTONE", label: "Pantone" },
                    { id: "MONO_BLACK", label: "Čiernobiele" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setFilterMedium(btn.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-[2px] transition-colors cursor-pointer border ${
                        filterMedium === btn.id
                          ? "bg-primary text-black font-bold border-primary"
                          : "bg-neutral-900 text-neutral-300 hover:text-white border-border/40 hover:border-border"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Orientation Filter Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground mr-1">Orientácia:</span>
                  {[
                    { id: "ALL", label: "Všetky" },
                    { id: "HORIZONTAL", label: "Šírka" },
                    { id: "VERTICAL", label: "Výška" },
                    { id: "SYMBOL", label: "Symbol" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setFilterOrientation(btn.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-[2px] transition-colors cursor-pointer border ${
                        filterOrientation === btn.id
                          ? "bg-primary text-black font-bold border-primary"
                          : "bg-neutral-900 text-neutral-300 hover:text-white border-border/40 hover:border-border"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Background Filter Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-mono text-muted-foreground mr-1">Podklad:</span>
                  {[
                    { id: "ALL", label: "Všetky" },
                    { id: "LIGHT", label: "Svetlý" },
                    { id: "DARK", label: "Tmavý" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setFilterBackground(btn.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-[2px] transition-colors cursor-pointer border ${
                        filterBackground === btn.id
                          ? "bg-primary text-black font-bold border-primary"
                          : "bg-neutral-900 text-neutral-300 hover:text-white border-border/40 hover:border-border"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Clear all filters */}
                {(filterMedium !== "ALL" ||
                  filterOrientation !== "ALL" ||
                  filterBackground !== "ALL" ||
                  filterSearch.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMedium("ALL");
                      setFilterOrientation("ALL");
                      setFilterBackground("ALL");
                      setFilterSearch("");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-white underline cursor-pointer ml-auto"
                  >
                    Zrušiť filtre
                  </button>
                )}
              </div>

              {filteredQueue.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-neutral-900/50 rounded-[3px] border border-border/30">
                  Žiadne položky nezodpovedajú zvoleným filtrom.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-[3px] bg-neutral-900 border border-border/40 flex flex-col gap-3 text-xs shadow-xs"
                  >
                    {/* Top banner: Original Source File Name without truncation */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/30 bg-neutral-950/50 -mx-4 -mt-4 px-4 py-2 rounded-t-[3px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c8d400] font-mono shrink-0 flex items-center gap-1.5">
                          <FileCode className="h-3.5 w-3.5" />
                          Pôvodný súbor:
                        </span>
                        <span className="font-mono text-xs text-neutral-100 font-semibold break-all select-all">
                          {item.originalFileName || item.attachedFiles[0]?.file.name}
                        </span>
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-[3px] text-muted-foreground hover:text-red-400 hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                        title="Odstrániť toto logo zo zoznamu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-1">
                      {/* Thumbnail preview with solid color matching intended background */}
                      <div
                        className={`h-22 w-28 rounded-[3px] shrink-0 flex items-center justify-center p-2 border border-border/40 overflow-hidden transition-colors ${
                          item.background === "DARK"
                            ? "bg-[#070b0f] text-white"
                            : "bg-white text-black"
                        }`}
                      >
                        {item.svgContent ? (
                          <div
                            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:object-contain"
                            dangerouslySetInnerHTML={{ __html: item.svgContent }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-[9px] font-mono">Nahrávam...</span>
                          </div>
                        )}
                      </div>

                      {/* Form fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1 w-full">
                        {/* Name (Navrhnutý názov) - span 2 */}
                        <div className="sm:col-span-2 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-muted-foreground uppercase font-mono">Navrhnutý názov loga</Label>
                            <button
                              type="button"
                              onClick={() => regenerateItemName(item.id)}
                              className="text-[10px] text-[#c8d400] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                              title="Vygenerovať názov automaticky z parametrov"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Prepočítať</span>
                            </button>
                          </div>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value, nameCustomized: true })}
                            className="h-8 text-xs mt-1 rounded-[3px] bg-neutral-950 border-border/60 font-mono text-[#c8d400]"
                          />
                        </div>

                        {/* Medium */}
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-mono">Médium</Label>
                          <select
                            value={item.medium}
                            onChange={(e) => updateItem(item.id, { medium: e.target.value as AssetMedium })}
                            className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                          >
                            <option value="PRINT_CMYK">Tlač (CMYK)</option>
                            <option value="PRINT_PANTONE">Tlač (Pantone)</option>
                            <option value="PRINT_MONOCHROME">Tlač (Monochróm)</option>
                            <option value="PRINT_WB">Tlač (Čiernobiela / WB)</option>
                            <option value="DIGITAL_RGB">Digitál (RGB)</option>
                            <option value="UNIVERSAL">Univerzálne</option>
                          </select>
                        </div>

                        {/* Orientation */}
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label className="text-[10px] text-muted-foreground uppercase font-mono">Orientácia</Label>
                          <select
                            value={item.orientation}
                            onChange={(e) => updateItem(item.id, { orientation: e.target.value as AssetOrientation })}
                            className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                          >
                            <option value="HORIZONTAL">Horizontálne (width)</option>
                            <option value="VERTICAL">Vertikálne (height)</option>
                            <option value="SYMBOL">Symbol / Značka</option>
                          </select>
                        </div>

                        {/* Background & Claim */}
                        <div className="sm:col-span-1 lg:col-span-1 flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground uppercase font-mono">Podklad</Label>
                            <select
                              value={item.background}
                              onChange={(e) => updateItem(item.id, { background: e.target.value as AssetBackground })}
                              className="w-full mt-1 h-8 rounded-[3px] bg-neutral-950 border border-border/60 text-xs px-2 text-foreground focus:outline-hidden focus:border-[#c8d400]"
                            >
                              <option value="LIGHT">Svetlý (lightbg)</option>
                              <option value="DARK">Tmavý (darkbg)</option>
                            </select>
                          </div>

                          <div className="pt-4 shrink-0">
                            <label
                              className={`flex items-center gap-1 cursor-pointer text-[11px] ${
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
                    </div>

                    {/* Merged formats note & chips with full unshortened filenames */}
                    <div className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 bg-neutral-950/40 p-2 rounded-[2px]">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                          <FolderArchive className="h-3.5 w-3.5 text-[#c8d400]" />
                          {item.attachedFiles.length > 1 ? (
                            <span>
                              Zlúčených <strong className="text-[#c8d400]">{item.attachedFiles.length} súborov</strong>:
                            </span>
                          ) : (
                            <span>Priradený súbor:</span>
                          )}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.attachedFiles.map((att) => (
                            <span
                              key={att.file.name}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-neutral-800 border border-border/60 text-[10px] font-mono text-foreground"
                              title={att.file.name}
                            >
                              <span className="font-bold text-[#c8d400]">{att.format}</span>
                              <span className="text-neutral-200 select-all break-all">{att.file.name}</span>
                              <span className="text-muted-foreground text-[9px] shrink-0">({att.sizeFormatted})</span>
                              {item.attachedFiles.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeAttachedFile(item.id, att.file.name)}
                                  className="text-muted-foreground hover:text-red-400 ml-0.5 cursor-pointer shrink-0"
                                  title={`Odstrániť formát ${att.format}`}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      <span className="text-[10px] text-muted-foreground italic shrink-0">
                        Všetky formáty sa nahrajú do R2
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        <div className="p-5 border-t border-[rgba(63,85,102,0.4)] bg-[#17212a] text-[#fafbfc] flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            {queue.length > 0
              ? `${queue.length} ${queue.length === 1 ? "logo pripravené" : "lôg pripravených"} na nahratie (spolu ${queue.reduce((acc, it) => acc + it.attachedFiles.length, 0)} súborov).`
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
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors cursor-pointer"
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
