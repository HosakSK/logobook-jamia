"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly without exposing sensitive info
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4 bg-background">
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">Nastala neočakávaná chyba</h2>
        <p className="text-sm text-muted-foreground">
          Ospravedlňujeme sa, pri načítaní stránky došlo k chybe. Skúste akciu zopakovať.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button onClick={() => reset()} variant="default">
            Skúsiť znova
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            Domov
          </Button>
        </div>
      </div>
    </div>
  );
}
