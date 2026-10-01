"use client";

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { generateOfflineHtml } from "@/lib/export/offline-html-generator";
import { generateBrandCssTheme, generateBrandW3cTokens } from "@/lib/tokens/generator";

export interface UseOfflineExportReturn {
  isExporting: boolean;
  progress: number;
  statusText: string;
  error: string | null;
  startExport: (snapshot: PublishedBrandSnapshot, brandSlug?: string) => Promise<boolean>;
  reset: () => void;
}

interface AssetItem {
  url: string;
  folder: "assets" | "fonts";
  suggestedName: string;
}

/**
 * React Hook for Client-side Offline ZIP Export.
 * Adheres strictly to the architectural constraint: ZERO server-side zipping
 * to protect VPS memory and CPU.
 */
export function useOfflineExport(): UseOfflineExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsExporting(false);
    setProgress(0);
    setStatusText("");
    setError(null);
  }, []);

  const startExport = useCallback(
    async (snapshot: PublishedBrandSnapshot, brandSlug?: string): Promise<boolean> => {
      if (!snapshot || !snapshot.pages || snapshot.pages.length === 0) {
        setError("Brand manuál zatiaľ nemá žiadny publikovaný obsah na export.");
        return false;
      }

      setIsExporting(true);
      setProgress(5);
      setStatusText("Analyzujem štruktúru manuálu a vyhľadávam súbory...");
      setError(null);

      try {
        const zip = new JSZip();
        const effectiveSlug = brandSlug || snapshot.brand.slug || snapshot.brand.id || "brand";
        const brandName = snapshot.brand.name || "Brand";

        // 1. Gather all unique asset URLs across modules and brand metadata
        const assetMap = new Map<string, AssetItem>();

        // Brand header logo & favicon
        if (snapshot.brand.headerLogo) {
          assetMap.set(snapshot.brand.headerLogo, {
            url: snapshot.brand.headerLogo,
            folder: "assets",
            suggestedName: "brand-logo",
          });
        }
        if (snapshot.brand.favicon) {
          assetMap.set(snapshot.brand.favicon, {
            url: snapshot.brand.favicon,
            folder: "assets",
            suggestedName: "brand-favicon",
          });
        }

        // Iterate through all modules and collect URLs
        for (const page of snapshot.pages) {
          for (const container of page.containers || []) {
            for (const col of container.columns || []) {
              for (const mod of col.modules || []) {
                extractModuleAssets(mod, assetMap);
              }
            }
          }
        }

        const assetsToDownload = Array.from(assetMap.values());
        const totalFiles = assetsToDownload.length;
        const urlToLocalPathMap = new Map<string, string>();

        setStatusText(
          totalFiles > 0
            ? `Nájdených ${totalFiles} súborov. Začínam sťahovanie...`
            : "Žiadne externé obrázky neboli nájdené. Generujem HTML..."
        );
        setProgress(10);

        // 2. Controlled parallel downloading (chunks of 4)
        if (totalFiles > 0) {
          const CHUNK_SIZE = 4;
          let completed = 0;

          for (let i = 0; i < totalFiles; i += CHUNK_SIZE) {
            const chunk = assetsToDownload.slice(i, i + CHUNK_SIZE);

            await Promise.all(
              chunk.map(async (item, chunkIdx) => {
                const globalIndex = i + chunkIdx + 1;
                try {
                  const res = await fetch(item.url, { mode: "cors" });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);

                  const blob = await res.blob();
                  const extension = extractExtension(item.url, blob.type);
                  const filename = `${sanitizeFilename(item.suggestedName)}_${globalIndex}${extension}`;
                  const relativePath = `./${item.folder}/${filename}`;

                  zip.folder(item.folder)?.file(filename, blob);
                  urlToLocalPathMap.set(item.url, relativePath);
                } catch (fetchErr) {
                  console.warn(`Could not download asset ${item.url} for offline export:`, fetchErr);
                  // Retain original URL as fallback
                  urlToLocalPathMap.set(item.url, item.url);
                } finally {
                  completed++;
                  const pct = Math.round(10 + (completed / totalFiles) * 65);
                  setProgress(pct);
                  setStatusText(`Sťahujem súbory: ${completed} z ${totalFiles} (${pct}%)...`);
                }
              })
            );
          }
        }

        // 3. Generate Offline HTML
        setProgress(80);
        setStatusText("Generujem samostatnú offline HTML stránku...");
        const html = generateOfflineHtml({
          snapshot,
          urlMap: urlToLocalPathMap,
          locale: snapshot.brand.defaultLocale || "en",
        });
        zip.file("index.html", html);

        // 4. Generate Design Tokens inside ZIP
        setProgress(85);
        setStatusText("Pridávam CSS premenné a W3C Design Tokens...");
        const cssTheme = generateBrandCssTheme({ snapshot });
        const w3cTokens = generateBrandW3cTokens({ snapshot });

        const tokensFolder = zip.folder("tokens");
        tokensFolder?.file("theme.css", cssTheme);
        tokensFolder?.file("tokens.json", JSON.stringify(w3cTokens, null, 2));

        // 5. Add README.txt
        const readmeContent = [
          `=======================================================`,
          `  ${brandName.toUpperCase()} – OFFLINE BRAND MANUÁL`,
          `=======================================================`,
          ``,
          `Verzia: v${snapshot.version}`,
          `Dátum exportu: ${new Date().toLocaleString()}`,
          `Vygenerované cez: Logobook.sk`,
          ``,
          `INŠTRUKCIE PRE POUŽITIE:`,
          `1. Dvakrát kliknite na súbor 'index.html'.`,
          `2. Manuál sa otvorí v ľubovoľnom modernom webovom prehliadači`,
          `   (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge).`,
          `3. Všetky obrázky, logá a štýly sú pribalené lokálne.`,
          `   Manuál funguje plnohodnotne aj bez pripojenia k internetu (USB kľúč, offline archív).`,
          ``,
          `ADRESÁROVÁ ŠTRUKTÚRA:`,
          `- index.html      -> Hlavný interaktívny manuál`,
          `- assets/         -> Lokálne stiahnuté grafické materiály a logá`,
          `- tokens/         -> CSS stylesheet (theme.css) a W3C DTCG tokens.json`,
          ``,
          `© ${new Date().getFullYear()} ${brandName}. Všetky práva vyhradené.`,
        ].join("\n");
        zip.file("README.txt", readmeContent);

        // 6. Compress ZIP Blob with progress tracking
        setProgress(90);
        setStatusText("Komprimujem a vytváram ZIP archív...");

        const zipBlob = await zip.generateAsync(
          {
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
          },
          (metadata) => {
            const compressPct = Math.round(90 + (metadata.percent / 100) * 8);
            setProgress(compressPct);
          }
        );

        // 7. Trigger client-side browser download
        setProgress(100);
        setStatusText("Sťahovanie dokončené!");
        const zipFilename = `${effectiveSlug}-brand-manual-v${snapshot.version}-offline.zip`;
        saveAs(zipBlob, zipFilename);

        setTimeout(() => {
          setIsExporting(false);
        }, 1500);

        return true;
      } catch (err: any) {
        console.error("Offline export failed:", err);
        setError(err.message || "Počas generovania offline archívu nastala chyba.");
        setIsExporting(false);
        return false;
      }
    },
    []
  );

  return {
    isExporting,
    progress,
    statusText,
    error,
    startExport,
    reset,
  };
}

/**
 * Traverses module configurations and registers remote image/file URLs
 */
function extractModuleAssets(module: any, assetMap: Map<string, AssetItem>) {
  if (!module || !module.config) return;
  const cfg = module.config;
  const type = module.moduleType || "";

  const add = (url?: string, name?: string, folder: "assets" | "fonts" = "assets") => {
    if (!url || typeof url !== "string") return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    if (assetMap.has(url)) return;

    assetMap.set(url, {
      url,
      folder,
      suggestedName: name || "asset",
    });
  };

  // M07 Logo Viewer
  if (cfg.assetUrl) add(cfg.assetUrl, "logo-main");
  if (cfg.url) add(cfg.url, "logo");
  if (cfg.downloadUrl) add(cfg.downloadUrl, "logo-download");

  // M10 Gallery
  if (Array.isArray(cfg.images)) {
    cfg.images.forEach((img: any, idx: number) => {
      const u = typeof img === "string" ? img : img?.url || img?.src;
      add(u, `gallery-img-${idx + 1}`);
    });
  }

  // M11 Logo Matrix
  if (Array.isArray(cfg.variants)) {
    cfg.variants.forEach((v: any, idx: number) => {
      add(v?.url || v?.assetUrl, `logo-variant-${idx + 1}`);
    });
  }

  // M19 Patterns
  if (cfg.patternUrl) add(cfg.patternUrl, "pattern-texture");

  // M24 Wallpapers
  if (Array.isArray(cfg.items)) {
    cfg.items.forEach((item: any, idx: number) => {
      add(item?.previewUrl || item?.url, `wallpaper-${idx + 1}`);
    });
  }

  // M25 Icons
  if (Array.isArray(cfg.icons)) {
    cfg.icons.forEach((icon: any, idx: number) => {
      add(icon?.svgUrl || icon?.url, `icon-${icon?.name || idx + 1}`);
    });
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 30);
}

function extractExtension(url: string, mimeType?: string): string {
  try {
    const cleanUrl = url.split("?")[0];
    const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      const ext = match[1].toLowerCase();
      if (["svg", "png", "jpg", "jpeg", "webp", "gif", "woff2", "woff", "pdf"].includes(ext)) {
        return `.${ext}`;
      }
    }
  } catch {
    // fallback
  }

  if (mimeType?.includes("svg")) return ".svg";
  if (mimeType?.includes("png")) return ".png";
  if (mimeType?.includes("webp")) return ".webp";
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return ".jpg";
  if (mimeType?.includes("woff2")) return ".woff2";
  return ".bin";
}
