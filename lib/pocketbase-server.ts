import PocketBase from "pocketbase";
import { cookies } from "next/headers";

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
      pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
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
 * Persists the current PocketBase authStore session into HTTP-Only Next.js cookies
 */
export async function savePocketBaseCookie(pb: PocketBase) {
  const cookieStore = await cookies();
  const rawCookie = pb.authStore.exportToCookie({
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // Parse cookie string returned by pb.authStore.exportToCookie
  const match = rawCookie.match(/pb_auth=([^;]+)/);
  if (match && match[1]) {
    cookieStore.set("pb_auth", match[1], {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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
