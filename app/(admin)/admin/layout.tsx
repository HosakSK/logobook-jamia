import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { VerificationBanner } from "@/components/verification-banner";
import { AdminShell } from "@/components/admin/admin-shell";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { resolveBrandFaviconUrl } from "@/lib/utils/brand-media";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const pb = await getServerPocketBase();
  const user = pb.authStore.record;

  // Authorization check
  if (!user && !pb.authStore.isValid) {
    redirect("/login?redirect=/admin");
  }

  const isUnverified = user && user.verified === false;

  const userData = user
    ? {
        email: user.email,
        name: (user.name as string) || "",
        tier: (user.tier as string) || "FREE",
        verified: user.verified || false,
      }
    : null;

  let availableBrands: { id: string; slug: string; name: string; iconUrl?: string | null }[] = [];
  if (user) {
    let records: any[] = [];
    try {
      records = await pb.collection("brands").getFullList({
        expand: "favicon",
      });
    } catch (err) {
      console.error("Failed to load user brands with expand in layout, retrying plain getFullList:", err);
      try {
        records = await pb.collection("brands").getFullList();
      } catch (fallbackErr) {
        console.error("Failed fallback load user brands in layout:", fallbackErr);
      }
    }

    if (records.length > 0) {
      records.sort((a, b) => {
        if (a.updated && b.updated) {
          return b.updated.localeCompare(a.updated);
        }
        return (a.name || "").localeCompare(b.name || "");
      });
      availableBrands = records.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        iconUrl: resolveBrandFaviconUrl(b, pb),
      }));
    }
  }

  return (
    <div className="dark admin-studio min-h-screen flex flex-col bg-[#0e161d] text-[#fafbfc]" data-theme="dark" data-admin-root data-admin-ui="true">
      {isUnverified && user?.email && (
        <VerificationBanner email={user.email} locale={currentLocale} />
      )}
      <AdminShell user={userData} brands={availableBrands} locale={currentLocale}>
        {children}
      </AdminShell>
    </div>
  );
}
