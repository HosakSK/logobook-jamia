"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyManualPasswordAction } from "@/actions/auth";

interface ManualLockScreenProps {
  brandSlug: string;
  brandName: string;
  headerLogoUrl?: string;
  locale?: string;
}

export function ManualLockScreen({
  brandSlug,
  brandName,
  headerLogoUrl,
  locale = "sk",
}: ManualLockScreenProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(locale === "en" ? "Please enter a password." : "Zadajte prosím heslo.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append("password", password.trim());

      const res = await verifyManualPasswordAction(brandSlug, formData);
      if (!res.success) {
        setError(res.error || (locale === "en" ? "Incorrect password." : "Nesprávne heslo."));
        return;
      }

      // Successfully authorized! Refresh the route to render the unlocked manual
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Chyba pri overovaní.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <div className="w-full max-w-md border border-border/80 rounded-[4px] p-8 sm:p-10 bg-card shadow-lg space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-4">
          {headerLogoUrl ? (
            <img
              src={headerLogoUrl}
              alt={brandName}
              className="h-12 w-auto max-w-[200px] object-contain mx-auto transition-opacity"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-[4px] text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto shadow-xs"
              style={{
                backgroundColor: "var(--brand-color-primary, #c8d400)",
                borderRadius: "var(--brand-radius, 4px)",
              }}
            >
              {brandName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {brandName}
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span>
                {locale === "en" ? "Protected Brand Guidelines" : "Chránený Brand Manuál"}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {locale === "en"
              ? "This visual identity manual is password protected. Enter the access key to unlock the guidelines."
              : "Tento manuál vizuálnej identity je chránený heslom. Pre zobrazenie obsahu zadajte prístupový kľúč."}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-[3px] bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={locale === "en" ? "Enter password..." : "Zadajte heslo..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={isSubmitting}
                className="pr-10 h-10 text-sm rounded-[3px] bg-muted/30 border-border/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full h-10 text-xs font-semibold gap-2 rounded-[3px] bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{locale === "en" ? "Verifying..." : "Overujem heslo..."}</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>{locale === "en" ? "Unlock Manual" : "Odomknúť manuál"}</span>
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>{locale === "en" ? "Encrypted Access" : "Zabezpečený prístup"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
