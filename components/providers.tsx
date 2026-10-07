"use client";

import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Purge any stale legacy theme keys from localStorage to prevent rogue light mode
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("theme");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    } catch {}
  }, []);

  return <>{children}</>;
}

