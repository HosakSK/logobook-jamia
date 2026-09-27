"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useBrandStore } from "@/lib/store/brand-store";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";

interface BreadcrumbsProps {
  locale?: Locale;
}

export function Breadcrumbs({ locale = DEFAULT_LOCALE }: BreadcrumbsProps) {
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const { activeBrand } = useBrandStore();

  const segments = pathname.split("/").filter(Boolean);
  // e.g. ['admin'], ['admin', 'team'], ['admin', 'brand', '123', 'colors']

  const segmentLabels: Record<string, string> = {
    admin: dict.admin.breadcrumbsAdmin,
    team: dict.admin.team,
    billing: dict.admin.billing,
    profile: dict.admin.profile,
    brand: dict.admin.brandSection,
    colors: dict.admin.brandColors,
    typography: dict.admin.brandTypography,
    logos: dict.admin.brandLogos,
    builder: dict.admin.brandBuilder,
  };

  const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = [];

  let accumulatedPath = "";
  segments.forEach((seg, index) => {
    accumulatedPath += `/${seg}`;
    const isLast = index === segments.length - 1;

    let label = segmentLabels[seg] || seg;

    // If segment is brandId or slug, display activeBrand name if available
    if (segments[index - 1] === "brand") {
      label = activeBrand?.name || seg;
    }

    breadcrumbs.push({
      label,
      href: accumulatedPath,
      isLast,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {breadcrumbs.map((crumb, idx) => {
        // Skip first segment if it's admin (represented by Home icon)
        if (crumb.href === "/admin") return null;

        return (
          <div key={crumb.href} className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-neutral-400 shrink-0" />
            {crumb.isLast ? (
              <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[180px]"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
