"use client";

import { useState } from "react";
import { BrandColor } from "@/lib/types/color";
import { generateTonalSteps, TonalStepItem, getWcagContrast } from "@/lib/utils/color-calc";
import { Button } from "@/components/ui/button";
import { X, Copy, Check, Sliders, Code2, Sparkles } from "lucide-react";

interface ColorShadesModalProps {
  color: BrandColor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ColorShadesModal({ color, isOpen, onClose }: ColorShadesModalProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "tailwind" | "css">("visual");

  if (!isOpen || !color) return null;

  const steps: TonalStepItem[] = generateTonalSteps(color.hex);
  const colorName = color.name.sk || color.name.en || "Farba";
  const slug = (color.name.en || color.name.sk || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleCopyHex = async (step: number, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedStep(step);
      setTimeout(() => setCopiedStep(null), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  const getTailwindCode = (): string => {
    const obj: Record<number, string> = {};
    steps.forEach((s) => {
      obj[s.step] = s.hex;
    });
    return `// tailwind.config.js\n{\n  colors: {\n    '${slug}': {\n${steps
      .map((s) => `      ${s.step}: '${s.hex}',`)
      .join("\n")}\n    }\n  }\n}`;
  };

  const getCssCode = (): string => {
    return `:root {\n${steps
      .map((s) => `  --color-${slug}-${s.step}: ${s.hex};`)
      .join("\n")}\n}`;
  };

  const handleCopyCode = async (format: "tailwind" | "css") => {
    const code = format === "tailwind" ? getTailwindCode() : getCssCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[3px] bg-[#17212a] text-[#fafbfc] border border-[rgba(63,85,102,0.6)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(63,85,102,0.4)] flex items-center justify-between bg-[#0e161d]">
          <div className="flex items-center gap-3">
            <span
              className="h-9 w-9 rounded-[3px] border border-white/20 shadow-xs shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-[#fafbfc]">
                  Odtiene 50 – 900: {colorName}
                </h2>
                <span className="font-mono text-xs font-semibold text-[#c8d400]">
                  {color.hex}
                </span>
              </div>
              <p className="text-xs text-[#96abbe] mt-0.5">
                Percepčne rovnomerná HSLuv stupnica odtieňov pre Tailwind a UI komponenty.
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
            onClick={() => setActiveTab("visual")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "visual"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            Vizuálna stupnica (10 stupňov)
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
            Tailwind kód
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
            CSS premenné
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-[#070b0f]">
          {activeTab === "visual" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {steps.map((item) => {
                  const contrast = getWcagContrast(item.hex);
                  const isWhiteText = contrast.preferredText === "white";
                  const isCopied = copiedStep === item.step;

                  return (
                    <div
                      key={item.step}
                      onClick={() => handleCopyHex(item.step, item.hex)}
                      className="p-3 rounded-[3px] border border-[rgba(63,85,102,0.4)] flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-[#c8d400] group"
                      style={{ backgroundColor: item.hex }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-xs font-extrabold px-1.5 py-0.5 rounded-[2px] ${
                            isWhiteText ? "bg-black/40 text-white" : "bg-white/60 text-black"
                          }`}
                        >
                          {item.step}
                        </span>
                        <div>
                          <span
                            className={`font-mono text-sm font-bold block ${
                              isWhiteText ? "text-white" : "text-black"
                            }`}
                          >
                            {item.hex}
                          </span>
                          <span
                            className={`text-[10px] font-mono block opacity-75 ${
                              isWhiteText ? "text-white" : "text-black"
                            }`}
                          >
                            Svetlosť: {Math.round(item.lightness)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] font-semibold ${
                            isWhiteText ? "bg-black/40 text-white" : "bg-white/60 text-black"
                          }`}
                        >
                          {isWhiteText ? contrast.whiteScore : contrast.blackScore}
                        </span>

                        <div
                          className={`p-1.5 rounded-[2px] ${
                            isWhiteText ? "bg-black/50 text-white" : "bg-white/70 text-black"
                          }`}
                          title="Kliknutím skopírujete HEX kód"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <pre className="text-xs font-mono text-[#c8d400] bg-[#17212a] p-4 rounded-[2px] border border-[rgba(63,85,102,0.4)] overflow-x-auto whitespace-pre selection:bg-[#c8d400]/20">
                {activeTab === "tailwind" ? getTailwindCode() : getCssCode()}
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
            {activeTab !== "visual" && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleCopyCode(activeTab as "tailwind" | "css")}
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
