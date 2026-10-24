"use client";

import { useState } from "react";
import { BrandColor } from "@/lib/types/color";
import {
  generateSystematicScale,
  SystematicStepItem,
  getWcagContrast,
} from "@/lib/utils/color-calc";
import { Button } from "@/components/ui/button";
import { X, Copy, Check, Sliders, Code2, Sparkles, ExternalLink } from "lucide-react";

interface ColorShadesModalProps {
  color: BrandColor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ColorShadesModal({ color, isOpen, onClose }: ColorShadesModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scale" | "carbon" | "tailwind" | "css">("scale");

  if (!isOpen || !color) return null;

  const scale: SystematicStepItem[] = generateSystematicScale(color.hex);
  const colorName = color.name.sk || color.name.en || "Farba";
  const slug = (color.name.en || color.name.sk || "color")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleCopyHex = async (id: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Systematic Format (10 - 100 + Black/White)
  const getSystematicCode = (): string => {
    const lines = [`// Systematická stupnica (10 - 100) podľa metodiky Jiřího Chlebusa`, `colors: {`, `  '${slug}': {`];
    scale.forEach((s) => {
      const key = s.step !== null ? `${s.step}` : s.id;
      lines.push(`    '${key}': '${s.hex}', // L ${s.lightness}`);
    });
    lines.push(`  }`, `}`);
    return lines.join("\n");
  };

  // 2. Standard Tailwind (50 - 900)
  const getTailwindCode = (): string => {
    // Mapping: 10->50, 20->100, 30->200, 40->300, 50->400, 60->500, 70->600, 80->700, 90->800, 100->900
    const twSteps: Record<number, string> = {
      50: scale.find((s) => s.step === 10)?.hex || "#FFFFFF",
      100: scale.find((s) => s.step === 20)?.hex || "",
      200: scale.find((s) => s.step === 30)?.hex || "",
      300: scale.find((s) => s.step === 40)?.hex || "",
      400: scale.find((s) => s.step === 50)?.hex || "",
      500: scale.find((s) => s.step === 60)?.hex || color.hex,
      600: scale.find((s) => s.step === 70)?.hex || "",
      700: scale.find((s) => s.step === 80)?.hex || "",
      800: scale.find((s) => s.step === 90)?.hex || "",
      900: scale.find((s) => s.step === 100)?.hex || "#000000",
    };

    return `// tailwind.config.js (50 - 900 mapping)\n{\n  colors: {\n    '${slug}': {\n${Object.entries(twSteps)
      .map(([k, v]) => `      ${k}: '${v}',`)
      .join("\n")}\n    }\n  }\n}`;
  };

  // 3. CSS Custom Properties (:root)
  const getCssCode = (): string => {
    const lines = [`:root {`, `  /* Systematická škála: ${colorName} */`];
    scale.forEach((s) => {
      lines.push(`  --color-${slug}-${s.id}: ${s.hex}; /* L ${s.lightness} */`);
    });
    lines.push(`}`);
    return lines.join("\n");
  };

  const handleCopyCode = async (format: "carbon" | "tailwind" | "css") => {
    let code = "";
    if (format === "carbon") code = getSystematicCode();
    else if (format === "tailwind") code = getTailwindCode();
    else code = getCssCode();

    try {
      await navigator.clipboard.writeText(code);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(63,85,102,0.4)] flex items-center justify-between bg-[#0e161d]">
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 rounded-[3px] border border-white/20 shadow-xs shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-[#fafbfc]">
                  Systematická stupnica odtieňov: {colorName}
                </h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[2px] bg-[#c8d400]/15 text-[#c8d400] border border-[#c8d400]/30">
                  {color.hex}
                </span>
              </div>
              <p className="text-xs text-[#96abbe] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Presne podľa metodiky</span>
                <a
                  href="https://blog.jirichlebus.cz/clanky/jak-tvorit-systematicke-barvy-pro-digitalni-produkty"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#c8d400] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <span>Jiřího Chlebuse (L 0 až L 100 v HSLuv)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[3px] text-[#96abbe] hover:text-[#fafbfc] hover:bg-[#1f2c36] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[rgba(63,85,102,0.3)] bg-[#131b22]">
          <button
            type="button"
            onClick={() => setActiveTab("scale")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "scale"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            Vizuálna stupnica (L 0 – L 100)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("carbon")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "carbon"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            Kód: Systematika (10 – 100)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tailwind")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "tailwind"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            Kód: Tailwind (50 – 900)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("css")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "css"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            CSS Variables
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-[#070b0f]">
          {activeTab === "scale" ? (
            <div className="space-y-6">
              {/* --- HERO GRAPHICAL RAMP: EXACT REPLICA OF USER ATTACHMENT --- */}
              <div className="p-6 rounded-[3px] bg-[#111921] border border-[rgba(63,85,102,0.45)] shadow-inner space-y-4 overflow-x-auto">
                <div className="flex items-center justify-between text-xs font-mono text-[#96abbe] border-b border-[rgba(63,85,102,0.3)] pb-2">
                  <span className="font-bold text-[#fafbfc]">
                    Škála svetlosti: {colorName} ({color.hex})
                  </span>
                  <span>12 stupňov percepčnej svetlosti</span>
                </div>

                {/* 12 Columns Ramp */}
                <div className="min-w-[700px] grid grid-cols-12 gap-2 text-center select-none pt-2">
                  {scale.map((s) => {
                    const colName =
                      s.step !== null
                        ? `${colorName.split(" ")[0]} ${s.step}`
                        : s.label;

                    const isCopied = copiedId === s.id;

                    return (
                      <div key={s.id} className="flex flex-col items-center group">
                        {/* 1. Top Label */}
                        <div className="text-[11px] font-sans font-medium text-[#fafbfc] truncate w-full h-5 leading-5 mb-1 group-hover:text-[#c8d400] transition-colors">
                          {colName}
                        </div>

                        {/* 2. Top Tick Mark */}
                        <div className="h-3 w-px bg-[rgba(150,171,190,0.5)] mb-2 group-hover:bg-[#c8d400] transition-colors" />

                        {/* 3. Swatch Box with L value */}
                        <button
                          type="button"
                          onClick={() => handleCopyHex(s.id, s.hex)}
                          className="w-full h-16 rounded-[4px] border border-black/20 flex flex-col items-center justify-center font-mono text-xs font-bold transition-transform hover:scale-105 hover:shadow-lg focus:outline-hidden relative cursor-pointer"
                          style={{
                            backgroundColor: s.hex,
                            color: s.isTextWhite ? "#FFFFFF" : "#000000",
                          }}
                          title={`${colName}: ${s.hex} (L ${s.lightness}) - Kliknutím skopírujete`}
                        >
                          <span>L {s.lightness}</span>
                          {isCopied && (
                            <span className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-[4px] flex items-center justify-center text-white text-[10px] font-bold">
                              ✓ Skús
                            </span>
                          )}
                        </button>

                        {/* 4. Bottom Tick Mark */}
                        <div className="h-2 w-px bg-[rgba(150,171,190,0.35)] mt-2" />

                        {/* 5. Bottom HEX label */}
                        <div className="text-[10px] font-mono text-[#96abbe] group-hover:text-[#fafbfc] transition-colors mt-0.5">
                          {s.hex}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Cards List */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-[#96abbe] tracking-wider">
                  Detailné hodnoty a WCAG čitateľnosť:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {scale.map((s) => {
                    const contrast = getWcagContrast(s.hex);
                    const isCopied = copiedId === s.id;
                    const stepTitle =
                      s.step !== null
                        ? `${colorName.split(" ")[0]} ${s.step}`
                        : s.label;

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleCopyHex(s.id, s.hex)}
                        className="p-3 rounded-[3px] bg-[#17212a] border border-[rgba(63,85,102,0.4)] flex items-center justify-between cursor-pointer hover:border-[#c8d400] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-8 w-8 rounded-[3px] border border-white/20 shrink-0 flex items-center justify-center font-mono text-[9px] font-bold"
                            style={{
                              backgroundColor: s.hex,
                              color: s.isTextWhite ? "#FFFFFF" : "#000000",
                            }}
                          >
                            L{s.lightness}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold font-mono text-[#fafbfc] truncate group-hover:text-[#c8d400] transition-colors">
                              {stepTitle}
                            </div>
                            <div className="text-[11px] font-mono text-[#96abbe]">
                              {s.hex} • L: {s.lightness}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] font-bold ${
                              s.isTextWhite ? contrast.whiteScore : contrast.blackScore
                            } === "Fail" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"`}
                          >
                            {s.isTextWhite
                              ? `${contrast.whiteRatio}:1 W`
                              : `${contrast.blackRatio}:1 B`}
                          </span>
                          <div className="p-1 rounded-[2px] bg-[#070b0f] text-[#96abbe] group-hover:text-[#fafbfc]">
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <pre className="text-xs font-mono text-[#c8d400] bg-[#17212a] p-4 rounded-[2px] border border-[rgba(63,85,102,0.4)] overflow-x-auto whitespace-pre selection:bg-[#c8d400]/20">
                {activeTab === "carbon"
                  ? getSystematicCode()
                  : activeTab === "tailwind"
                  ? getTailwindCode()
                  : getCssCode()}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(63,85,102,0.4)] bg-[#0e161d]">
          <span className="text-[11px] text-[#96abbe]">
            Kliknutím na ktorýkoľvek odtieň skopírujete jeho HEX kód
          </span>
          <div className="flex items-center gap-2">
            {activeTab !== "scale" && (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleCopyCode(activeTab as "carbon" | "tailwind" | "css")
                }
                className="h-8 px-3 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
              >
                {copiedFormat === activeTab ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Skopírované!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Kopírovať kód</span>
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs rounded-[3px] border-[rgba(63,85,102,0.6)] text-[#96abbe] hover:text-[#fafbfc]"
            >
              Zavrieť
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
