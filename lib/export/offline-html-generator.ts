import { PublishedBrandSnapshot, PublishedPageItem, PublishedContainerItem } from "@/actions/publish";
import { BrandCascadeTokens } from "@/lib/types/module";
import { generateBrandCssTheme } from "@/lib/tokens/generator";

export interface OfflineHtmlGeneratorInput {
  snapshot: PublishedBrandSnapshot;
  cascadeTokens?: BrandCascadeTokens | null;
  urlMap: Map<string, string>; // Maps absolute web URLs to local relative paths (e.g. "./assets/logo.svg")
  locale?: string;
}

/**
 * Generates a self-contained, fully offline HTML file (index.html) with embedded styles,
 * CSS variables, client-side chapter tab navigation, and rewritten relative asset paths.
 */
export function generateOfflineHtml(input: OfflineHtmlGeneratorInput): string {
  const { snapshot, cascadeTokens, urlMap, locale = "en" } = input;
  const brandName = snapshot.brand.name || "Brand";
  const version = snapshot.version || 1;
  const pages = snapshot.pages || [];

  const getLocalized = (textObj?: Record<string, string>): string => {
    if (!textObj) return "";
    return textObj[locale] || textObj.en || textObj.sk || Object.values(textObj)[0] || "";
  };

  const rewriteUrl = (url?: string): string => {
    if (!url) return "";
    return urlMap.get(url) || url;
  };

  const cssTheme = generateBrandCssTheme({ snapshot, cascadeTokens });

  // Render navigation links
  const navItemsHtml = pages
    .filter((p) => p.isInMenu !== false)
    .map(
      (p, idx) => `
        <button
          type="button"
          class="nav-tab ${idx === 0 ? "active" : ""}"
          data-target="page-${p.id}"
          onclick="switchPage('page-${p.id}')"
        >
          <span class="nav-title">${escapeHtml(getLocalized(p.title) || p.slug)}</span>
        </button>
      `
    )
    .join("\n");

  // Render pages
  const pagesHtml = pages
    .map((page, idx) => {
      const pageTitle = escapeHtml(getLocalized(page.title) || page.slug);
      const isVisible = idx === 0;

      const containersHtml = (page.containers || [])
        .map((container) => renderContainerHtml(container, getLocalized, rewriteUrl))
        .join("\n");

      return `
        <article id="page-${page.id}" class="page-section ${isVisible ? "active" : "hidden"}">
          <header class="page-header">
            <div class="breadcrumb">${escapeHtml(brandName)} / <span>${pageTitle}</span></div>
            <h1 class="page-title">${pageTitle}</h1>
          </header>
          <div class="containers-stack">
            ${containersHtml || '<div class="empty-state">Táto kapitola neobsahuje žiadny obsah.</div>'}
          </div>
        </article>
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(brandName)} – Brand Manual (Offline Archive)</title>
  <style>
    ${cssTheme}

    /* Reset & Base Styles */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background-color: #0c0d0e;
      color: #f1f3f5;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    /* Layout Shell */
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 50;
      height: 64px;
      background: rgba(18, 19, 21, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }

    .brand-brandmark {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-badge {
      width: 32px;
      height: 32px;
      background: var(--color-primary, #c8d400);
      color: #000;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-base, 3px);
    }

    .brand-title {
      font-weight: 800;
      letter-spacing: -0.02em;
      font-size: 16px;
      text-transform: uppercase;
    }

    .badge-offline {
      font-size: 10px;
      font-family: monospace;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(200, 212, 0, 0.15);
      color: #c8d400;
      border: 1px solid rgba(200, 212, 0, 0.3);
    }

    .main-body {
      display: flex;
      flex: 1;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 260px;
      background: #121315;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      padding: 20px 12px;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
      overflow-y: auto;
    }

    .sidebar-heading {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #71767b;
      margin-bottom: 12px;
      padding-left: 12px;
      font-weight: 700;
    }

    .nav-tab {
      width: 100%;
      text-align: left;
      padding: 9px 12px;
      border-radius: var(--border-radius-base, 3px);
      background: transparent;
      border: none;
      color: #9ba1a6;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      margin-bottom: 3px;
    }

    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }

    .nav-tab.active {
      background: rgba(200, 212, 0, 0.15);
      color: #c8d400;
      font-weight: 700;
      border-left: 3px solid #c8d400;
    }

    /* Main Content Area */
    .content-area {
      flex: 1;
      padding: 40px 48px;
      max-width: 1040px;
      margin: 0 auto;
    }

    .page-section.hidden {
      display: none;
    }

    .page-header {
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 40px;
    }

    .breadcrumb {
      font-size: 11px;
      font-family: monospace;
      color: #71767b;
      margin-bottom: 8px;
    }

    .breadcrumb span {
      color: #fff;
      font-weight: 600;
    }

    .page-title {
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #fff;
      font-family: var(--font-family-heading, inherit);
    }

    /* Grid & Containers */
    .containers-stack {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .container-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .container-h2 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
      color: #f1f3f5;
    }

    .grid-row {
      display: grid;
      gap: 24px;
      width: 100%;
    }

    .grid-cols-1 { grid-template-columns: 1fr; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-one-third-two-thirds { grid-template-columns: 1fr 2fr; }
    .grid-two-thirds-one-third { grid-template-columns: 2fr 1fr; }

    @media (max-width: 860px) {
      .main-body { flex-direction: column; }
      .sidebar { width: 100%; height: auto; position: static; }
      .grid-cols-2, .grid-cols-3, .grid-one-third-two-thirds, .grid-two-thirds-one-third {
        grid-template-columns: 1fr !important;
      }
      .content-area { padding: 24px 16px; }
    }

    .column-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 0;
    }

    /* Module Cards */
    .module-card {
      background: #17191c;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--border-radius-base, 3px);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .module-h3 {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .logo-preview-box {
      background: #202327;
      border-radius: var(--border-radius-base, 3px);
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 180px;
    }

    .logo-preview-box img {
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
    }

    .color-swatch-box {
      height: 120px;
      border-radius: var(--border-radius-base, 3px);
      display: flex;
      align-items: flex-end;
      padding: 12px;
      font-weight: 700;
      font-size: 13px;
    }

    .color-values-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .color-values-table td {
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .color-values-table td:last-child {
      text-align: right;
      font-family: monospace;
      color: #fff;
    }

    .tonal-scale-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 8px;
    }

    .tonal-step-cell {
      height: 60px;
      border-radius: 2px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6px;
      font-size: 10px;
      font-family: monospace;
      font-weight: bold;
    }

    /* Footer */
    .app-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #71767b;
      background: #0f1012;
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-brandmark">
        <div class="brand-logo-badge">${escapeHtml(brandName.slice(0, 2).toUpperCase())}</div>
        <div class="brand-title">${escapeHtml(brandName)}</div>
      </div>
      <div class="badge-offline">Offline HTML Archive (v${version})</div>
    </header>

    <div class="main-body">
      <nav class="sidebar">
        <div class="sidebar-heading">Kapitoly manuálu</div>
        ${navItemsHtml}
      </nav>

      <main class="content-area">
        ${pagesHtml}
      </main>
    </div>

    <footer class="app-footer">
      © ${new Date().getFullYear()} ${escapeHtml(brandName)}. Tento archív bol vygenerovaný službou Logobook.sk pre offline použitie.
    </footer>
  </div>

  <script>
    function switchPage(pageId) {
      // Hide all page sections
      document.querySelectorAll('.page-section').forEach(function(el) {
        el.classList.add('hidden');
        el.classList.remove('active');
      });

      // Show selected page section
      var target = document.getElementById(pageId);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
      }

      // Update active nav tab
      document.querySelectorAll('.nav-tab').forEach(function(tab) {
        if (tab.getAttribute('data-target') === pageId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      window.scrollTo(0, 0);
    }
  </script>
</body>
</html>
`;
}

function renderContainerHtml(
  container: PublishedContainerItem,
  getLocalized: (text?: Record<string, string>) => string,
  rewriteUrl: (url?: string) => string
): string {
  const h2Text = container.showH2 ? getLocalized(container.h2Title) : "";

  let gridClass = "grid-cols-1";
  switch (container.layoutType) {
    case "HALF_HALF":
      gridClass = "grid-cols-2";
      break;
    case "THREE_EQUAL":
      gridClass = "grid-cols-3";
      break;
    case "ONE_THIRD_TWO_THIRDS":
      gridClass = "grid-one-third-two-thirds";
      break;
    case "TWO_THIRDS_ONE_THIRD":
      gridClass = "grid-two-thirds-one-third";
      break;
    default:
      gridClass = "grid-cols-1";
  }

  const columnsHtml = (container.columns || [])
    .map((col) => {
      const modulesHtml = (col.modules || [])
        .map((mod) => renderModuleHtml(mod, getLocalized, rewriteUrl))
        .join("\n");

      return `<div class="column-wrapper">${modulesHtml}</div>`;
    })
    .join("\n");

  return `
    <section class="container-section">
      ${h2Text ? `<h2 class="container-h2">${escapeHtml(h2Text)}</h2>` : ""}
      <div class="grid-row ${gridClass}">
        ${columnsHtml}
      </div>
    </section>
  `;
}

function renderModuleHtml(
  module: any,
  getLocalized: (text?: Record<string, string>) => string,
  rewriteUrl: (url?: string) => string
): string {
  const h3Text = module.showH3 ? getLocalized(module.h3Title) : "";
  const cfg = module.config || {};
  const type = module.moduleType || "";

  let body = "";

  // Render module specific preview
  if (type.includes("M01") || type.includes("Nadpis") || type.includes("HEADING")) {
    const text = getLocalized(cfg.title) || cfg.text || "Nadpis";
    body = `<h2 style="font-size: 28px; font-weight: 800; color: #fff;">${escapeHtml(text)}</h2>`;
  } else if (type.includes("M02") || type.includes("RichText")) {
    const htmlContent = getLocalized(cfg.content) || cfg.html || "<p>Textový obsah</p>";
    body = `<div class="rich-text-body" style="font-size: 14px; color: #c4c7c5; line-height: 1.7;">${htmlContent}</div>`;
  } else if (type.includes("M07") || type.includes("Logo") || type.includes("ASSET")) {
    const logoUrl = rewriteUrl(cfg.assetUrl || cfg.url);
    body = `
      <div class="logo-preview-box">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" />` : '<span style="font-size: 12px; color: #71767b;">Logo zatiaľ nebolo nahrané</span>'}
      </div>
    `;
  } else if (type.includes("M12") || type.includes("KartaFarby") || type.includes("COLOR_CARD")) {
    const hex = cfg.hex || "#c8d400";
    const name = getLocalized(cfg.name) || cfg.name || "Farba";
    body = `
      <div class="color-swatch-box" style="background-color: ${hex}; color: #000;">
        <span>${escapeHtml(name)}</span>
      </div>
      <table class="color-values-table">
        <tr><td>HEX</td><td>${escapeHtml(hex)}</td></tr>
        ${cfg.cmyk ? `<tr><td>CMYK</td><td>${escapeHtml(cfg.cmyk)}</td></tr>` : ""}
        ${cfg.rgb ? `<tr><td>RGB</td><td>${escapeHtml(cfg.rgb)}</td></tr>` : ""}
      </table>
    `;
  } else {
    // Generic fallback card
    body = `<div style="font-size: 13px; color: #9ba1a6;">${escapeHtml(type)}</div>`;
  }

  return `
    <div class="module-card">
      ${h3Text ? `<h3 class="module-h3">${escapeHtml(h3Text)}</h3>` : ""}
      ${body}
    </div>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
