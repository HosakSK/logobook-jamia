"use server";

import { getServerPocketBase } from "@/lib/pocketbase-server";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/team";
import { TEAM_LIMITS } from "@/lib/validations/brand";
import { revalidatePath } from "next/cache";

// Helper to verify that current user is OWNER of the brand
async function verifyBrandOwner(pb: any, brandId: string, currentUserId: string) {
  const brand = await pb.collection("brands").getOne(brandId);
  const isDirectOwner = brand.user === currentUserId;

  if (isDirectOwner) {
    return { brand, isOwner: true };
  }

  try {
    const tm = await pb.collection("teamMembers").getFirstListItem(
      `brand = "${brandId}" && user = "${currentUserId}" && role = "OWNER"`
    );
    if (tm) return { brand, isOwner: true };
  } catch {
    // not owner
  }

  throw new Error("Only the project owner can manage team members.");
}

export async function inviteMemberAction(
  brandId: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session. Please sign in again." };
    }

    // 1. Verify that current user is OWNER
    const { brand } = await verifyBrandOwner(pb, brandId, user.id);

    // 2. Determine Owner's Tier and Team Limit
    let ownerTier = (user.tier as string)?.toUpperCase() || "FREE";
    if (brand.user !== user.id) {
      try {
        const ownerUser = await pb.collection("users").getOne(brand.user);
        ownerTier = (ownerUser.tier as string)?.toUpperCase() || "FREE";
      } catch {
        // fallback to current user tier
      }
    }

    const maxAllowedMembers = TEAM_LIMITS[ownerTier] || 1;

    // 3. Count existing team members (Owner + records in teamMembers)
    const existingMembers = await pb.collection("teamMembers").getFullList({
      filter: `brand = "${brandId}"`,
    });

    // Total team size: 1 (Owner) + members in teamMembers (excluding owner if duplicate)
    const nonOwnerMembers = existingMembers.filter((m: any) => m.user !== brand.user);
    const totalTeamSize = 1 + nonOwnerMembers.length;

    if (totalTeamSize >= maxAllowedMembers) {
      return {
        success: false,
        error: `Limit členov tímu pre balíček ${ownerTier} (${maxAllowedMembers}) bol dosiahnutý. Prejdite na vyšší balík pre prizvanie ďalších kolegov.`,
      };
    }

    // 4. Validate input
    const rawData = {
      email: formData.get("email")?.toString(),
      role: formData.get("role")?.toString(),
    };

    const parsed = inviteMemberSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data",
      };
    }

    // 5. Check if target user exists in users collection
    let targetUser: any = null;
    try {
      targetUser = await pb.collection("users").getFirstListItem(`email = "${parsed.data.email}"`);
    } catch {
      return {
        success: false,
        error: "Používateľ s týmto e-mailom zatiaľ nie je registrovaný na Logobook.sk. Požiadajte ho, aby sa bezplatne zaregistroval, a potom ho pozvite znova.",
      };
    }

    // 6. Check if target user is already owner or member
    if (targetUser.id === brand.user) {
      return {
        success: false,
        error: "Tento používateľ je už vlastníkom tohto projektu.",
      };
    }

    const alreadyMember = nonOwnerMembers.some((m: any) => m.user === targetUser.id);
    if (alreadyMember) {
      return {
        success: false,
        error: "Tento používateľ už je členom tímu tohto projektu.",
      };
    }

    // 7. Insert new team member record
    await pb.collection("teamMembers").create({
      user: targetUser.id,
      brand: brandId,
      role: parsed.data.role,
    });

    revalidatePath(`/admin/brand/${brandId}/settings/team`);
    revalidatePath(`/admin/brand/${brandId}/settings`);
    revalidatePath("/admin/team");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to invite team member:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to invite member",
    };
  }
}

export async function updateMemberRoleAction(
  teamMemberId: string,
  newRole: "EDITOR" | "VIEWER"
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const parsed = updateMemberRoleSchema.safeParse({ role: newRole });
    if (!parsed.success) {
      return { success: false, error: "Invalid role specified." };
    }

    const memberRecord = await pb.collection("teamMembers").getOne(teamMemberId);
    const { brand } = await verifyBrandOwner(pb, memberRecord.brand, user.id);

    if (memberRecord.user === brand.user) {
      return { success: false, error: "Cannot modify role of the project owner." };
    }

    await pb.collection("teamMembers").update(teamMemberId, {
      role: parsed.data.role,
    });

    revalidatePath(`/admin/brand/${memberRecord.brand}/settings/team`);
    revalidatePath(`/admin/brand/${memberRecord.brand}/settings`);
    revalidatePath("/admin/team");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update member role:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update role",
    };
  }
}

export async function removeMemberAction(
  teamMemberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session." };
    }

    const memberRecord = await pb.collection("teamMembers").getOne(teamMemberId);
    const { brand } = await verifyBrandOwner(pb, memberRecord.brand, user.id);

    if (memberRecord.user === brand.user) {
      return { success: false, error: "Cannot remove the project owner from the team." };
    }

    await pb.collection("teamMembers").delete(teamMemberId);

    revalidatePath(`/admin/brand/${memberRecord.brand}/settings/team`);
    revalidatePath(`/admin/brand/${memberRecord.brand}/settings`);
    revalidatePath("/admin/team");

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to remove team member:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove member",
    };
  }
}
