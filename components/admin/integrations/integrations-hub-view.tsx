"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  FileCode,
  FileJson,
  FileArchive,
  Layers,
  Terminal,
  Cpu,
  Info,
  CheckCircle2,
  AlertCircle,
  Download,
  Bot,
  FileText,
} from "lucide-react";
import { saveAs } from "file-saver";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { Button } from "@/components/ui/button";
import { OfflineExportModal } from "@/components/admin/export/offline-export-modal";

interface IntegrationsHubViewProps {
  brand: {
    id: string;
    name: string;
    slug: string;
    customDomain?: string;
    status?: string;
  };
  snapshot: PublishedBrandSnapshot | null;
  appBaseUrl: string;
  cssPreview: string;
  jsonPreview: string;
  aiPreview: string;
}

export function IntegrationsHubView({
  brand,
  snapshot,
  appBaseUrl,
  cssPreview,
  jsonPreview,
  aiPreview,
}: IntegrationsHubViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTabCss, setActiveTabCss] = useState<"link" | "import">("link");
  const [isCssPreviewOpen, setIsCssPreviewOpen] = useState(false);
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isAiPreviewOpen, setIsAiPreviewOpen] = useState(false);

  const isPublished = Boolean(snapshot && snapshot.pages && snapshot.pages.length > 0);
  const effectiveSlug = brand.slug || brand.id;

  const cssUrl = `${appBaseUrl}/api/brand/${effectiveSlug}/theme.css`;
  const jsonUrl = `${appBaseUrl}/api/brand/${effectiveSlug}/tokens.json`;
  const aiTxtUrl = `${appBaseUrl}/api/brand/${effectiveSlug}/llms.txt`;
  const aiMdUrl = `${appBaseUrl}/api/brand/${effectiveSlug}/ai.md`;

  const handleDownloadAiMd = () => {
    try {
      const blob = new Blob([aiPreview], { type: "text/markdown;charset=utf-8" });
      saveAs(blob, `${effectiveSlug}-ai-context.md`);
    } catch (e) {
      console.error("Failed to download ai.md", e);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const htmlSnippet = `<link rel="stylesheet" href="${cssUrl}" />`;
  const cssImportSnippet = `@import url("${cssUrl}");`;

  const tailwindSnippet = `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          neutral: 'var(--color-neutral)',
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          900: 'var(--color-primary-900)',
        },
      },
      fontFamily: {
        heading: 'var(--font-family-heading)',
        body: 'var(--font-family-body)',
      },
    },
  },
};`;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-6 bg-[#17212a] text-[#fafbfc] shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <Code2 className="h-3 w-3" />
                <span>Integration Hub</span>
              </span>
              {isPublished ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded-[2px]">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Publikované v{snapshot?.version || 1}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 rounded-[2px]">
                  <AlertCircle className="h-3 w-3" />
                  <span>Koncept (Zatiaľ nepublikované)</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#fafbfc]">
              Integrácie & Design Tokens API
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/admin/brand/${brand.id}/builder`}
              className="text-xs text-[#96abbe] hover:text-[#fafbfc] underline underline-offset-4"
            >
              Prejsť do Page Buildera &rarr;
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#96abbe] max-w-3xl leading-relaxed">
          Premeňte dizajn manuál na živý zdroj pravdy (<strong>Single Source of Truth</strong>). Tieto
          strojovo-čitateľné endpointy umožňujú vývojárom a softvérom (ako Figma alebo Tailwind)
          automaticky sťahovať firemné farby a typografiu priamo do kódu a grafických šablón.
        </p>

        {!isPublished && (
          <div className="p-3.5 rounded-[2px] bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Upozornenie:</strong> Tento brand manuál ešte nebol publikovaný. Endpointy
              budú vracať HTTP 404, kým v Page Builderi nekliknete na tlačidlo <em>Publikovať</em>.
            </div>
          </div>
        )}
      </div>

      {/* Grid of Integration Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Endpoint 1: CSS Theme */}
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-[2px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">CSS Custom Properties</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">theme.css</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-muted/60 text-muted-foreground border border-border/40">
                :root variables
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Štandardný CSS súbor s premennými pre farby, HSLuv odtiene (50–900) a typografiu.
              Vložte ho priamo do hlavičky webu.
            </p>

            {/* URL Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">URL Endpointu</label>
              <div className="flex items-center gap-1.5 p-1.5 rounded-[2px] bg-neutral-950 border border-border/70 font-mono text-xs">
                <span className="truncate flex-1 px-1.5 text-neutral-300">{cssUrl}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(cssUrl, "css-url")}
                  className="h-6 px-2 text-[10px] cursor-pointer"
                  title="Skopírovať URL"
                >
                  {copiedKey === "css-url" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <a
                  href={cssUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-[2px] text-muted-foreground hover:text-foreground"
                  title="Otvoriť v novom okne"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Code Snippets */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveTabCss("link")}
                    className={`pb-0.5 transition-colors cursor-pointer ${
                      activeTabCss === "link"
                        ? "text-primary border-b border-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    HTML &lt;link&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabCss("import")}
                    className={`pb-0.5 transition-colors cursor-pointer ${
                      activeTabCss === "import"
                        ? "text-primary border-b border-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    CSS @import
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      activeTabCss === "link" ? htmlSnippet : cssImportSnippet,
                      "css-snippet"
                    )
                  }
                  className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "css-snippet" ? (
                    <>
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Skopírované</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-2.5 w-2.5" />
                      <span>Kopírovať kód</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-2.5 rounded-[2px] bg-neutral-950/80 border border-border/50 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                <code>{activeTabCss === "link" ? htmlSnippet : cssImportSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={() => setIsCssPreviewOpen(!isCssPreviewOpen)}
              className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              {isCssPreviewOpen ? "Skryť náhľad vygenerovaného CSS" : "Zobraziť náhľad vygenerovaného CSS"}
            </button>

            {isCssPreviewOpen && (
              <pre className="mt-3 p-3 rounded-[2px] bg-neutral-950 border border-border/70 text-[10px] font-mono text-neutral-300 max-h-56 overflow-y-auto scrollbar-thin">
                <code>{cssPreview}</code>
              </pre>
            )}
          </div>
        </div>

        {/* Endpoint 2: W3C DTCG Tokens JSON */}
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileJson className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">W3C Design Tokens</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">tokens.json</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                W3C DTCG Standard
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Formát podľa špecifikácie W3C Design Tokens Community Group. Ideálny pre{" "}
              <strong>Tokens Studio for Figma</strong> a Style Dictionary transformácie.
            </p>

            {/* URL Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground">URL Endpointu</label>
              <div className="flex items-center gap-1.5 p-1.5 rounded-[2px] bg-neutral-950 border border-border/70 font-mono text-xs">
                <span className="truncate flex-1 px-1.5 text-neutral-300">{jsonUrl}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(jsonUrl, "json-url")}
                  className="h-6 px-2 text-[10px] cursor-pointer"
                  title="Skopírovať URL"
                >
                  {copiedKey === "json-url" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <a
                  href={jsonUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-[2px] text-muted-foreground hover:text-foreground"
                  title="Otvoriť v novom okne"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Instructions for Figma */}
            <div className="space-y-1.5 p-3 rounded-[2px] bg-muted/20 border border-border/40 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Návod: Tokens Studio for Figma</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                V plugine Tokens Studio otvorte <em>Settings &rarr; Add New Token Storage</em>, vyberte{" "}
                <em>URL / Remote Storage</em> a vložte URL tohto endpointu. Všetky farby a rezervačné
                tokeny sa okamžite synchronizujú do Figmy.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30">
            <button
              type="button"
              onClick={() => setIsJsonPreviewOpen(!isJsonPreviewOpen)}
              className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              {isJsonPreviewOpen ? "Skryť náhľad W3C JSON" : "Zobraziť náhľad W3C JSON"}
            </button>

            {isJsonPreviewOpen && (
              <pre className="mt-3 p-3 rounded-[2px] bg-neutral-950 border border-border/70 text-[10px] font-mono text-neutral-300 max-h-56 overflow-y-auto scrollbar-thin">
                <code>{jsonPreview}</code>
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Section: AI Context Generator & LLM Prompt (llms.txt / ai.md) */}
      <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[2px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  AI Context Generator &amp; LLM Ready Prompt
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  llms.txt &amp; ai.md
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Optimalizovaný štruktúrovaný Markdown pre ChatGPT, Claude, Cursor a Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(aiPreview, "ai-markdown")}
              className="h-8 text-xs gap-1.5 rounded-[2px] cursor-pointer"
            >
              {copiedKey === "ai-markdown" ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Skopírované!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Kopírovať Markdown</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleDownloadAiMd}
              className="h-8 text-xs gap-1.5 rounded-[2px] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Stiahnuť ai.md</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Premeňte dizajn manuál na okamžitý prompt kontext pre umelú inteligenciu. Výsledný text obsahuje
          presné Hex a RGB farebné kódy, tonálne kroky, typografiu, priame odkazy na stiahnutie SVG lôg a
          pravidlá identity (Do&apos;s &amp; Don&apos;ts).
        </p>

        {/* URLs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* llms.txt */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
              <span>Štandardný endpoint (llms.txt)</span>
              <span className="text-[10px] text-muted-foreground font-mono">text/plain</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-[2px] bg-neutral-950 border border-border/70 font-mono text-xs">
              <span className="truncate flex-1 px-1.5 text-neutral-300">{aiTxtUrl}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(aiTxtUrl, "ai-txt-url")}
                className="h-6 px-2 text-[10px] cursor-pointer"
                title="Skopírovať URL"
              >
                {copiedKey === "ai-txt-url" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <a
                href={aiTxtUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-[2px] text-muted-foreground hover:text-foreground"
                title="Otvoriť v novom okne"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* ai.md */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
              <span>Markdown endpoint (ai.md)</span>
              <span className="text-[10px] text-muted-foreground font-mono">text/markdown</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-[2px] bg-neutral-950 border border-border/70 font-mono text-xs">
              <span className="truncate flex-1 px-1.5 text-neutral-300">{aiMdUrl}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(aiMdUrl, "ai-md-url")}
                className="h-6 px-2 text-[10px] cursor-pointer"
                title="Skopírovať URL"
              >
                {copiedKey === "ai-md-url" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <a
                href={aiMdUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-[2px] text-muted-foreground hover:text-foreground"
                title="Otvoriť v novom okne"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* AI Prompt Usage Guide */}
        <div className="p-3.5 rounded-[2px] bg-purple-950/20 border border-purple-500/30 text-xs space-y-2">
          <div className="font-semibold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Ako použiť s AI asistentmi (ChatGPT, Claude, Cursor)</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Skopírujte URL adresu <code>{aiTxtUrl}</code> a vložte ju do sekcie <strong>Custom Instructions</strong> v
            ChatGPT, do systémového promptu v Claude Projects, alebo do pravidiel <strong>.cursorrules</strong> v
            editore Cursor. AI model bude pri generovaní kódu a grafiky automaticky rešpektovať všetky farby,
            veľkosti a pravidlá identity.
          </p>
        </div>

        {/* Live Preview Toggle */}
        <div className="pt-1 border-t border-border/30">
          <button
            type="button"
            onClick={() => setIsAiPreviewOpen(!isAiPreviewOpen)}
            className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            {isAiPreviewOpen ? "Skryť náhľad AI Markdownu" : "Zobraziť vygenerovaný AI Markdown kontext"}
          </button>

          {isAiPreviewOpen && (
            <pre className="mt-3 p-3.5 rounded-[2px] bg-neutral-950 border border-border/70 text-[11px] font-mono text-neutral-300 max-h-72 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
              <code>{aiPreview}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Section 3: Tailwind Integration Code Snippet */}
      <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Integrácia s Tailwind CSS</h3>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(tailwindSnippet, "tailwind")}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer"
          >
            {copiedKey === "tailwind" ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Skopírované</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Kopírovať Tailwind config</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Vložte nasledujúce rozšírenie do svojho <code>tailwind.config.js</code>. Používaním CSS
          premenných získate automatickú synchronizáciu dizajnu bez nutnosti meniť zdrojový kód.
        </p>

        <pre className="p-3.5 rounded-[2px] bg-neutral-950 border border-border/70 text-xs font-mono text-neutral-300 overflow-x-auto">
          <code>{tailwindSnippet}</code>
        </pre>
      </div>

      {/* Section 4: Offline HTML & ZIP Export Engine */}
      <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-5 bg-[#17212a] text-[#fafbfc] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileArchive className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Offline HTML & ZIP Export Engine</h3>
              <p className="text-[11px] text-muted-foreground">
                Klientska archivácia celej značky (100% Client-Side JSZip / Zero VPS overhead)
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsOfflineModalOpen(true)}
            className="h-8 text-xs gap-1.5 rounded-[2px] cursor-pointer"
            variant="default"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Vygenerovať Offline ZIP</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Stiahne kompletný archív obsahujúci statické HTML stránky (<code>index.html</code>), relatívne
          prelinkované obrázky a logá (<code>/assets/...</code>), fonty spĺňajúce licenciu (<code>/fonts/...</code>)
          a design tokeny (<code>tokens/theme.css</code>, <code>tokens/tokens.json</code>). Archív funguje bez
          pripojenia k internetu a bez webového servera (otvorením cez súborový prehliadač).
        </p>
      </div>

      {/* Offline Export Modal */}
      <OfflineExportModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        brandId={brand.id}
        brandSlug={effectiveSlug}
        brandName={brand.name}
        snapshot={snapshot}
      />
    </div>
  );
}
