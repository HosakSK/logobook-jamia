"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  Link as LinkIcon,
  Layers,
} from "lucide-react";
import { getBrandMediaAction, uploadMediaAction } from "@/actions/media";
import { getBrandAssetsAction } from "@/actions/assets";
import { MediaAsset } from "@/lib/types/media";
import { BrandAsset } from "@/lib/types/asset";

export interface SelectedMediaItem {
  id: string;
  url: string;
  fileName: string;
  sourceType: "mediaAsset" | "brandAsset" | "customUrl";
}

interface UniversalMediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  title?: string;
  description?: string;
  currentUrl?: string | null;
  onSelect: (item: SelectedMediaItem) => void;
  acceptedFileTypes?: string; // e.g. "image/*,.ico,.svg"
  allowDirectUrl?: boolean;
  includeBrandLogos?: boolean;
}

export function UniversalMediaPickerModal({
  isOpen,
  onClose,
  brandId,
  title = "Výber grafiky alebo obrázka",
  description = "Vyberte z už nahraných súborov v projekte alebo nahrajte nový súbor.",
  currentUrl,
  onSelect,
  acceptedFileTypes = "image/*,.ico,.svg,.png,.jpg,.jpeg,.webp",
  allowDirectUrl = true,
  includeBrandLogos = true,
}: UniversalMediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "logos" | "url">("library");
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [logoList, setLogoList] = useState<BrandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media & logos on open
  useEffect(() => {
    if (isOpen && brandId) {
      setError(null);
      setIsLoading(true);

      const promises: Promise<any>[] = [getBrandMediaAction(brandId)];
      if (includeBrandLogos) {
        promises.push(getBrandAssetsAction(brandId));
      }

      Promise.all(promises)
        .then(([mediaRes, logosRes]) => {
          if (mediaRes?.success && mediaRes.media) {
            setMediaList(mediaRes.media);
          }
          if (logosRes?.success && logosRes.assets) {
            setLogoList(logosRes.assets);
          }
        })
        .catch((err) => {
          console.error("Failed to load assets in UniversalMediaPickerModal:", err);
          setError("Nepodarilo sa načítať knižnicu súborov.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, brandId, includeBrandLogos]);

  if (!isOpen) return null;

  // Filtered media list
  const filteredMedia = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.fileName && m.fileName.toLowerCase().includes(q)) ||
      (m.altText && m.altText.toLowerCase().includes(q))
    );
  });

  // Filtered logo list
  const filteredLogos = logoList.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameStr = typeof l.name === "object" ? Object.values(l.name).join(" ") : String(l.name);
    return nameStr.toLowerCase().includes(q) || l.medium.toLowerCase().includes(q);
  });

  // Handle direct file upload
  const handleUploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("fileType", file.name.endsWith(".svg") ? "ICON" : "IMAGE");
      formData.append("altText", file.name);

      const res = await uploadMediaAction(brandId, formData);
      if (res.success && res.asset?.fileUrl) {
        const newItem: SelectedMediaItem = {
          id: res.asset.id,
          url: res.asset.fileUrl,
          fileName: res.asset.fileName || file.name,
          sourceType: "mediaAsset",
        };
        onSelect(newItem);
        onClose();
      } else {
        setError(res.message || "Nepodarilo sa nahrať súbor.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "Chyba pri nahrávaní súboru.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    onSelect({
      id: "custom-url",
      url: customUrlInput.trim(),
      fileName: "External Image",
      sourceType: "customUrl",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0 text-[#fafbfc]">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-xl bg-[#0e161d] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(63,85,102,0.4)] bg-[#17212a] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#fafbfc] flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#c8d400]" />
              <span>{title}</span>
            </h2>
            <p className="text-[11px] text-[#96abbe] mt-0.5">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[rgba(63,85,102,0.4)] bg-[#17212a] px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "library"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Nahrané médiá ({mediaList.length})</span>
          </button>

          {includeBrandLogos && (
            <button
              type="button"
              onClick={() => setActiveTab("logos")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "logos"
                  ? "border-[#c8d400] text-[#c8d400]"
                  : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Logá a symboly ({logoList.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Nahrať nový súbor</span>
          </button>

          {allowDirectUrl && (
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "url"
                  ? "border-[#c8d400] text-[#c8d400]"
                  : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Zadať URL</span>
            </button>
          )}
        </div>

        {/* Search bar when viewing lists */}
        {(activeTab === "library" || activeTab === "logos") && (
          <div className="p-3 bg-[#17212a]/50 border-b border-[rgba(63,85,102,0.3)] shrink-0">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#96abbe] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Hľadať v súboroch podľa názvu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#070b0f] border border-[rgba(63,85,102,0.5)] rounded-lg text-[#fafbfc] placeholder:text-[#96abbe] focus:outline-none focus:border-[#c8d400]"
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-950/40 border border-red-500/40 text-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: LIBRARY (mediaAssets) */}
          {activeTab === "library" && (
            <div>
              {isLoading ? (
                <div className="py-16 text-center text-xs text-[#96abbe] flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#c8d400]" />
                  <span>Načítavam nahrané médiá...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-[#17212a] border border-[rgba(63,85,102,0.4)] flex items-center justify-center mx-auto text-[#96abbe]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-[#96abbe]">
                    {searchQuery ? "Nenašli sa žiadne médiá zodpovedajúce filtru." : "V projekte zatiaľ nie sú nahrané žiadne médiá."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#c8d400] text-[#070b0f] rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Nahrať prvý súbor</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredMedia.map((m) => {
                    const isSelected = currentUrl === m.fileUrl;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelect({
                            id: m.id,
                            url: m.fileUrl || "",
                            fileName: m.fileName,
                            sourceType: "mediaAsset",
                          });
                          onClose();
                        }}
                        className={`group relative p-2 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#c8d400]/10 border-[#c8d400] shadow-sm ring-1 ring-[#c8d400]"
                            : "bg-[#17212a] border-[rgba(63,85,102,0.45)] hover:border-[#c8d400]/80 hover:bg-[#1f2c36]"
                        }`}
                      >
                        {/* Thumbnail preview */}
                        <div className="w-full aspect-square rounded-lg bg-[#070b0f] border border-[rgba(63,85,102,0.3)] flex items-center justify-center overflow-hidden p-2">
                          {m.fileUrl ? (
                            <img
                              src={m.fileUrl}
                              alt={m.altText || m.fileName}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <FileText className="h-6 w-6 text-[#96abbe]" />
                          )}
                        </div>

                        {/* Title and metadata */}
                        <div className="mt-2 min-w-0">
                          <span className="text-[11px] font-semibold text-[#fafbfc] block truncate" title={m.fileName}>
                            {m.fileName}
                          </span>
                          <span className="text-[9px] font-mono text-[#96abbe] block uppercase">
                            {m.fileType || "Súbor"}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 p-1 rounded-full bg-[#c8d400] text-[#070b0f]">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOGOS & SYMBOLS (brandAssets) */}
          {activeTab === "logos" && includeBrandLogos && (
            <div>
              {isLoading ? (
                <div className="py-16 text-center text-xs text-[#96abbe] flex flex-col items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#c8d400]" />
                  <span>Načítavam logá značky...</span>
                </div>
              ) : filteredLogos.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#96abbe]">
                  {searchQuery ? "Nenašli sa žiadne logá." : "V sekcii Logá zatiaľ nie sú nahrané žiadne logotypy."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredLogos.map((l) => {
                    const previewSrc = l.previewUrl || l.files.find((f) => f.fileFormat === "SVG")?.fileUrl || "";
                    const isSelected = currentUrl === previewSrc;
                    const displayName = typeof l.name === "object" ? Object.values(l.name)[0] : l.name;

                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          onSelect({
                            id: l.id,
                            url: previewSrc,
                            fileName: displayName || `Logo ${l.orientation}`,
                            sourceType: "brandAsset",
                          });
                          onClose();
                        }}
                        className={`group relative p-2 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#c8d400]/10 border-[#c8d400] shadow-sm ring-1 ring-[#c8d400]"
                            : "bg-[#17212a] border-[rgba(63,85,102,0.45)] hover:border-[#c8d400]/80 hover:bg-[#1f2c36]"
                        }`}
                      >
                        <div className="w-full aspect-square rounded-lg bg-[#070b0f] border border-[rgba(63,85,102,0.3)] flex items-center justify-center overflow-hidden p-2">
                          {previewSrc ? (
                            <img
                              src={previewSrc}
                              alt={displayName}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <Sparkles className="h-6 w-6 text-[#96abbe]" />
                          )}
                        </div>

                        <div className="mt-2 min-w-0">
                          <span className="text-[11px] font-semibold text-[#fafbfc] block truncate" title={displayName}>
                            {displayName}
                          </span>
                          <span className="text-[9px] font-mono text-[#96abbe] block uppercase">
                            {l.medium} · {l.orientation}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 p-1 rounded-full bg-[#c8d400] text-[#070b0f]">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UPLOAD NEW FILE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-[#c8d400] bg-[#c8d400]/10"
                    : "border-[rgba(63,85,102,0.6)] hover:border-[#c8d400]/80 bg-[#17212a]/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFileTypes}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f);
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-[#070b0f] border border-[rgba(63,85,102,0.4)] text-[#c8d400]">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#fafbfc]">
                      {isUploading ? "Nahrávam súbor na Cloudflare R2..." : "Kliknite alebo pretiahnite súbor sem"}
                    </p>
                    <p className="text-xs text-[#96abbe]">
                      Podporované formáty: PNG, SVG, JPG, WEBP, ICO (max. 10 MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT URL */}
          {activeTab === "url" && allowDirectUrl && (
            <form onSubmit={handleCustomUrlSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#fafbfc]">
                  Priama URL adresa obrázka / grafiky
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png alebo /logo/symbol.svg"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#070b0f] border border-[rgba(63,85,102,0.5)] rounded-lg text-[#fafbfc] focus:outline-none focus:border-[#c8d400]"
                  />
                  <button
                    type="submit"
                    disabled={!customUrlInput.trim()}
                    className="px-4 py-2 text-xs font-bold bg-[#c8d400] text-[#070b0f] rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                  >
                    Použiť URL
                  </button>
                </div>
              </div>

              {customUrlInput.trim() && (
                <div className="p-4 rounded-xl bg-[#17212a] border border-[rgba(63,85,102,0.4)] flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#070b0f] border border-[rgba(63,85,102,0.3)] flex items-center justify-center overflow-hidden p-1 shrink-0">
                    <img
                      src={customUrlInput}
                      alt="Náhľad"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-[#fafbfc] block">Náhľad zadanej URL</span>
                    <span className="text-[10px] text-[#96abbe] font-mono block truncate">
                      {customUrlInput}
                    </span>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[rgba(63,85,102,0.4)] bg-[#17212a] flex items-center justify-between text-xs text-[#96abbe] shrink-0">
          <span>Knižnica médií a grafík značky</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[rgba(63,85,102,0.5)] text-[#fafbfc] hover:bg-[#1f2c36] transition-colors cursor-pointer"
          >
            Zatvoriť
          </button>
        </div>
      </div>
    </div>
  );
}
