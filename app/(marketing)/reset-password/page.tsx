"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { resetPasswordAction } from "@/actions/auth";
import { getDictionary, Locale, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n";
import { BookOpen, ArrowLeft, MailCheck, Loader2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const queryLocale = searchParams.get("locale");
  const currentLocale: Locale = queryLocale && isValidLocale(queryLocale) ? queryLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      const res = await resetPasswordAction(null, formData);

      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || "Failed to process request");
      }
    } catch {
      setError("Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
            <div className="h-8 w-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <span>Logobook<span className="text-neutral-400 font-normal">.sk</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={currentLocale} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {isSuccess ? (
            <div className="bg-card border rounded-2xl p-8 shadow-xs text-center space-y-6 animate-in fade-in-50">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <MailCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {dict.resetPassword.successTitle}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dict.resetPassword.successDesc}
                </p>
                <div className="p-2.5 bg-muted/60 rounded-lg text-xs font-mono font-medium text-foreground">
                  {email}
                </div>
              </div>

              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link href={`/login${queryLocale ? `?locale=${queryLocale}` : ""}`}>
                    {dict.resetPassword.backToLogin}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {dict.resetPassword.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dict.resetPassword.subtitle}
                </p>
              </div>

              <div className="bg-card border rounded-2xl p-8 shadow-xs space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {dict.resetPassword.emailLabel}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder={dict.resetPassword.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {dict.resetPassword.submitting}
                      </span>
                    ) : (
                      dict.resetPassword.submitButton
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{dict.resetPassword.backToLogin}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
