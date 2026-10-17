"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBrandFaviconAction, uploadBrandFaviconAction } from "@/actions/brand-settings";
import { toPublicPbUrl } from "@/lib/utils/brand-media";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import {
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  FolderOpen,
  Trash2,
  Upload,
  RefreshCw,
  Palette,
  Maximize2,
  Sliders,
  Globe,
  Layout,
  Smartphone,
  CheckCircle2,
  Layers,
  Pipette,
} from "lucide-react";
import { useColorPickerStore } from "@/lib/store/color-picker-store";
import {
  UniversalMediaPickerModal,
  SelectedMediaItem,
} from "@/components/admin/media/universal-media-picker-modal";

interface BrandColorItem {
  hex: string;
  role?: string;
  name?: string;
}

interface BrandFaviconFormProps {
  brandId: string;
  initialFaviconUrl?: string | null;
  dict: Dictionary;
  brandName?: string;
  brandColors?: BrandColorItem[];
  defaultRadiusMode?: string;
}

type ContainerShape = "squircle" | "circle" | "rounded" | "square" | "transparent";
type SymbolTint = "original" | "white" | "dark" | "primary" | "custom";

export function BrandFaviconForm({
  brandId,
  initialFaviconUrl,
  dict,
  brandName = "Brand",
  brandColors = [],
  defaultRadiusMode = "rounded",
}: BrandFaviconFormProps) {
  const router = useRouter();
  const normalizedInitialFavicon = initialFaviconUrl ? toPublicPbUrl(initialFaviconUrl) : null;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [savedFaviconUrl, setSavedFaviconUrl] = useState<string | null>(normalizedInitialFavicon);

  // Active Mode: "studio" (interactive generator) vs "direct" (direct upload/file link)
  const [mode, setMode] = useState<"studio" | "direct">("studio");

  // Studio Settings
  const primaryBrandColor = brandColors.find((c) => c.role?.toUpperCase() === "PRIMARY")?.hex ||
    brandColors[0]?.hex ||
    "#c8d400";
  const secondaryBrandColor = brandColors.find((c) => c.role?.toUpperCase() === "SECONDARY")?.hex ||
    brandColors[1]?.hex ||
    "#009f80";

  const [sourceSymbolUrl, setSourceSymbolUrl] = useState<string | null>(normalizedInitialFavicon);
  const [rawSvgContent, setRawSvgContent] = useState<string | null>(null);

  const initialShape: ContainerShape =
    defaultRadiusMode === "PILL"
      ? "circle"
      : defaultRadiusMode === "SQUARE"
      ? "square"
      : "squircle";

  const { openColorPicker } = useColorPickerStore();

  const [shape, setShape] = useState<ContainerShape>(initialShape);
  const [bgColor, setBgColor] = useState<string>("#0e161d");
  const [isTransparentBg, setIsTransparentBg] = useState<boolean>(false);
  const [paddingPercent, setPaddingPercent] = useState<number>(20);
  const [iconColorHex, setIconColorHex] = useState<string>(primaryBrandColor || "#ffffff");
  const [isOriginalIconColor, setIsOriginalIconColor] = useState<boolean>(true);

  // Output generated live preview
  const [studioPreviewUrl, setStudioPreviewUrl] = useState<string | null>(initialFaviconUrl || null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Hidden offscreen canvas for rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load SVG content if source is an SVG string or URL
  useEffect(() => {
    if (!sourceSymbolUrl) {
      setRawSvgContent(null);
      return;
    }

    if (sourceSymbolUrl.startsWith("data:image/svg+xml")) {
      try {
        if (sourceSymbolUrl.includes(";base64,")) {
          const base64Part = sourceSymbolUrl.split(";base64,")[1];
          setRawSvgContent(atob(base64Part));
        } else {
          const commaIdx = sourceSymbolUrl.indexOf(",");
          setRawSvgContent(decodeURIComponent(sourceSymbolUrl.slice(commaIdx + 1)));
        }
      } catch {
        setRawSvgContent(null);
      }
      return;
    }

    const isSvgUrl =
      sourceSymbolUrl.toLowerCase().includes(".svg") ||
      sourceSymbolUrl.includes("/api/assets/") ||
      sourceSymbolUrl.includes("/svg");

    if (isSvgUrl) {
      fetch(sourceSymbolUrl)
        .then((res) => {
          if (res.ok) return res.text();
          throw new Error("Failed to load SVG");
        })
        .then((text) => {
          if (text.includes("<svg")) {
            setRawSvgContent(text);
          } else {
            setRawSvgContent(null);
          }
        })
        .catch(() => {
          setRawSvgContent(null);
        });
    } else {
      setRawSvgContent(null);
    }
  }, [sourceSymbolUrl]);

  // Studio Preview Generator:
  // When SVG is available, we generate a 100% pure vector SVG Data URI (no bitmap degradation).
  // When raster PNG is provided, we use the fallback canvas.
  useEffect(() => {
    if (!sourceSymbolUrl) {
      setStudioPreviewUrl(null);
      return;
    }

    // 1. Vector Path: Pure SVG composition without canvas rasterization during editing
    if (rawSvgContent) {
      try {
        const modifiedInnerSvg = !isOriginalIconColor
          ? recolorSvgContent(rawSvgContent, iconColorHex)
          : rawSvgContent;

        const parser = new DOMParser();
        const doc = parser.parseFromString(modifiedInnerSvg, "image/svg+xml");
        const svgEl = doc.querySelector("svg");

        if (svgEl) {
          let viewBox = svgEl.getAttribute("viewBox");
          if (!viewBox) {
            const w = parseFloat(svgEl.getAttribute("width") || "100") || 100;
            const h = parseFloat(svgEl.getAttribute("height") || "100") || 100;
            viewBox = `0 0 ${w} ${h}`;
          }

          let bgShapeSvg = "";
          if (!isTransparentBg && shape !== "transparent") {
            if (shape === "circle") {
              bgShapeSvg = `<circle cx="256" cy="256" r="256" fill="${bgColor}" />`;
            } else if (shape === "squircle") {
              bgShapeSvg = `<rect x="0" y="0" width="512" height="512" rx="115" ry="115" fill="${bgColor}" />`;
            } else if (shape === "rounded") {
              bgShapeSvg = `<rect x="0" y="0" width="512" height="512" rx="56" ry="56" fill="${bgColor}" />`;
            } else {
              bgShapeSvg = `<rect x="0" y="0" width="512" height="512" fill="${bgColor}" />`;
            }
          }

          const padPx = (512 * paddingPercent) / 100;
          const innerSize = Math.max(16, 512 - padPx * 2);
          const offset = padPx;

          const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${bgShapeSvg}<svg x="${offset}" y="${offset}" width="${innerSize}" height="${innerSize}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${svgEl.innerHTML}</svg></svg>`.trim();

          const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(masterSvg)}`;
          setStudioPreviewUrl(svgDataUrl);
          setIsRendering(false);
          return;
        }
      } catch (err) {
        console.warn("Direct vector SVG assembly failed, falling back to canvas:", err);
      }
    }

    // 2. Raster Fallback Path: Canvas for transparent PNG symbols
    let isMounted = true;
    setIsRendering(true);

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsRendering(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!isMounted) return;

      ctx.clearRect(0, 0, 512, 512);

      // 1. Draw Background Shape
      if (!isTransparentBg && shape !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.beginPath();

        if (shape === "circle") {
          ctx.arc(256, 256, 256, 0, Math.PI * 2);
          ctx.fill();
        } else if (shape === "squircle") {
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(0, 0, 512, 512, 115);
          } else {
            drawFallbackRoundRect(ctx, 0, 0, 512, 512, 115);
          }
          ctx.fill();
        } else if (shape === "rounded") {
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(0, 0, 512, 512, 56);
          } else {
            drawFallbackRoundRect(ctx, 0, 0, 512, 512, 56);
          }
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, 512, 512);
        }
      }

      // 2. Draw Symbol Centered with Padding
      const padPx = (512 * paddingPercent) / 100;
      const maxInnerW = Math.max(32, 512 - padPx * 2);
      const maxInnerH = Math.max(32, 512 - padPx * 2);

      const naturalW = img.naturalWidth || img.width || 100;
      const naturalH = img.naturalHeight || img.height || 100;
      const imgRatio = naturalW / naturalH;

      let drawW = maxInnerW;
      let drawH = drawW / imgRatio;

      if (drawH > maxInnerH) {
        drawH = maxInnerH;
        drawW = drawH * imgRatio;
      }

      const drawX = (512 - drawW) / 2;
      const drawY = (512 - drawH) / 2;

      // Draw tinted or original symbol
      if (!isOriginalIconColor) {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = drawW;
        offCanvas.height = drawH;
        const offCtx = offCanvas.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, drawW, drawH);
          offCtx.globalCompositeOperation = "source-in";
          offCtx.fillStyle = iconColorHex;
          offCtx.fillRect(0, 0, drawW, drawH);
          ctx.drawImage(offCanvas, drawX, drawY);
        } else {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
      } else {
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      try {
        const dataUrl = canvas.toDataURL("image/png");
        setStudioPreviewUrl(dataUrl);
      } catch (err) {
        setStudioPreviewUrl(sourceSymbolUrl);
      }

      setIsRendering(false);
    };

    img.onerror = () => {
      setIsRendering(false);
    };

    img.src = sourceSymbolUrl;

    return () => {
      isMounted = false;
    };
  }, [
    sourceSymbolUrl,
    rawSvgContent,
    shape,
    bgColor,
    isTransparentBg,
    paddingPercent,
    isOriginalIconColor,
    iconColorHex,
    primaryBrandColor,
  ]);

  // Helper for roundRect fallback on older rendering engines
  function drawFallbackRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  // Handle media selection from UniversalMediaPickerModal
  const handleMediaSelect = (item: SelectedMediaItem) => {
    setError(null);
    setSourceSymbolUrl(item.url);
    setIsPickerOpen(false);
  };

  // Local file upload into studio (FileReader)
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Súbor symbolu musí mať menej ako 5 MB");
      return;
    }

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text && text.includes("<svg")) {
          setError(null);
          setRawSvgContent(text);
          setSourceSymbolUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`);
        }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setError(null);
          setRawSvgContent(null);
          setSourceSymbolUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    e.target.value = "";
  };

  // Save generated canvas PNG as brand favicon and icon (converts vector to 512x512 PNG only on save)
  const handleSaveStudioIcon = () => {
    setError(null);
    if (!studioPreviewUrl) return;

    startTransition(async () => {
      try {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Chyba inicializácie canvasu.");
          return;
        }

        // Rasterize current master preview (SVG or PNG) onto 512x512 canvas for high-DPI rasterization
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.clearRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                setError("Nepodarilo sa vygenerovať obraz favicony.");
                return;
              }

              const formData = new FormData();
              const file = new File([blob], "brand-favicon.png", { type: "image/png" });
              formData.append("favicon", file);

              const res = await uploadBrandFaviconAction(brandId, formData);
              if (res.success && res.faviconUrl) {
                const cleanUrl = toPublicPbUrl(res.faviconUrl);
                setSavedFaviconUrl(cleanUrl);
                setStudioPreviewUrl(cleanUrl);
                setSuccess(true);
                router.refresh();
                setTimeout(() => setSuccess(false), 4500);
              } else {
                setError(res.error || "Nepodarilo sa uložiť favicon.");
              }
            },
            "image/png",
            1.0
          );
        };

        img.onerror = () => {
          setError("Nepodarilo sa rasterizovať ikonu pre uloženie.");
        };

        img.src = studioPreviewUrl;
      } catch (err: any) {
        console.error("Save icon error:", err);
      }
    });
  };

  // Direct file upload without studio modifications
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Favicon súbor musí mať menej ako 2 MB.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("favicon", file);
      const res = await uploadBrandFaviconAction(brandId, formData);
      if (res.success && res.faviconUrl) {
        const cleanUrl = toPublicPbUrl(res.faviconUrl);
        setSavedFaviconUrl(cleanUrl);
        setStudioPreviewUrl(cleanUrl);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 4500);
      } else {
        setError(res.error || "Nepodarilo sa nahrať súbor faviconu.");
      }
    });
    e.target.value = "";
  };

  // Remove existing favicon
  const handleRemoveFavicon = () => {
    setError(null);
    startTransition(async () => {
      const res = await setBrandFaviconAction(brandId, "");
      if (res.success) {
        setSavedFaviconUrl(null);
        setStudioPreviewUrl(null);
        setSourceSymbolUrl(null);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 4500);
      } else {
        setError(res.error || "Nepodarilo sa odstrániť favicon.");
      }
    });
  };

  const hasUnsavedStudioChanges =
    Boolean(studioPreviewUrl) && studioPreviewUrl !== savedFaviconUrl;

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-2xl bg-[#17212a] text-[#fafbfc] p-6 sm:p-8 shadow-sm space-y-7">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" width={512} height={512} />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg"
        className="hidden"
        onChange={handleLocalFileSelect}
      />
      <input
        ref={directFileInputRef}
        type="file"
        accept=".ico,image/png,image/svg+xml,.png,.ico,.svg"
        className="hidden"
        onChange={handleDirectFileUpload}
      />

      {/* Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(63,85,102,0.4)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#fafbfc]">
              Favicon & Ikona značky
            </h2>
            <span className="text-[10px] font-mono uppercase bg-[#c8d400]/15 text-[#c8d400] border border-[#c8d400]/30 px-2 py-0.5 rounded-full font-bold">
              Studio
            </span>
          </div>
          <p className="text-xs text-[#96abbe] mt-1">
            Vytvorte z loga značky perfektne zarovnanú ikonu pre záložku prehliadača, administráciu a mobilné zariadenia.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#0e161d] p-1 rounded-xl border border-white/[0.08] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("studio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "studio"
                ? "bg-[#c8d400] text-[#070b0f] shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Generátor ikony</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("direct")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "direct"
                ? "bg-[#c8d400] text-[#070b0f] shadow-xs"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Priamy upload</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>Favicon a ikona značky boli úspešne uložené a synchronizované!</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 1: BRAND ICON STUDIO (RECOMMENDED) */}
      {/* ============================================================== */}
      {mode === "studio" && (
        <div className="space-y-8">
          {/* Top Row: Symbol Picker Buttons & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e161d] p-3.5 rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">1. Zdroj symbolu:</span>
              <span className="truncate max-w-[200px] text-xs font-mono text-[#96abbe]">
                {sourceSymbolUrl ? "Symbol vybratý" : "Žiadny symbol"}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                className="cursor-pointer border-[#c8d400]/40 hover:border-[#c8d400] text-xs h-8 text-[#fafbfc]"
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-[#c8d400]" />
                <span>Vybrať z log značky</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-white/20 hover:border-white text-xs h-8 text-[#fafbfc]"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                <span>Nahrať SVG / PNG</span>
              </Button>

              {savedFaviconUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFavicon}
                  disabled={isPending}
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Odstrániť</span>
                </Button>
              )}
            </div>
          </div>

          {/* Center Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Shape of Container */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#96abbe]">
                  Tvar kontajnera (Ikony)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "squircle", label: "Squircle", sub: "App Icon" },
                    { id: "circle", label: "Kruh", sub: "Circle" },
                    { id: "rounded", label: "Zaoblený", sub: "Soft" },
                    { id: "square", label: "Štvorec", sub: "Flat" },
                    { id: "transparent", label: "Bez pozadia", sub: "Symbol" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setShape(s.id as ContainerShape);
                        if (s.id === "transparent") {
                          setIsTransparentBg(true);
                        } else {
                          setIsTransparentBg(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        shape === s.id
                          ? "bg-[#c8d400]/10 border-[#c8d400] text-foreground font-semibold"
                          : "bg-[#0e161d] border-white/[0.08] text-muted-foreground hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-medium">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground">{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Color Selection (Background & Icon) with circular swatch + pipette */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#96abbe]">
                  Farby ikony & pozadia
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Background Color Swatch */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#0e161d]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-[#fafbfc] block">
                        Farba pozadia
                      </span>
                      <span className="text-[11px] font-mono text-[#96abbe]">
                        {isTransparentBg || shape === "transparent" ? "Bez pozadia" : bgColor}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openColorPicker({
                          title: "Farba pozadia ikony",
                          color: isTransparentBg || shape === "transparent" ? "transparent" : bgColor,
                          palette: brandColors.map((c) => ({ name: c.name, role: c.role, hex: c.hex })),
                          allowTransparent: true,
                          onSelect: (selectedHex) => {
                            if (selectedHex === "transparent") {
                              setIsTransparentBg(true);
                              setShape("transparent");
                            } else {
                              setIsTransparentBg(false);
                              if (shape === "transparent") setShape("squircle");
                              setBgColor(selectedHex);
                            }
                          },
                        })
                      }
                      title="Kliknite pre výber farby pozadia"
                      className="group relative h-9 w-9 rounded-full border-2 border-white/20 shadow-md flex items-center justify-center transition-all duration-150 hover:scale-110 hover:border-[#c8d400] cursor-pointer shrink-0"
                      style={{
                        backgroundColor: isTransparentBg || shape === "transparent" ? "transparent" : bgColor,
                      }}
                    >
                      <Pipette className="h-4 w-4 drop-shadow-md text-white group-hover:text-[#c8d400] transition-colors" />
                    </button>
                  </div>

                  {/* Icon / Symbol Color Swatch */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.08] bg-[#0e161d]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-[#fafbfc] block">
                        Farba ikony (SVG)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#96abbe]">
                          {isOriginalIconColor ? "Pôvodné farby" : iconColorHex}
                        </span>
                        {!isOriginalIconColor && (
                          <button
                            type="button"
                            onClick={() => setIsOriginalIconColor(true)}
                            className="text-[10px] text-muted-foreground hover:text-[#c8d400] underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openColorPicker({
                          title: "Farba ikony / symbolu",
                          color: isOriginalIconColor ? "#ffffff" : iconColorHex,
                          palette: brandColors.map((c) => ({ name: c.name, role: c.role, hex: c.hex })),
                          allowTransparent: false,
                          onSelect: (selectedHex) => {
                            setIsOriginalIconColor(false);
                            setIconColorHex(selectedHex);
                          },
                        })
                      }
                      title="Kliknite pre výber farby ikony"
                      className="group relative h-9 w-9 rounded-full border-2 border-white/20 shadow-md flex items-center justify-center transition-all duration-150 hover:scale-110 hover:border-[#c8d400] cursor-pointer shrink-0"
                      style={{
                        backgroundColor: isOriginalIconColor ? "#0e161d" : iconColorHex,
                      }}
                    >
                      <Pipette className="h-4 w-4 drop-shadow-md text-white group-hover:text-[#c8d400] transition-colors" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Padding / Symbol Scale Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#96abbe]">
                    Odsadenie symbolu (Padding)
                  </Label>
                  <span className="text-xs font-mono text-[#c8d400] font-bold">
                    {paddingPercent} %
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-muted-foreground">Plný</span>
                  <input
                    type="range"
                    value={paddingPercent}
                    onChange={(e) => setPaddingPercent(Number(e.target.value))}
                    min={5}
                    max={40}
                    step={1}
                    className="flex-1 cursor-pointer h-2 bg-white/10 rounded-lg accent-[#c8d400]"
                  />
                  <span className="text-[11px] text-muted-foreground">Malý</span>
                </div>
              </div>
            </div>

            {/* Right Side: Live Multi-Context Mockups (5 cols) */}
            <div className="lg:col-span-5 space-y-4 bg-[#0e161d] p-5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-[#c8d400]" />
                  Živý kontextový náhľad
                </span>
                {isRendering && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin text-[#c8d400]" />
                    Generujem...
                  </span>
                )}
              </div>

              {/* Master Studio Preview (128x128) */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative h-32 w-32 rounded-2xl bg-[radial-gradient(#2b3b48_1px,transparent_1px)] [background-size:10px_10px] border border-white/[0.12] flex items-center justify-center p-3 shadow-inner">
                  {studioPreviewUrl ? (
                    <img
                      src={studioPreviewUrl}
                      alt="Favicon master preview"
                      className="h-full w-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground/60 text-xs">
                      <Sparkles className="h-8 w-8 mx-auto mb-1 text-muted-foreground/30" />
                      <span>Zvoľte symbol</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-mono text-muted-foreground mt-2">
                  512 × 512 px High-DPI Master
                </span>
              </div>

              {/* Mockup 1: Browser Tabs (Dark & Light) */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Záložka v prehliadači (Favicon)
                </span>

                {/* Dark Browser Tab */}
                <div className="bg-[#202124] rounded-t-lg border-t border-x border-[#3c4043] px-3 py-1.5 flex items-center gap-2 text-[11px] text-[#e8eaed] shadow-xs">
                  {studioPreviewUrl ? (
                    <img src={studioPreviewUrl} alt="Favicon tab" className="h-4 w-4 object-contain" />
                  ) : (
                    <div className="h-4 w-4 rounded bg-[#c8d400]" />
                  )}
                  <span className="truncate max-w-[130px] font-medium">{brandName} Manual</span>
                  <span className="text-muted-foreground/60 ml-auto text-[10px]">×</span>
                </div>

                {/* Light Browser Tab */}
                <div className="bg-[#dee1e6] rounded-t-lg border-t border-x border-[#bdc1c6] px-3 py-1.5 flex items-center gap-2 text-[11px] text-[#202124] shadow-xs">
                  {studioPreviewUrl ? (
                    <img src={studioPreviewUrl} alt="Favicon tab" className="h-4 w-4 object-contain" />
                  ) : (
                    <div className="h-4 w-4 rounded bg-[#c8d400]" />
                  )}
                  <span className="truncate max-w-[130px] font-medium">{brandName} Manual</span>
                  <span className="text-black/40 ml-auto text-[10px]">×</span>
                </div>
              </div>

              {/* Mockup 2: Admin Sidebar Brand Switcher */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Layout className="h-3 w-3" />
                  Ikona v Admine (Brand Switcher)
                </span>

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03]">
                  {studioPreviewUrl ? (
                    <div className="h-6 w-6 rounded-md bg-[#070b0f] border border-white/[0.12] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <img src={studioPreviewUrl} alt="Brand icon" className="h-full w-full object-contain p-0.5" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-md bg-[#c8d400] text-black font-bold text-[10px] flex items-center justify-center">
                      {brandName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-semibold text-foreground truncate">{brandName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">active project</div>
                  </div>
                </div>
              </div>

              {/* Mockup 3: Mobile Touch Icon */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Mobilná plocha (Touch Icon)
                </span>

                <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/[0.05]">
                  <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-[#070b0f]">
                    {studioPreviewUrl ? (
                      <img src={studioPreviewUrl} alt="App icon" className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-full w-full bg-[#c8d400]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground">{brandName}</div>
                    <div className="text-[10px] text-muted-foreground">PWA & iOS Bookmark</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[rgba(63,85,102,0.3)]">
            <span className="text-xs text-muted-foreground">
              {hasUnsavedStudioChanges ? (
                <span className="text-amber-400 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Máte neuložený vygenerovaný favicon
                </span>
              ) : savedFaviconUrl ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Favicon a ikona sú aktívne a synchronizované
                </span>
              ) : (
                "Zvoľte symbol značky a vygenerujte favicon"
              )}
            </span>

            <Button
              type="button"
              onClick={handleSaveStudioIcon}
              disabled={isPending || !studioPreviewUrl || !hasUnsavedStudioChanges}
              size="default"
              className="bg-[#c8d400] hover:bg-[#b0bc00] text-[#070b0f] font-bold shadow-md cursor-pointer disabled:opacity-50 px-6"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Ukladám a synchronizujem...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <span>Uložiť favicon & ikonu</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: DIRECT UPLOAD / FILE PICKER (TRADITIONAL) */}
      {/* ============================================================== */}
      {mode === "direct" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-[#0e161d] p-6 rounded-2xl border border-white/[0.08]">
            <div className="h-20 w-20 rounded-xl border border-[rgba(63,85,102,0.6)] bg-[#070b0f] flex items-center justify-center overflow-hidden p-3 shadow-sm shrink-0">
              {savedFaviconUrl ? (
                <img src={savedFaviconUrl} alt="Favicon preview" className="h-10 w-10 object-contain" />
              ) : (
                <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              )}
            </div>

            <div className="space-y-2.5 flex-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Priamy súbor faviconu (.ico, .png, .svg)
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nahrajte vopred pripravený súbor priamo z počítača alebo zvoľte z knižnice médií.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={isPending}
                  onClick={() => directFileInputRef.current?.click()}
                  className="shadow-xs cursor-pointer border-[#c8d400]/40 hover:border-[#c8d400] text-[#fafbfc]"
                >
                  <Upload className="h-4 w-4 mr-2 text-[#c8d400]" />
                  <span>Nahrať .ico / .png z počítača</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={isPending}
                  onClick={() => setIsPickerOpen(true)}
                  className="shadow-xs cursor-pointer border-white/20 hover:border-white text-[#fafbfc]"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span>Vybrať z médií projektu</span>
                </Button>

                {savedFaviconUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    disabled={isPending}
                    onClick={handleRemoveFavicon}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Odstrániť</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <UniversalMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        brandId={brandId}
        title="Vybrať symbol značky pre Favicon"
        description="Zvoľte symbol značky, logo alebo ikonu. Štúdio z neho automaticky vygeneruje favicon s vaším pozadím a tvarom."
        currentUrl={sourceSymbolUrl}
        onSelect={handleMediaSelect}
        acceptedFileTypes=".ico,image/png,image/svg+xml,.png,.ico,.svg"
        allowDirectUrl={true}
        includeBrandLogos={true}
      />
    </div>
  );
}

/**
 * Checks if a color is transparent/none or explicitly white (e.g. background cutout)
 */
function isColorWhiteOrNone(colorStr: string): boolean {
  if (!colorStr) return false;
  const c = colorStr.toLowerCase().trim();
  return (
    c === "none" ||
    c === "transparent" ||
    c === "#ffffff" ||
    c === "#fff" ||
    c === "white" ||
    c.startsWith("rgb(255,") ||
    c.startsWith("rgb(255, ") ||
    c.startsWith("rgba(255, 255, 255") ||
    c.startsWith("rgba(255,255,255")
  );
}

/**
 * Accurately recolors SVG artwork elements (paths, strokes, styles, classes) to targetColor.
 * Handles:
 * - Pure black (#000, #000000, black)
 * - Semi-transparent black (rgba(0, 0, 0, x), opacity, fill-opacity) -> resets opacity to solid 1 so color is vibrant
 * - Rich blacks and dark tones (#231F20, #1A171B, #1D1D1B, etc.)
 * - Grey tones produced by flattened vector transparency (#333, #666, #888, #aaa, etc.)
 * - Elements with NO fill attribute (SVG standard defaults to black)
 * - <style> CSS rules with .st0, .cls-1 classes exported by Illustrator / Figma
 * - Preserves transparent fills/strokes and explicitly white cutouts (#ffffff)
 */
function recolorSvgContent(rawSvg: string, targetColor: string): string {
  if (!rawSvg || !targetColor || targetColor === "original") return rawSvg;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return rawSvg;

    // 1. Rewrite <style> tags (CSS rules like .st0, .cls-1 from Illustrator/Figma)
    const styleTags = doc.querySelectorAll("style");
    styleTags.forEach((st) => {
      let css = st.textContent || "";
      // Replace fill in css rules unless white or none
      css = css.replace(/fill\s*:\s*([^;!}]+)/gi, (match, val) => {
        if (isColorWhiteOrNone(val)) return match;
        return `fill: ${targetColor}`;
      });
      // Replace stroke in css rules unless white or none
      css = css.replace(/stroke\s*:\s*([^;!}]+)/gi, (match, val) => {
        if (isColorWhiteOrNone(val)) return match;
        return `stroke: ${targetColor}`;
      });
      // Reset opacity in CSS rules so recolored shapes are solid and vibrant
      css = css.replace(/opacity\s*:\s*([0-9.]+)/gi, "opacity: 1");
      css = css.replace(/fill-opacity\s*:\s*([0-9.]+)/gi, "fill-opacity: 1");
      st.textContent = css;
    });

    // 2. Iterate over all elements (including <g>, path, polygon, rect, circle, ellipse, line, polyline)
    const allElements = svgEl.querySelectorAll("*");
    allElements.forEach((el) => {
      const tagName = el.tagName.toLowerCase();
      // Skip metadata or definition elements
      if (
        tagName === "style" ||
        tagName === "script" ||
        tagName === "defs" ||
        tagName === "clippath" ||
        tagName === "lineargradient" ||
        tagName === "radialgradient"
      ) {
        return;
      }

      const fill = el.getAttribute("fill");
      const stroke = el.getAttribute("stroke");
      const inlineStyle = el.getAttribute("style");

      // A. Replace in inline style attribute
      if (inlineStyle) {
        let updatedStyle = inlineStyle;
        updatedStyle = updatedStyle.replace(/fill\s*:\s*([^;!}]+)/gi, (match, val) => {
          if (isColorWhiteOrNone(val)) return match;
          return `fill: ${targetColor}`;
        });
        updatedStyle = updatedStyle.replace(/stroke\s*:\s*([^;!}]+)/gi, (match, val) => {
          if (isColorWhiteOrNone(val)) return match;
          return `stroke: ${targetColor}`;
        });
        // Normalize opacity
        updatedStyle = updatedStyle.replace(/opacity\s*:\s*([0-9.]+)/gi, "opacity: 1");
        updatedStyle = updatedStyle.replace(/fill-opacity\s*:\s*([0-9.]+)/gi, "fill-opacity: 1");
        el.setAttribute("style", updatedStyle);
      }

      // B. Fill attribute handling
      if (fill !== null) {
        if (!isColorWhiteOrNone(fill)) {
          el.setAttribute("fill", targetColor);
          // Remove opacity attributes so color is solid
          el.removeAttribute("opacity");
          el.removeAttribute("fill-opacity");
        }
      } else {
        // Element has NO fill attribute.
        // In SVG spec, shapes like path, polygon, circle, rect default to black!
        const isShape = ["path", "polygon", "rect", "circle", "ellipse", "line", "polyline"].includes(tagName);
        const hasStyleFill = inlineStyle && inlineStyle.toLowerCase().includes("fill");
        if (isShape && !hasStyleFill) {
          if (stroke && stroke !== "none") {
            // Keep pure stroke element
          } else {
            el.setAttribute("fill", targetColor);
            el.removeAttribute("opacity");
            el.removeAttribute("fill-opacity");
          }
        }
      }

      // C. Stroke attribute handling
      if (stroke !== null) {
        if (!isColorWhiteOrNone(stroke)) {
          el.setAttribute("stroke", targetColor);
          el.removeAttribute("stroke-opacity");
        }
      }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (err) {
    console.error("Failed to recolor SVG DOM:", err);
    return rawSvg;
  }
}

