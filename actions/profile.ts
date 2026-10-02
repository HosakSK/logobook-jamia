"use server";

import { getServerPocketBase, savePocketBaseCookie } from "@/lib/pocketbase-server";
import { updateProfileSchema, changePasswordSchema, agencyDefaultsSchema } from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateUserProfileAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session. Please sign in again." };
    }

    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      locale: formData.get("locale")?.toString() || "sk",
    };

    const parsed = updateProfileSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const updatePayload = new FormData();
    updatePayload.set("name", parsed.data.name);
    updatePayload.set("locale", parsed.data.locale);

    const avatarFile = formData.get("avatar") as File | null;
    if (avatarFile && avatarFile.size > 0) {
      // Validate file size: max 5MB
      if (avatarFile.size > 5 * 1024 * 1024) {
        return { success: false, error: "Avatar file size must be less than 5 MB" };
      }
      updatePayload.set("avatar", avatarFile);
    }

    const updatedUser = await pb.collection("users").update(user.id, updatePayload);
    pb.authStore.save(pb.authStore.token, updatedUser);
    await savePocketBaseCookie(pb);

    // Update NEXT_LOCALE cookie to reflect chosen UI language
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", parsed.data.locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });

    revalidatePath("/admin/profile");
    revalidatePath("/admin");

    return { success: true };
  } catch (err: any) {
    console.error("Failed to update profile:", err);
    let errorMsg = err instanceof Error ? err.message : "Failed to update profile";
    if (err?.response?.data) {
      const fieldErrors = Object.entries(err.response.data)
        .map(([field, errObj]: [string, any]) => `${field}: ${errObj.message || errObj.code}`)
        .join(", ");
      if (fieldErrors) {
        errorMsg = fieldErrors;
      }
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function changePasswordAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session. Please sign in again." };
    }

    const rawData = {
      oldPassword: formData.get("oldPassword")?.toString() || "",
      password: formData.get("password")?.toString() || "",
      passwordConfirm: formData.get("passwordConfirm")?.toString() || "",
    };

    const parsed = changePasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid password data" };
    }

    await pb.collection("users").update(user.id, {
      oldPassword: parsed.data.oldPassword,
      password: parsed.data.password,
      passwordConfirm: parsed.data.passwordConfirm,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to change password:", err);
    return {
      success: false,
      error: "Failed to change password. Please check your current password.",
    };
  }
}

export async function upsertAgencyDefaultsAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.record;

    if (!user || !pb.authStore.isValid) {
      return { success: false, error: "Unauthorized session. Please sign in again." };
    }

    const userTier = (user.tier as string)?.toUpperCase() || "FREE";
    if (userTier !== "AGENCY" && userTier !== "PLATINUM") {
      return { success: false, error: "Agency Defaults require an AGENCY or PLATINUM plan." };
    }

    const rawData = {
      defaultClearanceZone: formData.get("defaultClearanceZone")?.toString(),
      defaultMinSizePrintMm: formData.get("defaultMinSizePrintMm")?.toString(),
      defaultMinSizeDigitalPx: formData.get("defaultMinSizeDigitalPx")?.toString(),
      defaultRules: formData.get("defaultRules")?.toString(),
      defaultPageTree: formData.get("defaultPageTree")?.toString(),
    };

    const parsed = agencyDefaultsSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid agency defaults" };
    }

    const dataToSave = {
      user: user.id,
      defaultClearanceZone: { percent: parsed.data.defaultClearanceZone },
      defaultMinSize: {
        printMm: parsed.data.defaultMinSizePrintMm,
        digitalPx: parsed.data.defaultMinSizeDigitalPx,
      },
      defaultRules: { text: parsed.data.defaultRules || "" },
      defaultPageTree: { template: parsed.data.defaultPageTree || "standard" },
      defaultTexts: {},
    };

    // Check if an existing record exists for this user
    let existingRecordId: string | null = null;
    try {
      const existing = await pb.collection("agencyDefaults").getFirstListItem(`user = "${user.id}"`);
      if (existing) existingRecordId = existing.id;
    } catch {
      // not found -> create
    }

    if (existingRecordId) {
      await pb.collection("agencyDefaults").update(existingRecordId, dataToSave);
    } else {
      await pb.collection("agencyDefaults").create(dataToSave);
    }

    revalidatePath("/admin/profile");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to upsert agency defaults:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save agency defaults",
    };
  }
}
