"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrandStore } from "@/lib/store/brand-store";
import { BrandSwitcher } from "@/components/admin/brand-switcher";
import { VersionChecker } from "@/components/admin/version-checker";
import { Logo } from "@/components/brand/logo";
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
  FolderOpen,
  LayoutGrid,
  Settings,
  Sparkles,
  Code2,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  availableBrands?: { id: string; slug: string; name: string }[];
  locale?: Locale;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({
  availableBrands,
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
      label: dict.admin.brandMedia,
      href: `/admin/brand/${brandId}/media`,
      icon: FolderOpen,
    },
    {
      label: dict.admin.brandBuilder,
      href: `/admin/brand/${brandId}/builder`,
      icon: LayoutGrid,
    },
    {
      label: dict.admin.brandIntegrations || "Integrácie a API",
      href: `/admin/brand/${brandId}/integrations`,
      icon: Code2,
    },
    {
      label: dict.admin.brandSettings,
      href: `/admin/brand/${brandId}/settings`,
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 p-5 space-y-6">
      {/* Brand Switcher Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Logo variant="full" mode="dark" href="/admin" priority />
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded-[3px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <BrandSwitcher availableBrands={availableBrands} locale={locale} />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto space-y-6 -mx-2 px-2 scrollbar-thin">
        {/* Brand Context Navigation */}
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>{dict.admin.brandSection}</span>
            {activeBrand && (
              <span className="text-[9px] font-mono text-[#009f80] font-bold bg-[#009f80]/10 border border-[#009f80]/30 px-1.5 py-0.5 rounded-[3px]">
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
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-elevated text-primary font-semibold border border-primary/30"
                    : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground"
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
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-elevated text-primary font-semibold border border-primary/30"
                    : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground"
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
      <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <VersionChecker />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Logobook Studio</span>
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
