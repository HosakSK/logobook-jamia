"use client";

import * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Purge any stale legacy theme keys from localStorage
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("theme");
      }
    } catch {}
  }, []);

  return <>{children}</>;
}

