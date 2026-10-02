import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureBlocks } from "@/components/marketing/feature-blocks";
import { PricingSection } from "@/components/marketing/pricing-section";

export default async function MarketingPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  return (
    <div className="flex flex-col">
      <HeroSection currentLocale={currentLocale} />
      <FeatureBlocks currentLocale={currentLocale} />
      <PricingSection currentLocale={currentLocale} />
    </div>
  );
}
