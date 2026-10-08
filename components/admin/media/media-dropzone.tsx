"use client";

import { useState, useRef, useTransition } from "react";
import { uploadMediaAction, createExternalMediaAction } from "@/actions/media";
import { MediaType } from "@/lib/types/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

interface MediaDropzoneProps {
  brandId: string;
  onUploadComplete: () => void;
  targetFileType?: MediaType;
  acceptedExtensions?: string;
  designerGuideType?: "icons" | "patterns" | "general";
}

interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

export function MediaDropzone({
  brandId,
  onUploadComplete,
  targetFileType,
  acceptedExtensions,
  designerGuideType = "general",
}: MediaDropzoneProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "external">("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // External link form state
  const [extName, setExtName] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [extType, setExtType] = useState<MediaType>(targetFileType || "EXTERNAL");
  const [extAlt, setExtAlt] = useState("");
  const [extError, setExtError] = useState<string | null>(null);
  const [isSubmittingExt, startExtTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      status: "pending",
    }));

    if (newItems.length === 0) return;

    setQueue((prev) => [...prev, ...newItems]);
    processQueue([...queue, ...newItems]);
  };

  // Iterative batch upload
  const processQueue = async (itemsToProcess: UploadQueueItem[]) => {
    if (isUploading) return;
    setIsUploading(true);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      if (item.status === "done" || item.status === "error") continue;

      // Update status to uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q))
      );

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("fileName", item.name);
      if (targetFileType) {
        formData.append("fileType", targetFileType);
      }

      const res = await uploadMediaAction(brandId, formData);

      if (res.success) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q))
        );
      } else {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: "error", errorMessage: res.message }
              : q
          )
        );
      }
    }

    setIsUploading(false);
    onUploadComplete();
  };

  const handleExternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExtError(null);

    if (!extName.trim()) {
      setExtError("Zadajte názov odkazu.");
      return;
    }
    if (!extUrl.trim()) {
      setExtError("Zadajte platnú URL adresu.");
      return;
    }

    startExtTransition(async () => {
      const formData = new FormData();
      formData.append("fileName", extName);
      formData.append("externalUrl", extUrl);
      formData.append("fileType", extType);
      formData.append("altText", extAlt);

      const res = await createExternalMediaAction(brandId, formData);
      if (res.success) {
        setExtName("");
        setExtUrl("");
        setExtAlt("");
        setExtType("EXTERNAL");
        onUploadComplete();
      } else {
        setExtError(res.message);
      }
    });
  };

  const clearDoneQueue = () => {
    setQueue((prev) => prev.filter((q) => q.status !== "done"));
  };

  return (
    <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-5 shadow-xs space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 text-xs rounded-[3px] font-medium transition-colors flex items-center gap-1.5 border ${
              activeTab === "upload"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Hromadné nahrávanie (R2 Storage)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`px-3 py-1.5 text-xs rounded-[3px] font-medium transition-colors flex items-center gap-1.5 border ${
              activeTab === "external"
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Pridať externý link (Google Drive / Dropbox)
          </button>
        </div>

        {queue.length > 0 && activeTab === "upload" && (
          <button
            onClick={clearDoneQueue}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Vyčistiť dokončené
          </button>
        )}
      </div>

      {/* Tab 1: Physical File Upload Dropzone */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[3px] p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-primary bg-primary/10 scale-[0.99]"
                : "border-border/80 bg-background/50 hover:bg-background/80 hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedExtensions || "image/*,.ico,.svg,.png,.jpg,.jpeg,.webp,.pdf,.ai,.eps,.zip"}
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                }
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Presuňte súbory sem alebo kliknite pre výber
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {targetFileType === "ICON"
                  ? "Odporúčame čisté vektorové .SVG ikony (24×24 px). Nahraté ikony sa zaradia do knižnice ikon."
                  : targetFileType === "PATTERN"
                  ? "Podporuje vektorové .SVG vzory aj rastrové PNG/JPG textúry do 50 MB."
                  : "Podporuje JPG, PNG, WebP, SVG, MP4, PDF, PSD, AI, ZIP do 50 MB na súbor."}
              </p>
            </div>
          </div>

          {/* Designer Guide Banner */}
          {designerGuideType === "icons" && (
            <div className="p-4 rounded-[3px] bg-[#070b0f] border border-primary/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span>💡 Návod pre dizajnérov (Figma / Adobe Illustrator):</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px] list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-foreground">Jednofarebná ikona (automaticky prefarbiteľná):</strong> Nakreslite ju čiernou farbou (<code className="text-primary font-mono font-bold">#000000</code>). Nepoužívajte žiadne iné odtiene ani šedú. Logobook ju v celom manuáli automaticky prefarbí podľa brandových farieb.
                </li>
                <li>
                  <strong className="text-foreground">Dvojfarebná ikona (Duotone efekt):</strong> Hlavné línie nakreslite čiernou (<code className="text-primary font-mono font-bold">#000000</code>) so 100% krytím. Jemné výplne nakreslite tiež čiernou, ale s priehľadnosťou (napr. <code className="text-primary font-mono">Opacity 20%</code>).
                </li>
                <li>
                  <strong className="text-foreground">Pestrofarebné / Viacfarebné ikony:</strong> Ak má ikona viacero vlastných farieb (napr. modrá, žltá, červená), po nahratí označte v detaile možnosť <em>„Ponechať pôvodné farby“</em>. Ikona si zachová vaše originálne farby.
                </li>
                <li>
                  <strong className="text-foreground">Plátno a krivky:</strong> Exportujte na štvorcové plátno (odporúčané <code className="text-foreground font-mono">24×24 px</code>) a všetky texty preveďte na krivky (<em>Create Outlines</em>).
                </li>
              </ul>
            </div>
          )}

          {designerGuideType === "patterns" && (
            <div className="p-4 rounded-[3px] bg-[#070b0f] border border-primary/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span>💡 Návod pre dizajnérov na vzory a textúry (Seamless Patterns):</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px] list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-foreground">Dynamicky prefarbiteľný vzor (SVG):</strong> Nakreslite línie alebo geometrické tvary čiernou farbou (<code className="text-primary font-mono font-bold">#000000</code>). V nastaveniach pozadia si budete môcť zvoliť, či má mať vzor Primárnu, Sekundárnu alebo akúkoľvek inú farbu.
                </li>
                <li>
                  <strong className="text-foreground">Opakovateľnosť (Seamless Tile):</strong> Vzor by mal na seba plynule nadväzovať pri opakovaní zľava doprava aj zhora nadol.
                </li>
                <li>
                  <strong className="text-foreground">Priehľadné pozadie:</strong> Vzor exportujte s priehľadným pozadím (Transparent), aby cez neho mohla presvitať brandová farba a voliteľný prechodový gradient.
                </li>
              </ul>
            </div>
          )}

          {/* Active Queue Progress List */}
          {queue.length > 0 && (
            <div className="space-y-2 border border-border/60 rounded-[3px] p-3 bg-background/60">
              <div className="flex items-center justify-between text-xs font-medium pb-2 border-b border-border/40">
                <span>Fronta nahrávania ({queue.filter((q) => q.status === "done").length} / {queue.length})</span>
                {isUploading && (
                  <span className="text-[11px] text-primary flex items-center gap-1 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" /> Nahrávam...
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-xs p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.45)] text-[#fafbfc]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-[#96abbe]" />
                      <span className="truncate font-medium text-[#fafbfc]">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === "pending" && (
                        <span className="text-[10px] text-muted-foreground font-mono">Čaká</span>
                      )}
                      {item.status === "uploading" && (
                        <span className="text-[10px] text-primary font-mono flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Nahráva sa
                        </span>
                      )}
                      {item.status === "done" && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hotovo
                        </span>
                      )}
                      {item.status === "error" && (
                        <span
                          className="text-[10px] text-destructive font-mono flex items-center gap-1"
                          title={item.errorMessage}
                        >
                          <AlertCircle className="w-3 h-3" /> Zlyhalo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: External Link Form (Google Drive, Dropbox, OneDrive) */}
      {activeTab === "external" && (
        <form onSubmit={handleExternalSubmit} className="space-y-4 pt-1">
          {extError && (
            <div className="flex items-start gap-2 p-2.5 rounded-[3px] bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{extError}</span>
            </div>
          )}

          <div className="p-3 rounded-[3px] bg-emerald-500/5 border border-emerald-500/15 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Šetrite kvótu úložiska:</strong> Pre veľké grafické archívy (InDesign, viacgigové PSD) môžete vložiť verejný odkaz na Google Drive, Dropbox alebo OneDrive. V manuáli a Page Builderi bude fungovať ako plnohodnotné tlačidlo na stiahnutie.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="extName" className="text-xs font-medium">
                Zobrazovaný názov súboru <span className="text-destructive">*</span>
              </Label>
              <Input
                id="extName"
                value={extName}
                onChange={(e) => setExtName(e.target.value)}
                placeholder="napr. Brand_Book_Print_CMYK.indd (Google Drive)"
                className="h-9 text-xs rounded-[3px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extUrl" className="text-xs font-medium">
                Verejná URL adresa odkazu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="extUrl"
                type="url"
                value={extUrl}
                onChange={(e) => setExtUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="h-9 text-xs font-mono rounded-[3px]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="extType" className="text-xs font-medium">
                Kategória média
              </Label>
              <select
                id="extType"
                value={extType}
                onChange={(e) => setExtType(e.target.value as MediaType)}
                className="w-full h-9 px-3 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="EXTERNAL">Externý link (Všeobecný)</option>
                <option value="DOCUMENT">Dokument (InDesign, PSD, PDF)</option>
                <option value="VIDEO">Video (Vimeo, YouTube, Drive)</option>
                <option value="IMAGE">Obrázok / Mockup</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extAlt" className="text-xs font-medium">
                Popis / Alt text (Voliteľné)
              </Label>
              <Input
                id="extAlt"
                value={extAlt}
                onChange={(e) => setExtAlt(e.target.value)}
                placeholder="Tlačové dáta brandu s spadávkou 3mm"
                className="h-9 text-xs rounded-[3px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingExt}
              className="text-xs rounded-[3px] gap-2 font-medium"
            >
              {isSubmittingExt && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <ExternalLink className="w-3.5 h-3.5" /> Pridať externý link
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
