import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Locale, getDictionary } from "@/lib/i18n";
import { Heart } from "lucide-react";

interface MarketingFooterProps {
  currentLocale: Locale;
}

export function MarketingFooter({ currentLocale }: MarketingFooterProps) {
  const dict = getDictionary(currentLocale);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.08] bg-[#05080c] py-14 md:py-16 text-muted-foreground text-xs">
      <div className="container mx-auto px-4 sm:px-8 max-w-6xl space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          {/* Logo & Slogan */}
          <div className="space-y-2">
            <Logo variant="full" mode="dark" href="/" />
            <p className="text-muted-foreground/80 font-light text-xs max-w-md">
              Living Brand Guidelines & Design System Platform pre moderné dizajnérske tímy a agentúry.
            </p>
          </div>

          {/* Quick legal & compliance links (Temporary dummy links per task spec) */}
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <a
              href="#cookies"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Nastavenie cookies (bude doplnené)"
            >
              {dict.marketing.footerCookies}
            </a>
            <a
              href="#gdpr"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Ochrana osobných údajov (bude doplnené)"
            >
              {dict.marketing.footerPrivacy}
            </a>
            <a
              href="#vop"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Všeobecné obchodné podmienky"
            >
              {dict.marketing.footerTerms}
            </a>
            <a
              href="https://github.com/HosakSK/logobook-jamia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>{dict.marketing.footerOpenSource}</span>
            </a>
          </div>
        </div>

        {/* Bottom bar with operator and rights */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/60">
          <div>
            © {currentYear} {dict.marketing.footerOperator}
          </div>
          <div className="flex items-center gap-1">
            <span>Vytvorené s vášňou pre precízny dizajn</span>
            <Heart className="w-3 h-3 text-red-500 fill-current inline-block mx-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
