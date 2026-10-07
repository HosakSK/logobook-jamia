import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { VerificationBanner } from "@/components/verification-banner";
import { AdminShell } from "@/components/admin/admin-shell";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";

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

  let availableBrands: { id: string; slug: string; name: string }[] = [];
  if (user) {
    try {
      const records = await pb.collection("brands").getFullList();
      availableBrands = records.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
      }));
    } catch (err) {
      console.error("Failed to load user brands in layout:", err);
    }
  }

  return (
    <div className="dark min-h-screen flex flex-col bg-[#0e161d] text-[#fafbfc]" data-theme="dark">
      {isUnverified && user?.email && (
        <VerificationBanner email={user.email} locale={currentLocale} />
      )}
      <AdminShell user={userData} brands={availableBrands} locale={currentLocale}>
        {children}
      </AdminShell>
    </div>
  );
}
