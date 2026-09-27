"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/brand/logo";
import { registerAction, resendVerificationAction } from "@/actions/auth";
import { getDictionary, Locale, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n";
import { AlertCircle, ArrowLeft, MailCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const queryLocale = searchParams.get("locale");
  const currentLocale: Locale = queryLocale && isValidLocale(queryLocale) ? queryLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError(currentLocale === "sk" ? "Heslá sa nezhodujú." : currentLocale === "cs" ? "Hesla se neshodují." : "Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError(currentLocale === "sk" ? "Heslo musí mať aspoň 8 znakov." : currentLocale === "cs" ? "Heslo musí mít alespoň 8 znaků." : "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("passwordConfirm", passwordConfirm);

      const res = await registerAction(null, formData);

      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || dict.register.errorGeneric);
      }
    } catch (err) {
      console.error(err);
      setError(dict.register.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendStatus(dict.register.submitting);
      const res = await resendVerificationAction(email);
      if (res.success) {
        setResendStatus(dict.register.emailSentSuccess);
      } else {
        setResendStatus(res.error || "Error resending email");
      }
    } catch {
      setResendStatus("Error resending email");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-dark text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" mode="dark" href="/" priority />
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={currentLocale} />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {isSuccess ? (
            /* Check Email Confirmation Card */
            <div className="card-dark p-8 text-center space-y-6 animate-in fade-in-50">
              <div className="h-14 w-14 rounded-[3px] bg-[#009f80]/15 text-[#009f80] mx-auto flex items-center justify-center border border-[#009f80]/40">
                <MailCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {dict.register.checkEmailTitle}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">
                  {dict.register.checkEmailDesc}
                </p>
                <div className="p-2.5 bg-input border border-border rounded-[3px] text-xs font-mono font-medium text-foreground">
                  {email}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button asChild className="w-full">
                  <Link href={`/login${queryLocale ? `?locale=${queryLocale}` : ""}`}>
                    {dict.register.goToLogin}
                  </Link>
                </Button>

                <div>
                  <button
                    onClick={handleResend}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    {dict.register.resendLink}
                  </button>
                  {resendStatus && (
                    <p className="text-xs text-[#009f80] mt-1 font-medium">
                      {resendStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form Card */
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {dict.register.title}
                </h1>
                <p className="text-sm text-muted-foreground font-light">
                  {dict.register.subtitle}
                </p>
              </div>

              <div className="card-dark p-8 space-y-6">
                {error && (
                  <div className="p-3 rounded-[3px] bg-[#bb4934]/15 border border-[#bb4934]/40 text-[#fafbfc] text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-[#bb4934]" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {dict.register.nameLabel}
                    </label>
                    <Input
                      type="text"
                      placeholder={dict.register.namePlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {dict.register.emailLabel}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder={dict.register.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {dict.register.passwordLabel}
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder={dict.register.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {dict.register.passwordConfirmLabel}
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder={dict.register.passwordConfirmPlaceholder}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {dict.register.submitting}
                      </span>
                    ) : (
                      dict.register.submitButton
                    )}
                  </Button>
                </form>

                <div className="pt-4 border-t flex items-center justify-center text-xs text-muted-foreground gap-1">
                  <span>{dict.register.hasAccount}</span>
                  <Link
                    href={`/login${queryLocale ? `?locale=${queryLocale}` : ""}`}
                    className="font-semibold text-foreground underline hover:text-primary transition-colors"
                  >
                    {dict.register.signIn}
                  </Link>
                </div>
              </div>
            </>
          )}

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
