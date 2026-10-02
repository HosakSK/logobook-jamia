"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Locale, getDictionary } from "@/lib/i18n";
import { Menu, X, ArrowRight } from "lucide-react";

interface MarketingNavProps {
  currentLocale: Locale;
}

export function MarketingNav({ currentLocale }: MarketingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dict = getDictionary(currentLocale);

  const navLinks = [
    { href: "#funkcie", label: dict.marketing.navFeatures },
    { href: "#ako-to-funguje", label: dict.marketing.navHowItWorks },
    { href: "#cennik", label: dict.marketing.navPricing },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2b3b48]/60 bg-[#0e161d]/90 backdrop-blur-xl transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Logo variant="full" mode="dark" href="/" priority />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right Controls: Language & Register CTA (STRICTLY NO LOGIN BUTTON) */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher currentLocale={currentLocale} />
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(200,212,0,0.18)]"
          >
            <span>{dict.marketing.navRegister}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher currentLocale={currentLocale} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.05] border border-[#2b3b48]/60 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#2b3b48]/60 bg-[#121a23]/98 backdrop-blur-2xl px-4 py-5 animate-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-1.5"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-white/[0.08]">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-black text-xs font-semibold shadow-[0_0_20px_rgba(200,212,0,0.2)]"
            >
              <span>{dict.marketing.navRegister}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
