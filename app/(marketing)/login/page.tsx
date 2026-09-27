"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/brand/logo";
import { pb } from "@/lib/pocketbase";
import { loginAction } from "@/actions/auth";
import { getDictionary, Locale, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine current locale from query param or fallback
  const queryLocale = searchParams.get("locale");
  const currentLocale: Locale = queryLocale && isValidLocale(queryLocale) ? queryLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const redirectPath = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      // 1. Direct PocketBase client SDK authentication
      let clientAuthSuccess = false;
      try {
        const clientAuth = await pb.collection("users").authWithPassword(cleanEmail, cleanPassword);
        if (clientAuth && clientAuth.token) {
          clientAuthSuccess = true;
          const rawCookie = pb.authStore.exportToCookie({
            httpOnly: false,
            sameSite: "lax",
            secure: window.location.protocol === "https:",
            path: "/",
          });
          const match = rawCookie.match(/pb_auth=([^;]+)/);
          if (match && match[1]) {
            document.cookie = `pb_auth=${match[1]}; Path=/; SameSite=Lax; Max-Age=2592000`;
          }
        }
      } catch (clientErr) {
        console.warn("Client SDK auth attempt notice:", clientErr);
      }

      // 2. Server Action authentication for HTTP-only cookie
      const formData = new FormData();
      formData.set("email", cleanEmail);
      formData.set("password", cleanPassword);

      let serverRes: any = null;
      try {
        serverRes = await loginAction(null, formData);
      } catch (serverErr) {
        console.warn("Server action login attempt notice:", serverErr);
      }

      if (clientAuthSuccess || serverRes?.success) {
        window.location.href = redirectPath;
      } else {
        setError(serverRes?.error || dict.login.invalidCredentials);
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (pb.authStore.isValid) {
        window.location.href = redirectPath;
        return;
      }
      setError(dict.login.invalidCredentials);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-dark text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" mode="dark" href="/" priority />
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {dict.login.title}
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              {dict.login.subtitle}
            </p>
          </div>

          <div className="card-dark p-8 space-y-6">
            {/* Quick Demo Credentials */}
            <div className="p-3 rounded-[3px] bg-secondary/30 border border-border/60 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">💡 Testovacie prístupy</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("jakub@jamia.sk");
                    setPassword("Password123!");
                  }}
                  className="text-[10px] text-primary hover:underline font-mono cursor-pointer"
                >
                  Vyplniť automaticky
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 font-mono">
                <div>jakub@jamia.sk / Password123!</div>
                <div>demo@jamia.sk / Password123!</div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-[3px] bg-[#bb4934]/15 border border-[#bb4934]/40 text-[#fafbfc] text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#bb4934]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {dict.login.emailLabel}
                </label>
                <Input
                  type="email"
                  required
                  placeholder={dict.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-foreground">
                    {dict.login.passwordLabel}
                  </label>
                  <Link
                    href={`/reset-password${queryLocale ? `?locale=${queryLocale}` : ""}`}
                    className="text-muted-foreground hover:underline"
                  >
                    {dict.login.forgotPassword}
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  placeholder={dict.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                  {dict.login.rememberMe}
                </label>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {dict.login.submitting}
                  </span>
                ) : (
                  dict.login.submitButton
                )}
              </Button>
            </form>

            <div className="pt-4 border-t flex items-center justify-center text-xs text-muted-foreground gap-1">
              <span>{dict.login.noAccount}</span>
              <Link
                href={`/register${queryLocale ? `?locale=${queryLocale}` : ""}`}
                className="font-semibold text-foreground underline hover:text-primary transition-colors"
              >
                {dict.login.signUp}
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{dict.login.backToHome}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
