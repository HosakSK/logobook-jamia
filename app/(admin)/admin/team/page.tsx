import { cookies } from "next/headers";
import Link from "next/link";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { TEAM_LIMITS } from "@/lib/validations/brand";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Crown, Edit3, Eye, Sparkles } from "lucide-react";

export default async function AdminGlobalTeamPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const currentUser = pb.authStore.record;
  const currentUserId = currentUser?.id || "";

  // 1. Fetch owned brands
  let ownedBrands: any[] = [];
  try {
    ownedBrands = await pb.collection("brands").getFullList({
      filter: `user = "${currentUserId}"`,
      sort: "-created",
    });
  } catch {
    // empty
  }

  // 2. Fetch shared brands where current user is a team member
  let sharedTeamRecords: any[] = [];
  try {
    sharedTeamRecords = await pb.collection("teamMembers").getFullList({
      filter: `user = "${currentUserId}"`,
      expand: "brand,brand.user",
      sort: "-created",
    });
  } catch {
    // empty
  }

  // 3. For each brand, get member counts
  const allBrandsWithTeamInfo = await Promise.all([
    ...ownedBrands.map(async (brand) => {
      let memberCount = 1;
      try {
        const teamList = await pb.collection("teamMembers").getFullList({
          filter: `brand = "${brand.id}"`,
        });
        const nonOwner = teamList.filter((m: any) => m.user !== brand.user);
        memberCount += nonOwner.length;
      } catch {
        // fallback
      }

      const userTier = (currentUser?.tier as string)?.toUpperCase() || "FREE";
      const maxSeats = TEAM_LIMITS[userTier] || 1;

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        role: "OWNER",
        isOwner: true,
        memberCount,
        maxSeats,
        tier: userTier,
      };
    }),
    ...sharedTeamRecords
      .filter((tm) => tm.expand?.brand && tm.expand.brand.user !== currentUserId)
      .map(async (tm) => {
        const brand = tm.expand.brand;
        let memberCount = 1;
        try {
          const teamList = await pb.collection("teamMembers").getFullList({
            filter: `brand = "${brand.id}"`,
          });
          const nonOwner = teamList.filter((m: any) => m.user !== brand.user);
          memberCount += nonOwner.length;
        } catch {
          // fallback
        }

        const ownerUser = brand.expand?.user;
        const ownerTier = (ownerUser?.tier as string)?.toUpperCase() || "FREE";
        const maxSeats = TEAM_LIMITS[ownerTier] || 1;

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          role: tm.role as "EDITOR" | "VIEWER",
          isOwner: false,
          memberCount,
          maxSeats,
          tier: ownerTier,
        };
      }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-[#c8d400]" />
            <span>{dict.admin.teamTitle}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dict.admin.teamOverviewDesc}
          </p>
        </div>
      </div>

      {/* Brands List with Team Info */}
      <div className="space-y-4">
        {allBrandsWithTeamInfo.length === 0 ? (
          <div className="border border-border/40 rounded-[3px] p-8 text-center bg-card space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">{dict.admin.noTeamMembersYet}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {allBrandsWithTeamInfo.map((item) => (
              <div
                key={item.id}
                className="border border-border/40 rounded-[3px] p-5 bg-card shadow-xs space-y-4 hover:border-border/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                      Brand Project
                    </span>
                    <h2 className="text-base font-bold text-foreground mt-0.5">{item.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.slug}.logobook.sk
                    </p>
                  </div>

                  {item.isOwner ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Crown className="h-3 w-3" /> OWNER
                    </span>
                  ) : item.role === "EDITOR" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-[#009f80]/15 text-[#009f80] border border-[#009f80]/30">
                      <Edit3 className="h-3 w-3" /> EDITOR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                      <Eye className="h-3 w-3" /> VIEWER
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted-foreground">Využité miesta:</span>
                    <p className="font-mono font-bold text-foreground">
                      {item.memberCount} / {item.maxSeats >= 999999 ? "∞" : item.maxSeats}
                    </p>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs rounded-[3px] border-border/60 gap-1.5 hover:bg-neutral-800/40"
                  >
                    <Link href={`/admin/brand/${item.id}/settings/team`}>
                      <span>{dict.admin.manageTeam}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
