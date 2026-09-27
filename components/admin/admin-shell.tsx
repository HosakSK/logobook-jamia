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
  locale?: Locale;
  children: React.ReactNode;
}

export function AdminShell({
  user,
  locale = DEFAULT_LOCALE,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar
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
        <main className="flex-1 p-4 sm:p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
