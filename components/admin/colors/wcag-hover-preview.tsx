"use client";

import React, { useState, useRef, useEffect } from "react";
import { WcagScore, getWcagScoreBadgeClass } from "@/lib/utils/color-calc";
import { Check, X, Eye, Sparkles } from "lucide-react";

interface WcagHoverPreviewProps {
  colorHex: string;
  target: "white" | "black";
  ratio: number;
  score: WcagScore;
  align?: "right" | "left" | "center";
  children: React.ReactNode;
}

/**
 * Interactive hover popover displaying a live visual demonstration of WCAG contrast
 * (sample text on color background, and color text on target background)
 * along with detailed WCAG 2.1 pass/fail criteria.
 */
export function WcagHoverPreview({
  colorHex,
  target,
  ratio,
  score,
  align = "right",
  children,
}: WcagHoverPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verticalPos, setVerticalPos] = useState<"top" | "bottom">("top");
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const targetHex = target === "white" ? "#FFFFFF" : "#000000";
  const targetLabel = target === "white" ? "Biela (#FFFFFF)" : "Čierna (#000000)";

  // Compute compliance levels
  const passesNormal = ratio >= 4.5;
  const passesLarge = ratio >= 3.0;
  const passesUI = ratio >= 3.0;

  const scoreLabel = score === "AA Large" ? "AA+" : score;

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If close to top of viewport, flip downward
      if (rect.top < 330) {
        setVerticalPos("bottom");
      } else {
        setVerticalPos("top");
      }
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      handleOpen();
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Alignment classes
  const alignClass =
    align === "right"
      ? "right-0"
      : align === "left"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  // Vertical placement classes
  const verticalClass =
    verticalPos === "top"
      ? "bottom-full mb-2.5"
      : "top-full mt-2.5";

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={handleToggle}
    >
      {/* Trigger element (badge or pill) */}
      <div className="cursor-pointer select-none">{children}</div>

      {/* Hover popover demonstration window */}
      {isOpen && (
        <div
          ref={popoverRef}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${alignClass} ${verticalClass} z-50 w-76 sm:w-80 p-3.5 bg-[#0a1118]/95 backdrop-blur-md border border-[rgba(63,85,102,0.6)] shadow-2xl rounded-[16px] text-xs font-sans text-slate-200 animate-in fade-in zoom-in-95 duration-150 select-none`}
          style={{
            boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${
                  target === "white"
                    ? "bg-white border border-black/20"
                    : "bg-black border border-white/40"
                }`}
              />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  WCAG 2.1 Kontrast
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {targetLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              <span className="text-sm font-bold text-white tracking-tight">
                {ratio.toFixed(2)}:1
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-[6px] tracking-tight ${getWcagScoreBadgeClass(
                  score
                )}`}
              >
                {scoreLabel}
              </span>
            </div>
          </div>

          {/* Visual Demonstrations ("Ukážka kontrastu") */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <Eye className="w-3 h-3 text-[#c8d400]" />
              <span>Živá ukážka čitateľnosti:</span>
            </div>

            {/* Preview 1: Target text on Brand Color background */}
            <div
              className="p-2.5 rounded-[10px] border border-white/10 transition-all shadow-inner"
              style={{
                backgroundColor: colorHex,
                color: targetHex,
              }}
            >
              <div className="text-[9px] font-mono uppercase opacity-75 mb-0.5 tracking-wider">
                {target === "white" ? "Biely text" : "Čierny text"} na farbe značky:
              </div>
              <div className="text-[13px] font-bold leading-tight tracking-tight">
                Veľký nadpis textu (18pt+)
              </div>
              <div className="text-[11px] opacity-90 leading-tight mt-1">
                Bežný text odseku: Rýchla hnedá líška skáče cez psa.
              </div>
            </div>

            {/* Preview 2: Brand Color as text on Target background */}
            <div
              className="p-2.5 rounded-[10px] border transition-all shadow-inner"
              style={{
                backgroundColor: targetHex,
                color: colorHex,
                borderColor: target === "white" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)",
              }}
            >
              <div
                className="text-[9px] font-mono uppercase mb-0.5 tracking-wider opacity-75"
                style={{ color: colorHex }}
              >
                Farba značky na {target === "white" ? "bielom" : "čiernom"} podklade:
              </div>
              <div className="text-[12px] font-bold leading-tight truncate">
                Tlačidlo / Dôležitý titulok
              </div>
              <div className="text-[11px] leading-tight mt-0.5 opacity-90 truncate">
                Odkaz a doplnkový obsah rozhrania.
              </div>
            </div>
          </div>

          {/* WCAG Compliance Checklist */}
          <div className="pt-2 border-t border-white/10 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Bežný text (&ge; 4.5:1):</span>
              {passesNormal ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3" /> Vyhovuje
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <X className="w-3 h-3" /> Nevyhovuje
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Veľký text (&ge; 3.0:1):</span>
              {passesLarge ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3" /> Vyhovuje
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <X className="w-3 h-3" /> Nevyhovuje
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">UI prvky & ikony (&ge; 3.0:1):</span>
              {passesUI ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3" /> Vyhovuje
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <X className="w-3 h-3" /> Nevyhovuje
                </span>
              )}
            </div>
          </div>

          {/* Quick evaluation note */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight">
            <Sparkles className="w-3.5 h-3.5 text-[#c8d400] shrink-0 mt-0.5" />
            <span>
              {ratio >= 7.0 && "Úroveň AAA: Špičkový kontrast pre akékoľvek texty bez obmedzení."}
              {ratio >= 4.5 && ratio < 7.0 && "Úroveň AA: Výborná čitateľnosť pre bežné odseky aj nadpisy."}
              {ratio >= 3.0 && ratio < 4.5 && "Úroveň AA+: Vhodné pre veľké nadpisy a ikony. Nevhodné pre drobný text."}
              {ratio < 3.0 && "Nevyhovuje: Nízky kontrast. Text bude na tomto pozadí ťažko čitateľný."}
            </span>
          </div>

          {/* Indicator triangle notch */}
          {verticalPos === "top" ? (
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#0a1118] border-r border-b border-[rgba(63,85,102,0.6)] rotate-45" />
          ) : (
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[#0a1118] border-l border-t border-[rgba(63,85,102,0.6)] rotate-45" />
          )}
        </div>
      )}
    </div>
  );
}
