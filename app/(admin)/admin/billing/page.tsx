import { cookies } from "next/headers";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { CreditCard, HardDrive, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminBillingPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.admin.billing}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review subscription tier, active quotas, and invoice history.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="border rounded-2xl p-6 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Current Plan
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800">
              FREE TIER
            </span>
          </div>
          <div className="text-3xl font-black">€0 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
          <ul className="text-xs space-y-2 text-muted-foreground pt-2 border-t">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>1 Active Brand Manual</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>500 MB S3 Cloud Storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Multi-Language i18n Fallback</span>
            </li>
          </ul>
        </div>

        <div className="border rounded-2xl p-6 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Storage Usage
            </span>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-black">12.4 MB <span className="text-xs font-normal text-muted-foreground">/ 500 MB</span></div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full w-[2.5%]" />
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Storage quota is enforced via PocketBase storage hooks.
          </p>
        </div>
      </div>
    </div>
  );
}
