"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { getContrastBetween } from "@/lib/utils/color-calc";

interface WcagContrastBadgeProps {
  foregroundHex?: string | null;
  backgroundHex?: string | null;
  showWarningText?: boolean;
  className?: string;
}

export function WcagContrastBadge({
  foregroundHex,
  backgroundHex,
  showWarningText = true,
  className = "",
}: WcagContrastBadgeProps) {
  if (!foregroundHex || !backgroundHex) return null;

  const result = getContrastBetween(foregroundHex, backgroundHex);

  const getScoreBadge = () => {
    switch (result.score) {
      case "AAA":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            WCAG AAA ({result.ratio}:1)
          </span>
        );
      case "AA":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CheckCircle2 className="h-3 w-3" />
            WCAG AA ({result.ratio}:1)
          </span>
        );
      case "AA Large":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            WCAG AA Large ({result.ratio}:1)
          </span>
        );
      case "Fail":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-3 w-3" />
            WCAG Fail ({result.ratio}:1)
          </span>
        );
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        {getScoreBadge()}
        <span className="text-[10px] text-muted-foreground">
          Pomer kontrastu textu voči pozadiu
        </span>
      </div>

      {showWarningText && result.warning && (
        <div className="flex items-start gap-1.5 p-2 rounded-[2px] bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 leading-tight">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
          <span>{result.warning}</span>
        </div>
      )}
    </div>
  );
}
