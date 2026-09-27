"use client";

import { useState } from "react";
import { resendVerificationAction } from "@/actions/auth";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

interface VerificationBannerProps {
  email: string;
  locale?: Locale;
}

export function VerificationBanner({ email, locale = DEFAULT_LOCALE }: VerificationBannerProps) {
  const dict = getDictionary(locale);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await resendVerificationAction(email);
      if (res.success) {
        setSent(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          {dict.verificationBanner.warning}{" "}
          <strong className="font-semibold underline">{email}</strong>
        </span>
      </div>

      <div>
        {sent ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            {dict.verificationBanner.resentSuccess}
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            className="font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {dict.verificationBanner.resendButton}
          </button>
        )}
      </div>
    </div>
  );
}
