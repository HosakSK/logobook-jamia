import React from "react";

export function ModuleLoadingSkeleton({
  height = "120px",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-[3px] bg-neutral-900/40 border border-border/30 p-6 animate-pulse space-y-3 ${className}`}
      style={{ minHeight: height }}
      aria-busy="true"
      aria-label="Načítavam obsah modulu..."
    >
      <div className="h-4 bg-neutral-800 rounded-[2px] w-1/3" />
      <div className="h-3 bg-neutral-800/60 rounded-[2px] w-2/3" />
      <div className="h-3 bg-neutral-800/40 rounded-[2px] w-1/2" />
    </div>
  );
}
