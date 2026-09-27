import { cookies } from "next/headers";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getUsageStatsAction } from "@/actions/billing";
import { BillingView } from "@/components/admin/billing/billing-view";

export default async function AdminBillingPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const stats = await getUsageStatsAction();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">{dict.admin.billing}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentLocale === "sk"
            ? "Prehľad vášho predplatného, využitia kvót a ponuka balíčkov pre jednotlivcov aj agentúry."
            : currentLocale === "cs"
            ? "Přehled vašeho předplatného, využití kvót a nabídka balíčků pro jednotlivce i agentury."
            : "Review your subscription tier, active resource quotas, and available plans."}
        </p>
      </div>

      <BillingView stats={stats} dict={dict} />
    </div>
  );
}
