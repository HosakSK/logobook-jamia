import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { TEAM_LIMITS } from "@/lib/validations/brand";
import { TeamMembersTable, TeamMemberItem } from "@/components/admin/team/team-members-table";
import { InviteMemberModal } from "@/components/admin/team/invite-member-modal";
import { ArrowLeft, Users, Shield, Edit3, Eye, Sparkles } from "lucide-react";

export default async function BrandTeamPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  const currentUser = pb.authStore.record;

  let brand: any = null;
  try {
    brand = await pb.collection("brands").getOne(brandId, { expand: "user" });
  } catch {
    try {
      brand = await pb.collection("brands").getFirstListItem(`slug = "${brandId}"`, { expand: "user" });
    } catch {
      notFound();
    }
  }

  // Get Owner User record
  let ownerUser: any = brand.expand?.user;
  if (!ownerUser && brand.user) {
    try {
      ownerUser = await pb.collection("users").getOne(brand.user);
    } catch {
      // fallback
    }
  }

  const ownerTier = (ownerUser?.tier as string)?.toUpperCase() || "FREE";
  const maxSeats = TEAM_LIMITS[ownerTier] || 1;

  // Fetch all team members for this brand with expanded user
  let rawTeamMembers: any[] = [];
  try {
    rawTeamMembers = await pb.collection("teamMembers").getFullList({
      filter: `brand = "${brand.id}"`,
      expand: "user",
    });
  } catch {
    // empty
  }

  // Construct structured members list:
  // 1. Owner first
  const membersList: TeamMemberItem[] = [];
  if (ownerUser) {
    membersList.push({
      id: "owner-" + ownerUser.id,
      userId: ownerUser.id,
      name: ownerUser.name || "Owner",
      email: ownerUser.email || "",
      avatar: ownerUser.avatar || "",
      role: "OWNER",
      isOwner: true,
    });
  }

  // 2. Collaborators from teamMembers
  for (const tm of rawTeamMembers) {
    const u = tm.expand?.user;
    if (u && u.id !== ownerUser?.id) {
      membersList.push({
        id: tm.id,
        userId: u.id,
        name: u.name || u.email,
        email: u.email,
        avatar: u.avatar || "",
        role: tm.role as "OWNER" | "EDITOR" | "VIEWER",
        isOwner: false,
      });
    }
  }

  const isCurrentUserOwner = currentUser?.id === ownerUser?.id;
  const usedSeats = membersList.length;
  const isLimitReached = usedSeats >= maxSeats;
  const isFreePlan = ownerTier === "FREE";
  const isInviteLocked = isFreePlan || isLimitReached || !isCurrentUserOwner;

  let lockReason = "";
  if (!isCurrentUserOwner) {
    lockReason = "Iba vlastník projektu môže pozývať členov tímu.";
  } else if (isFreePlan) {
    lockReason = "Bezplatný balíček FREE nepodporuje tímovú spoluprácu. Prejdite na Company alebo vyšší.";
  } else if (isLimitReached) {
    lockReason = `Dosiahli ste maximálny počet členov tímu (${maxSeats}) pre balíček ${ownerTier}.`;
  }

  const percentUsed = Math.min(100, Math.round((usedSeats / maxSeats) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/admin/brand/${brandId}/settings`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>{dict.admin.brandSettings}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-[#c8d400]" />
            <span>{dict.admin.teamTitle}:</span>
            <span className="text-primary">{brand.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dict.admin.teamSubtitle}
          </p>
        </div>

        <InviteMemberModal
          brandId={brand.id}
          isLocked={isInviteLocked}
          lockReason={lockReason}
          dict={dict}
        />
      </div>

      {/* Seats Usage Bar */}
      <div className="border border-border/40 rounded-[3px] p-5 bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{dict.admin.teamSeatsUsed}:</span>
            <span className="font-mono text-[#c8d400] font-bold">
              {usedSeats} / {maxSeats >= 999999 ? "∞" : maxSeats}
            </span>
            <span className="text-muted-foreground">({dict.admin.teamSeatsDesc})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[3px] bg-[#c8d400]/10 text-[#c8d400] text-[10px] font-mono font-bold tracking-wider uppercase border border-[#c8d400]/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Plán {ownerTier}
            </span>
            {isLimitReached && !isFreePlan && (
              <Link
                href="/admin/billing"
                className="text-[11px] text-[#c8d400] hover:underline font-semibold"
              >
                Zvýšiť limit →
              </Link>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-border/40">
          <div
            className={`h-full transition-all ${
              percentUsed >= 100 ? "bg-amber-400" : "bg-[#c8d400]"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Team Members Table */}
      <TeamMembersTable
        brandId={brand.id}
        members={membersList}
        currentUserId={currentUser?.id || ""}
        isCurrentUserOwner={isCurrentUserOwner}
        dict={dict}
      />

      {/* Role Descriptions Card */}
      <div className="border border-border/30 rounded-[3px] p-5 bg-background/40 space-y-3 text-xs">
        <h3 className="font-bold text-foreground flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          <span>Vysvetlenie prístupových rolí v projekte</span>
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 pt-1 text-[11px] text-muted-foreground">
          <div className="p-3 rounded-[3px] border border-border/40 bg-card space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              OWNER
            </span>
            <p>Plný prístup k projektu. Môže spravovať a mazať celý manuál, meniť domény a pozývať/odoberať členov.</p>
          </div>
          <div className="p-3 rounded-[3px] border border-border/40 bg-card space-y-1">
            <span className="font-bold text-[#009f80] flex items-center gap-1">
              EDITOR
            </span>
            <p>{dict.admin.roleEditorDesc}</p>
          </div>
          <div className="p-3 rounded-[3px] border border-border/40 bg-card space-y-1">
            <span className="font-bold text-neutral-300 flex items-center gap-1">
              VIEWER
            </span>
            <p>{dict.admin.roleViewerDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
