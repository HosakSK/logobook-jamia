"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerPocketBase, savePocketBaseCookie, clearPocketBaseCookie } from "@/lib/pocketbase-server";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  manualPasswordSchema,
} from "@/lib/validations/auth";
import PocketBase from "pocketbase";

export interface ActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: Record<string, unknown>;
}

/**
 * Server Action: Login user with email & password
 */
export async function loginAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      if (issue.path[0]) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
    }
    return { success: false, fieldErrors, error: "Validation failed" };
  }

  const { email, password } = validation.data;

  try {
    const pb = await getServerPocketBase();
    await pb.collection("users").authWithPassword(email, password);

    // Save session in HTTP-only cookie
    await savePocketBaseCookie(pb);

    return { success: true };
  } catch (err: unknown) {
    console.error("loginAction error:", err);
    return {
      success: false,
      error: "Invalid email or password. Please try again.",
    };
  }
}

/**
 * Server Action: Register new user and request verification email
 * Flow: User registers -> receives verification email -> instructed to check email first
 */
export async function registerAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name") || "",
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      if (issue.path[0]) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
    }
    return { success: false, fieldErrors, error: "Validation failed" };
  }

  const { name, email, password, passwordConfirm } = validation.data;

  try {
    const pb = await getServerPocketBase();

    // 1. Create user in PocketBase
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm,
      name: name || undefined,
      tier: "FREE",
      locale: "en",
    });

    // 2. Request verification email
    try {
      await pb.collection("users").requestVerification(email);
    } catch (verifErr) {
      console.warn("Could not send immediate verification email:", verifErr);
    }

    return {
      success: true,
      data: {
        checkEmail: true,
        email,
      },
    };
  } catch (err: unknown) {
    console.error("registerAction error:", err);
    return {
      success: false,
      error: "An account with this email address may already exist or password is too weak.",
    };
  }
}

/**
 * Server Action: Request password reset link
 */
export async function resetPasswordAction(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get("email"),
  };

  const validation = resetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid email",
    };
  }

  const { email } = validation.data;

  try {
    const pb = await getServerPocketBase();
    await pb.collection("users").requestPasswordReset(email);
    return { success: true };
  } catch (err: unknown) {
    // PocketBase may error if email is not found, but for security return success
    console.warn("resetPasswordAction notice:", err);
    return { success: true };
  }
}

/**
 * Server Action: Resend verification email
 */
export async function resendVerificationAction(email: string): Promise<ActionState> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email is required" };
  }

  try {
    const pb = await getServerPocketBase();
    await pb.collection("users").requestVerification(email);
    return { success: true };
  } catch (err: unknown) {
    console.error("resendVerificationAction error:", err);
    return { success: false, error: "Could not send verification email." };
  }
}

/**
 * Server Action: Sign out user
 */
export async function logoutAction(): Promise<void> {
  await clearPocketBaseCookie();
  redirect("/login");
}

/**
 * Server Action: Verify brand manual password and set authorization cookie
 */
export async function verifyManualPasswordAction(
  brandSlug: string,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") || "");

  const validation = manualPasswordSchema.safeParse({ brandSlug, password });
  if (!validation.success) {
    return { success: false, error: "Password is required" };
  }

  try {
    const pb = await getServerPocketBase();
    const brand = await pb.collection("brands").getFirstListItem(`slug="${brandSlug}"`);

    // Check if brand has passwordHash set
    if (!brand.passwordHash) {
      // Not locked
      return { success: true };
    }

    // Direct password match or verification
    if (brand.passwordHash === password) {
      const cookieStore = await cookies();
      cookieStore.set(`manual_auth_${brandSlug}`, "authorized", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: `/manual/${brandSlug}`,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return { success: true };
    }

    return { success: false, error: "Incorrect password." };
  } catch (err: unknown) {
    console.error("verifyManualPasswordAction error:", err);
    return { success: false, error: "Authentication failed." };
  }
}

/**
 * Server Guard: Throws error if logged in user has unverified email
 * Used to protect sensitive operations: ZIP export, team invites, custom domain, checkout.
 */
export async function requireVerifiedUser(pb: PocketBase): Promise<void> {
  const user = pb.authStore.record;
  if (!user) {
    throw new Error("Authentication required.");
  }
  if (!user.verified) {
    throw new Error("This action requires a verified email address.");
  }
}
