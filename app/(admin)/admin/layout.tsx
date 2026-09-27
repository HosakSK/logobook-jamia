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

  return (
    <div className="min-h-screen flex flex-col bg-canvas-dark text-foreground">
      {isUnverified && user?.email && (
        <VerificationBanner email={user.email} locale={currentLocale} />
      )}
      <AdminShell user={userData} locale={currentLocale}>
        {children}
      </AdminShell>
    </div>
  );
}
