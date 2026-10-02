"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Locale, DEFAULT_LOCALE } from "@/lib/i18n";

interface AdminShellProps {
  user?: {
    email: string;
    name?: string;
    tier?: string;
    verified?: boolean;
  } | null;
  brands?: { id: string; slug: string; name: string }[];
  locale?: Locale;
  children: React.ReactNode;
}

export function AdminShell({
  user,
  brands,
  locale = DEFAULT_LOCALE,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas-dark text-foreground">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar
        availableBrands={brands}
        locale={locale}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          user={user}
          locale={locale}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-5 sm:p-8 md:p-12 w-full max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
