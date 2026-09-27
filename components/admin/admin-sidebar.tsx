"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrandStore } from "@/lib/store/brand-store";
import { BrandSwitcher } from "@/components/admin/brand-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import {
  FolderKanban,
  Users,
  CreditCard,
  User,
  Info,
  Palette,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  locale?: Locale;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({
  locale = DEFAULT_LOCALE,
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const { activeBrand } = useBrandStore();

  const brandId = activeBrand?.id || "demo";
  const isInBrandContext = pathname.startsWith("/admin/brand/") || activeBrand !== null;

  const globalNav = [
    {
      label: dict.admin.dashboard,
      href: "/admin",
      icon: FolderKanban,
      exact: true,
    },
    {
      label: dict.admin.team,
      href: "/admin/team",
      icon: Users,
    },
    {
      label: dict.admin.billing,
      href: "/admin/billing",
      icon: CreditCard,
    },
    {
      label: dict.admin.profile,
      href: "/admin/profile",
      icon: User,
    },
  ];

  const brandNav = [
    {
      label: dict.admin.brandOverview,
      href: `/admin/brand/${brandId}`,
      icon: Info,
      exact: true,
    },
    {
      label: dict.admin.brandLogos,
      href: `/admin/brand/${brandId}/logos`,
      icon: ImageIcon,
    },
    {
      label: dict.admin.brandColors,
      href: `/admin/brand/${brandId}/colors`,
      icon: Palette,
    },
    {
      label: dict.admin.brandTypography,
      href: `/admin/brand/${brandId}/typography`,
      icon: Type,
    },
    {
      label: dict.admin.brandBuilder,
      href: `/admin/brand/${brandId}/builder`,
      icon: LayoutGrid,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r w-64 p-5 space-y-6">
      {/* Brand Switcher Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight text-base">
            <div className="h-7 w-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-black text-xs shadow-xs">
              LB
            </div>
            <span>Logobook<span className="text-neutral-400 font-normal"> Studio</span></span>
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <BrandSwitcher locale={locale} />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2 scrollbar-thin">
        {/* Brand Context Navigation */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{dict.admin.brandSection}</span>
            {activeBrand && (
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ACTIVE
              </span>
            )}
          </div>

          {brandNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Global Workspace Navigation */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {dict.admin.globalSection}
          </div>

          {globalNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-mono">v0.0.1.9</span>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Always visible on md+ */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Sheet style) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-50"
            onClick={onMobileClose}
          />
          <div className="relative flex flex-col w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
