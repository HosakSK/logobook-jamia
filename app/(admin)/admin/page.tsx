import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { CreateBrandModal } from "@/components/admin/create-brand-modal";
import { BrandGrid, BrandItem } from "@/components/admin/brand-grid";
import { TIER_LIMITS } from "@/lib/validations/brand";
import {
  getDictionary,
  DEFAULT_LOCALE,
  isValidLocale,
  Locale,
  getLocalizedValue,
} from "@/lib/i18n";
import { FolderKanban, HardDrive, ShieldCheck, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  if (!user || !pb.authStore.isValid) {
    redirect("/login?redirect=/admin");
  }

  // 1. Fetch user's accessible brands from PocketBase
  let brandsRaw: any[] = [];
  try {
    brandsRaw = await pb.collection("brands").getFullList();
  } catch (err) {
    console.error("Failed to fetch brands in admin dashboard:", err);
  }

  // 2. Fetch team memberships for role distinction (Owner vs Editor)
  const teamMemberships: Record<string, string> = {};
  try {
    const tm = await pb.collection("teamMembers").getFullList({
      filter: `user = "${user.id}"`,
    });
    tm.forEach((item) => {
      teamMemberships[item.brand] = item.role;
    });
  } catch (err) {
    console.error("Failed to fetch team memberships:", err);
  }

  // 3. Map into clean BrandItem objects
  const brands: BrandItem[] = brandsRaw.map((b) => {
    const isOwner = b.user === user.id;
    const role = isOwner ? "OWNER" : (teamMemberships[b.id] || "EDITOR");
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      customDomain: b.customDomain || undefined,
      isDomainVerified: b.isDomainVerified || false,
      status: b.status || "DEV",
      role,
      description: getLocalizedValue(b.description, currentLocale) || undefined,
      updated: b.updated,
    };
  });

  // 4. Calculate subscription tier metrics
  const userTier = (user.tier as string)?.toUpperCase() || "FREE";
  const maxBrands = TIER_LIMITS[userTier] ?? 1;
  const ownedBrandsCount = brands.filter((b) => b.role === "OWNER").length;
  const liveBrandsCount = brands.filter((b) => b.status === "LIVE").length;

  // Storage quota representation per tier
  const storageLimits: Record<string, string> = {
    FREE: "500 MB",
    COMPANY: "2 GB",
    FREELANCER: "10 GB",
    AGENCY: "50 GB",
    PLATINUM: "200 GB",
  };
  const tierStorage = storageLimits[userTier] || "500 MB";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header bar with CreateBrand button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {dict.admin.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
            {dict.admin.subtitle}
          </p>
        </div>

        <CreateBrandModal
          userTier={userTier}
          ownedBrandsCount={ownedBrandsCount}
          maxBrands={maxBrands}
          locale={currentLocale}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Brands count */}
        <div className="card-dark p-5 rounded-[3px] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">{dict.admin.activeBrands}</span>
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{brands.length}</div>
          <span className="text-[11px] text-[#009f80] font-medium block">
            {liveBrandsCount} {dict.admin.statusLive}
          </span>
        </div>

        {/* Metric 2: Subscription Plan & Limit */}
        <div className="card-dark p-5 rounded-[3px] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">{dict.admin.currentPlan}</span>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{userTier}</div>
          <span className="text-[11px] text-muted-foreground font-light block">
            {ownedBrandsCount} / {maxBrands} {dict.admin.allBrands.toLowerCase()}
          </span>
        </div>

        {/* Metric 3: Storage Quota */}
        <div className="card-dark p-5 rounded-[3px] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">{dict.admin.storageQuota}</span>
            <HardDrive className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">0 MB</div>
          <span className="text-[11px] text-muted-foreground font-light block">
            Max {tierStorage} limit
          </span>
        </div>
      </div>

      {/* Main Brands Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            {dict.admin.brandsListTitle}
          </h2>
        </div>

        <BrandGrid brands={brands} locale={currentLocale} />
      </div>
    </div>
  );
}
