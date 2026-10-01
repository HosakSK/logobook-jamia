import { PublishedBrandSnapshot } from "@/actions/publish";
import { BrandCascadeTokens } from "@/lib/types/module";
import { generateTonalSteps, hexToRgb } from "@/lib/utils/color-calc";

export interface AiContextGenerationInput {
  snapshot: PublishedBrandSnapshot;
  cascadeTokens?: BrandCascadeTokens | null;
  appBaseUrl?: string;
}

interface ExtractedAsset {
  label: string;
  format: string;
  url: string;
  description?: string;
}

interface ExtractedRule {
  type: "do" | "dont" | "warning";
  title: string;
  description?: string;
}

/**
 * Normalizes text from multilingual record or string.
 */
function resolveText(
  val: string | Record<string, string> | undefined | null,
  preferredLocales = ["en", "sk", "cs"]
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  for (const loc of preferredLocales) {
    if (val[loc] && typeof val[loc] === "string" && val[loc].trim().length > 0) {
      return val[loc].trim();
    }
  }
  const first = Object.values(val)[0];
  return typeof first === "string" ? first.trim() : "";
}

/**
 * Normalizes a URL to be absolute if an appBaseUrl is available.
 */
function toAbsoluteUrl(url: string | undefined | null, appBaseUrl: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed;
  }
  const base = appBaseUrl.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/**
 * Formats a HEX color and its RGB representation.
 */
function formatColorWithRgb(hex: string): string {
  const cleanHex = hex.toUpperCase();
  const rgb = hexToRgb(cleanHex);
  if (!rgb) return `\`${cleanHex}\``;
  return `\`${cleanHex}\` (RGB: \`${rgb.r}, ${rgb.g}, ${rgb.b}\`)`;
}

/**
 * Generates structured, prompt-ready Markdown for AI LLMs (ChatGPT, Claude, Cursor, Copilot).
 * Conforms to modern AI context standards (llms.txt / ai.md).
 */
export function generateBrandAiContext(input: AiContextGenerationInput): string {
  const { snapshot, cascadeTokens, appBaseUrl = "https://logobook.sk" } = input;
  const brand = snapshot.brand || { name: "Brand", slug: "brand" };
  const brandName = brand.name || "Brand";
  const slug = brand.slug || brand.id || "brand";
  const version = snapshot.version || 1;
  const publishedAt = snapshot.publishedAt || new Date().toISOString();
  const manualUrl = `${appBaseUrl.replace(/\/$/, "")}/m/${slug}`;

  // 1. Resolve Colors
  const primary = cascadeTokens?.colors.primary || "#c8d400";
  const secondary = cascadeTokens?.colors.secondary || "#17212a";
  const accent = cascadeTokens?.colors.accent || "#009f80";
  const neutral = cascadeTokens?.colors.neutral || "#fafbfc";

  const success = cascadeTokens?.colors.success || "#10b981";
  const warning = cascadeTokens?.colors.warning || "#f59e0b";
  const danger = cascadeTokens?.colors.danger || "#bb4934";
  const info = cascadeTokens?.colors.info || "#3b82f6";

  const customColors = (cascadeTokens?.palette || []).filter(
    (c) => !["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL"].includes(c.role?.toUpperCase())
  );

  const tonalSteps = generateTonalSteps(primary);

  // 2. Resolve Typography & Shapes
  const headingFont =
    cascadeTokens?.typography?.headingFontFamily ||
    '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const bodyFont =
    cascadeTokens?.typography?.bodyFontFamily ||
    '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

  const radius = cascadeTokens?.radius || "3px";
  const borderWidth = cascadeTokens?.borderWidth || "1px";

  // 3. Scan Snapshot Pages for Assets and Rules
  const extractedAssets: ExtractedAsset[] = [];
  const extractedRules: ExtractedRule[] = [];
  const seenAssetUrls = new Set<string>();

  // Add header logo and favicon if available
  if (brand.headerLogo) {
    const absUrl = toAbsoluteUrl(brand.headerLogo, appBaseUrl);
    if (!seenAssetUrls.has(absUrl)) {
      seenAssetUrls.add(absUrl);
      extractedAssets.push({
        label: "Official Brand Header Logo",
        format: absUrl.toLowerCase().endsWith(".svg") ? "SVG" : "Image",
        url: absUrl,
      });
    }
  }

  if (brand.favicon) {
    const absUrl = toAbsoluteUrl(brand.favicon, appBaseUrl);
    if (!seenAssetUrls.has(absUrl)) {
      seenAssetUrls.add(absUrl);
      extractedAssets.push({
        label: "Favicon / App Icon",
        format: "Icon",
        url: absUrl,
      });
    }
  }

  if (snapshot.pages && Array.isArray(snapshot.pages)) {
    for (const page of snapshot.pages) {
      if (!page.containers) continue;
      for (const container of page.containers) {
        if (!container.columns) continue;
        for (const col of container.columns) {
          if (!col.modules) continue;
          for (const mod of col.modules) {
            const mType = (mod.moduleType || "").toUpperCase();
            const cfg = mod.config || {};

            // M07: Logo / Asset Viewer
            if (
              mType.includes("M07") ||
              mType.includes("LOGO_VIEWER") ||
              mType.includes("ASSET_VIEWER")
            ) {
              const dp = cfg.directPreview as any;
              if (dp?.svgUrl) {
                const abs = toAbsoluteUrl(dp.svgUrl, appBaseUrl);
                if (!seenAssetUrls.has(abs)) {
                  seenAssetUrls.add(abs);
                  extractedAssets.push({
                    label: `${resolveText(mod.h3Title) || "Vector Logo"} (SVG)`,
                    format: "SVG",
                    url: abs,
                  });
                }
              }

              if (Array.isArray(cfg.formats)) {
                for (const fmt of cfg.formats) {
                  if (fmt?.url) {
                    const abs = toAbsoluteUrl(fmt.url, appBaseUrl);
                    if (!seenAssetUrls.has(abs)) {
                      seenAssetUrls.add(abs);
                      extractedAssets.push({
                        label: fmt.fileName || `${resolveText(mod.h3Title) || "Brand Asset"} (${fmt.format || "File"})`,
                        format: fmt.format || "FILE",
                        url: abs,
                        description: resolveText(fmt.customDescription),
                      });
                    }
                  }
                }
              }
            }

            // M11: Logo Matrix
            if (mType.includes("M11") || mType.includes("LOGO_MATRIX")) {
              if (Array.isArray(cfg.logos)) {
                for (const l of cfg.logos) {
                  if (l?.fileUrl || l?.svgUrl) {
                    const url = l.svgUrl || l.fileUrl;
                    const abs = toAbsoluteUrl(url, appBaseUrl);
                    if (!seenAssetUrls.has(abs)) {
                      seenAssetUrls.add(abs);
                      extractedAssets.push({
                        label: l.name || l.variant || "Logo Variant",
                        format: abs.toLowerCase().endsWith(".svg") ? "SVG" : "Image",
                        url: abs,
                      });
                    }
                  }
                }
              }
            }

            // M20: Do's and Don'ts
            if (mType.includes("M20") || mType.includes("DOS_AND_DONTS")) {
              if (Array.isArray(cfg.items)) {
                for (const item of cfg.items) {
                  const t = (item.type || "dont").toLowerCase() as "do" | "dont" | "warning";
                  const title = resolveText(item.title);
                  const desc = resolveText(item.description);
                  if (title) {
                    extractedRules.push({
                      type: t,
                      title,
                      description: desc,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Fallback integrity rules if no M20 modules were found
  if (extractedRules.length === 0) {
    extractedRules.push(
      {
        type: "do",
        title: "Maintain Clear Space",
        description: "Always preserve a clear protective zone around the logo equal to the symbol height.",
      },
      {
        type: "do",
        title: "High Contrast Readability",
        description: "Always ensure WCAG AA compliant contrast ratio (minimum 4.5:1) between foreground text/logos and backgrounds.",
      },
      {
        type: "do",
        title: "Consistent Corner Radius",
        description: `Apply the brand border-radius standard of ${radius} to all UI buttons, cards, tags, and inputs.`,
      },
      {
        type: "dont",
        title: "Do Not Distort Logo",
        description: "Never stretch, squash, skew, rotate, or alter the aspect ratio of the brand logo or icon.",
      },
      {
        type: "dont",
        title: "Do Not Alter Brand Colors",
        description: "Never apply unapproved colors, custom gradients, drop shadows, or decorative outlines to the logo.",
      },
      {
        type: "dont",
        title: "Do Not Place on Busy Backgrounds",
        description: "Never place the logo on low-contrast, visually noisy, or unapproved pattern backgrounds.",
      }
    );
  }

  const doRules = extractedRules.filter((r) => r.type === "do");
  const dontRules = extractedRules.filter((r) => r.type === "dont");
  const warningRules = extractedRules.filter((r) => r.type === "warning");

  // 4. Assemble the Markdown Document
  const doc: string[] = [
    `# Vizuálna identita a dizajn systém: ${brandName}`,
    ``,
    `> **System Prompt & LLM Instructions (ChatGPT, Claude, Cursor, GitHub Copilot):**`,
    `> Tento dokument definuje oficiálne vizuálne a dizajnové pravidlá značky **${brandName}**.`,
    `> Pri generovaní kódu (React, Next.js, HTML, CSS, Tailwind CSS), grafických rozhraní, UI komponentov`,
    `> a marketingových textov VŽDY striktne dodržiavaj nasledujúce farby, typografiu, rozmery a pravidlá integrity.`,
    ``,
    `---`,
    ``,
    `## 1. Základné informácie o značke`,
    `- **Názov značky:** ${brandName}`,
    `- **Identifikátor (Slug):** \`${slug}\``,
    `- **Online Brand Manuál:** [${manualUrl}](${manualUrl})`,
    `- **Verzia manuálu:** v${version} (Publikované: ${publishedAt.split("T")[0]})`,
    brand.description ? `- **Popis značky:** ${resolveText(brand.description)}` : "",
    ``,
    `---`,
    ``,
    `## 2. Farebná Paleta (Brand Colors)`,
    ``,
    `### Kľúčové identitné farby (Core Palette)`,
    `- **Primary (Hlavná farba):** ${formatColorWithRgb(primary)} — dominantný akcent, hlavné CTA tlačidlá, primárne prvky identity.`,
    `- **Secondary (Sekundárna farba):** ${formatColorWithRgb(secondary)} — tmavé pozadia, navigačné lišty, hlboký kontrast.`,
    `- **Accent (Doplnkový akcent):** ${formatColorWithRgb(accent)} — jemné zvýraznenia, badges, interaktívne stavy.`,
    `- **Neutral (Neutrálne pozadia a text):** ${formatColorWithRgb(neutral)} — plochy stránok, kartičky, kontrastný text.`,
    ``,
    `### Sémantické farby používateľského rozhrania (UI Semantics)`,
    `- **Success (Úspech):** ${formatColorWithRgb(success)}`,
    `- **Warning (Upozornenie):** ${formatColorWithRgb(warning)}`,
    `- **Danger / Error (Chyba):** ${formatColorWithRgb(danger)}`,
    `- **Info (Informačné hlásenia):** ${formatColorWithRgb(info)}`,
  ];

  if (customColors.length > 0) {
    doc.push(``, `### Doplnkové farby značky`);
    for (const c of customColors) {
      doc.push(`- **${c.name || c.role}:** ${formatColorWithRgb(c.hex)}`);
    }
  }

  doc.push(
    ``,
    `### Primárna tonálna škála (Primary Tonal Steps)`
  );
  for (const item of tonalSteps) {
    const isBase = item.step === 500 ? " (Base)" : "";
    doc.push(`- \`primary-${item.step}\`${isBase}: ${formatColorWithRgb(item.hex)}`);
  }

  doc.push(
    ``,
    `---`,
    ``,
    `## 3. Typografia (Typography)`,
    ``,
    `### Nadpisy (Headings)`,
    `- **Font Family:** \`${headingFont}\``,
    `- **Odporúčané rezy (Weights):** \`600\` (SemiBold), \`800\` (ExtraBold)`,
    `- **Použitie:** Hlavné titulky (H1, H2, H3), bannery, hero sekcie a kľúčové čísla.`,
    ``,
    `### Bežný text a rozhranie (Body Text)`,
    `- **Font Family:** \`${bodyFont}\``,
    `- **Odporúčané rezy (Weights):** \`300\` (Light), \`400\` (Regular), \`600\` (SemiBold)`,
    `- **Použitie:** Odseky, formuláre, tabuľky, tlačidlá, popisky a drobné UI prvky.`,
    ``,
    `### Kód a technické dáta (Monospace)`,
    `- **Font Family:** \`${monoFont}\``,
    `- **Použitie:** Kódové bloky, terminály, dáta, tokeny a technické hodnoty.`,
    ``,
    `---`,
    ``,
    `## 4. Tvary, Rádiusy a Ohraničenia (Shapes & Geometry)`,
    `- **Základný Border Radius:** \`${radius}\` (používaj pre všetky tlačidlá, vstupné polia, modály a karty)`,
    `- **Základná hrúbka orámovania:** \`${borderWidth}\``,
    ``,
    `---`,
    ``,
    `## 5. Digitálne aktíva a logá (Direct Asset URLs)`,
    `*Inštrukcia pre vývojárov a AI agentov (napr. Cursor / Copilot): Nasledujúce URL adresy môžeš priamo stiahnuť do lokálneho projektu alebo použiť v kóde:*`,
    ``
  );

  if (extractedAssets.length > 0) {
    for (const a of extractedAssets) {
      doc.push(`- **${a.label}** [${a.format}]: \`${a.url}\``);
      if (a.description) {
        doc.push(`  *${a.description}*`);
      }
    }
  } else {
    doc.push(`- *Zatiaľ neboli nahrané žiadne verejné SVG assety v moduloch M07.*`);
  }

  doc.push(
    ``,
    `---`,
    ``,
    `## 6. Pravidlá zaobchádzania so značkou (Do's and Don'ts)`,
    ``,
    `### ✅ Povolené a odporúčané (DO)`
  );

  for (const r of doRules) {
    doc.push(`- **${r.title}:** ${r.description || "Odporúčané použitie."}`);
  }

  doc.push(``, `### ❌ Prísne zakázané (DON'T)`);
  for (const r of dontRules) {
    doc.push(`- **${r.title}:** ${r.description || "Prísne zakázané manipulovanie s identitou."}`);
  }

  if (warningRules.length > 0) {
    doc.push(``, `### ⚠️ Upozornenia a špeciálne prípady (WARNING)`);
    for (const r of warningRules) {
      doc.push(`- **${r.title}:** ${r.description || "Vyžaduje špeciálnu pozornosť."}`);
    }
  }

  const step50 = tonalSteps.find((s) => s.step === 50)?.hex || primary;
  const step500 = tonalSteps.find((s) => s.step === 500)?.hex || primary;
  const step900 = tonalSteps.find((s) => s.step === 900)?.hex || primary;

  doc.push(
    ``,
    `---`,
    ``,
    `## 7. Rýchly kódový ťahák (Quick Code Reference)`,
    ``,
    `### CSS Custom Properties (:root)`,
    `\`\`\`css`,
    `:root {`,
    `  /* Brand Core Colors */`,
    `  --color-primary: ${primary};`,
    `  --color-secondary: ${secondary};`,
    `  --color-accent: ${accent};`,
    `  --color-neutral: ${neutral};`,
    ``,
    `  /* UI Semantics */`,
    `  --color-success: ${success};`,
    `  --color-warning: ${warning};`,
    `  --color-danger: ${danger};`,
    `  --color-info: ${info};`,
    ``,
    `  /* Geometry */`,
    `  --radius-brand: ${radius};`,
    `  --border-brand: ${borderWidth};`,
    `}`,
    `\`\`\``,
    ``,
    `### Tailwind CSS Konfigurácia (tailwind.config.js)`,
    `\`\`\`javascript`,
    `module.exports = {`,
    `  theme: {`,
    `    extend: {`,
    `      colors: {`,
    `        brand: {`,
    `          primary: 'var(--color-primary, ${primary})',`,
    `          secondary: 'var(--color-secondary, ${secondary})',`,
    `          accent: 'var(--color-accent, ${accent})',`,
    `          neutral: 'var(--color-neutral, ${neutral})',`,
    `          50: '${step50}',`,
    `          500: '${step500}',`,
    `          900: '${step900}',`,
    `        },`,
    `      },`,
    `      borderRadius: {`,
    `        brand: '${radius}',`,
    `      },`,
    `      fontFamily: {`,
    `        heading: [${headingFont.split(",")[0].trim()}, 'sans-serif'],`,
    `        body: [${bodyFont.split(",")[0].trim()}, 'sans-serif'],`,
    `      },`,
    `    },`,
    `  },`,
    `};`,
    `\`\`\``,
    ``,
    `---`,
    `*Vygenerované automaticky systémom [Logobook.sk](https://logobook.sk) ako živý AI kontext.*`
  );

  return doc.filter((l) => l !== "").join("\n");
}
