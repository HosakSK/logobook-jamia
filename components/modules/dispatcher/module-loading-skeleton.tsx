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
      className={`w-full rounded-[var(--brand-radius,6px)] bg-card border border-border/50 p-6 animate-pulse space-y-3 shadow-xs ${className}`}
      style={{ minHeight: height }}
      aria-busy="true"
      aria-label="Načítavam obsah modulu..."
    >
      <div className="h-4 bg-muted rounded-[var(--brand-radius,2px)] w-1/3" />
      <div className="h-3 bg-muted/70 rounded-[var(--brand-radius,2px)] w-2/3" />
      <div className="h-3 bg-muted/50 rounded-[var(--brand-radius,2px)] w-1/2" />
    </div>
  );
}
