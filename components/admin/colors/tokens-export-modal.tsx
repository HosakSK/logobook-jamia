"use client";

import { useState } from "react";
import { BrandColor } from "@/lib/types/color";
import { COLOR_ROLE_DEFINITIONS } from "@/lib/validations/color";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, Code2, Sparkles, FileJson } from "lucide-react";

interface TokensExportModalProps {
  colors: BrandColor[];
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TokensExportModal({
  colors,
  brandName,
  isOpen,
  onClose,
}: TokensExportModalProps) {
  const [activeTab, setActiveTab] = useState<"css" | "tailwind" | "json">("css");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate CSS custom properties
  const generateCss = (): string => {
    const lines = [
      `/**`,
      ` * Logobook Design Tokens - ${brandName}`,
      ` * Generated: ${new Date().toISOString()}`,
      ` */`,
      `:root {`,
    ];

    colors.forEach((c) => {
      const def = COLOR_ROLE_DEFINITIONS[c.role];
      const roleSlug = c.role.toLowerCase().replace(/_/g, "-");
      const nameSlug = (c.name.en || c.name.sk || "color")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      lines.push(`  /* ${def?.labelSk || c.role} - ${c.name.sk || c.name.en || ""} */`);
      lines.push(`  --color-${roleSlug}: ${c.hex};`);
      lines.push(`  --color-${nameSlug}: ${c.hex};`);
    });

    lines.push(`}`);
    return lines.join("\n");
  };

  // Generate Tailwind config snippet
  const generateTailwind = (): string => {
    const obj: Record<string, string> = {};
    colors.forEach((c) => {
      const nameKey = (c.name.en || c.name.sk || c.role)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      obj[nameKey] = c.hex;
    });

    return `// tailwind.config.js snippet\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(obj, null, 8).replace(/^ {8}/gm, "        ")}\n    }\n  }\n};`;
  };

  // Generate JSON (Tokens Studio / Figma compatible)
  const generateJson = (): string => {
    const tree: Record<string, any> = {
      brand: {
        name: brandName,
      },
      color: {},
    };

    colors.forEach((c) => {
      const cat = (c.category || "custom").toLowerCase();
      if (!tree.color[cat]) tree.color[cat] = {};
      const key = (c.name.en || c.name.sk || c.role)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      tree.color[cat][key] = {
        value: c.hex,
        type: "color",
        description: `${c.role} (${c.rgb})`,
      };
    });

    return JSON.stringify(tree, null, 2);
  };

  const getCode = () => {
    switch (activeTab) {
      case "tailwind":
        return generateTailwind();
      case "json":
        return generateJson();
      case "css":
      default:
        return generateCss();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#17212a] border border-[rgba(63,85,102,0.6)] rounded-[3px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden text-[#fafbfc]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#0e161d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#c8d400]/15 flex items-center justify-center text-[#c8d400] border border-[#c8d400]/30">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-[#fafbfc]">
                Export Design Tokenov
              </h2>
              <p className="text-xs text-[#96abbe]">
                Použite farby značky {brandName} vo vývoji a dizajn systéme
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#96abbe] hover:text-[#fafbfc] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[rgba(63,85,102,0.3)] bg-[#131b22]">
          <button
            onClick={() => setActiveTab("css")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "css"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            CSS Custom Properties (:root)
          </button>
          <button
            onClick={() => setActiveTab("tailwind")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "tailwind"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            Tailwind CSS
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 transition-colors ${
              activeTab === "json"
                ? "border-[#c8d400] text-[#c8d400]"
                : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
            }`}
          >
            JSON (Tokens Studio)
          </button>
        </div>

        {/* Code view */}
        <div className="p-6 flex-1 overflow-auto bg-[#070b0f]">
          <pre className="text-xs font-mono text-[#c8d400] bg-[#070b0f] p-4 rounded-[2px] border border-[rgba(63,85,102,0.4)] overflow-x-auto whitespace-pre selection:bg-[#c8d400]/20">
            {getCode()}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[rgba(63,85,102,0.45)] bg-[#0e161d]">
          <span className="text-[11px] text-[#96abbe]">
            Celkovo {colors.length} farieb pripravených na nasadenie
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-xs rounded-[3px] border-[rgba(63,85,102,0.6)] text-[#96abbe] hover:text-[#fafbfc]"
            >
              Zavrieť
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Skopírované!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopírovať do schránky</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
