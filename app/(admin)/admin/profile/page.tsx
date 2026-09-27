import { cookies } from "next/headers";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { ProfileInfoForm } from "@/components/admin/profile/profile-info-form";
import { ChangePasswordForm } from "@/components/admin/profile/change-password-form";
import { AgencyDefaultsForm } from "@/components/admin/profile/agency-defaults-form";
import { ShieldCheck, Sparkles } from "lucide-react";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  const userTier = (user?.tier as string)?.toUpperCase() || "FREE";
  const isAgencyTier = userTier === "AGENCY" || userTier === "PLATINUM";

  let agencyDefaultsRecord: {
    defaultClearanceZone?: { percent?: number };
    defaultMinSize?: { printMm?: number; digitalPx?: number };
    defaultRules?: { text?: string };
    defaultPageTree?: { template?: string };
  } | null = null;

  if (isAgencyTier && user?.id) {
    try {
      const rec = await pb.collection("agencyDefaults").getFirstListItem(`user = "${user.id}"`);
      if (rec) {
        agencyDefaultsRecord = {
          defaultClearanceZone: rec.defaultClearanceZone,
          defaultMinSize: rec.defaultMinSize,
          defaultRules: rec.defaultRules,
          defaultPageTree: rec.defaultPageTree,
        };
      }
    } catch {
      // no defaults record yet
    }
  }

  const serializedUser = {
    id: user?.id || "",
    name: (user?.name as string) || "",
    email: (user?.email as string) || "",
    avatar: (user?.avatar as string) || "",
    locale: (user?.locale as string) || currentLocale,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{dict.admin.profileTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dict.admin.profileSubtitle}
        </p>
      </div>

      {/* Account Overview Bar */}
      <div className="border border-border/40 rounded-[3px] p-5 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.admin.currentPlan}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-1 rounded-[3px] bg-[#c8d400]/15 text-[#c8d400] text-xs font-mono font-bold tracking-wider uppercase border border-[#c8d400]/30 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              {userTier}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.verified ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> E-mail overený
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-amber-950/40 text-amber-400 border border-amber-500/30 text-xs font-medium">
              E-mail neoverený
            </span>
          )}
        </div>
      </div>

      {/* 1. Profile Information & Avatar Form */}
      <ProfileInfoForm user={serializedUser} dict={dict} />

      {/* 2. Security & Password Change */}
      <ChangePasswordForm dict={dict} />

      {/* 3. Agency Defaults (only for AGENCY and PLATINUM tiers) */}
      {isAgencyTier && (
        <AgencyDefaultsForm initialDefaults={agencyDefaultsRecord} dict={dict} />
      )}
    </div>
  );
}
