import { cookies } from "next/headers";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { User, Mail, ShieldCheck, Calendar } from "lucide-react";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.admin.profile}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dict.admin.accountSettings}
        </p>
      </div>

      <div className="border rounded-2xl p-6 sm:p-8 bg-card shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xl shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {user?.name || "Account Owner"}
            </h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground">{dict.admin.currentPlan}</span>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">
                {user?.tier || "FREE"}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground">Verification Status</span>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              {user?.verified ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Unverified</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
