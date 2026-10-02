import PocketBase from "pocketbase";
import { cookies, headers } from "next/headers";

const pbUrl =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.POCKETBASE_INTERNAL_URL ||
  "http://pocketbase-slkwd3bakl5khufyiyd27tth.89.168.121.252.sslip.io";

/**
 * Returns a new PocketBase instance populated with session from Next.js cookies
 * Suitable for Server Components and Server Actions.
 */
export async function getServerPocketBase() {
  const pb = new PocketBase(pbUrl);
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("pb_auth");

  if (authCookie?.value) {
    try {
      let cookieVal = authCookie.value;
      if (cookieVal.startsWith("%25") || cookieVal.includes("%2522")) {
        cookieVal = decodeURIComponent(cookieVal);
      }
      pb.authStore.loadFromCookie(`pb_auth=${cookieVal}`);
      // Refresh token if expired or about to expire
      if (pb.authStore.isValid) {
        try {
          await pb.collection("users").authRefresh();
        } catch {
          // Token refresh failure (e.g. user deleted or network issue)
        }
      }
    } catch {
      pb.authStore.clear();
    }
  }

  return pb;
}

/**
 * Persists the current PocketBase authStore session into Next.js cookies
 */
export async function savePocketBaseCookie(pb: PocketBase) {
  const cookieStore = await cookies();
  let isHttps = false;
  try {
    const headerList = await headers();
    const proto = headerList.get("x-forwarded-proto");
    isHttps = proto === "https";
  } catch {
    // fallback
  }

  const rawCookie = pb.authStore.exportToCookie({
    httpOnly: false,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
  });

  // Parse cookie string returned by pb.authStore.exportToCookie
  const match = rawCookie.match(/pb_auth=([^;]+)/);
  if (match && match[1]) {
    // Decode pre-encoded string so Next.js does not double-encode it in the Set-Cookie header
    const cleanValue = decodeURIComponent(match[1]);
    cookieStore.set("pb_auth", cleanValue, {
      httpOnly: false,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }
}

/**
 * Removes the session cookie
 */
export async function clearPocketBaseCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("pb_auth");
}

/**
 * Returns an authenticated PocketBase instance with Superuser / Admin privileges.
 * Used for server-side background operations, webhooks, and migrations.
 */
export async function getAdminPocketBase(): Promise<PocketBase> {
  const pb = new PocketBase(pbUrl);
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (email && password) {
    try {
      await pb.collection("_superusers").authWithPassword(email, password);
    } catch {
      try {
        await pb.admins.authWithPassword(email, password);
      } catch (e) {
        console.error("Failed to authenticate PocketBase superuser:", e);
      }
    }
  } else {
    console.warn("[PocketBase] POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD is not set.");
  }

  return pb;
}

