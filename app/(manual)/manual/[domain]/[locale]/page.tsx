import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PublishedManualView } from "@/components/manual/published-manual-view";
import { getCachedBrandBySlug } from "@/lib/manual/brand-cache";

interface LocalizedManualPageProps {
  params: Promise<{ domain: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function LocalizedManualPage({
  params,
  searchParams,
}: LocalizedManualPageProps) {
  const { domain, locale } = await params;
  const { page: requestedPageSlug } = await searchParams;

  const currentLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const brandRecord = await getCachedBrandBySlug(domain);

  if (!brandRecord) {
    return notFound();
  }

  const publishedConfig = (brandRecord.publishedConfig || null) as PublishedBrandSnapshot | null;

  // Resolve target page slug: requested search param, or 'uvod', or the first root page
  const targetSlug =
    requestedPageSlug ||
    publishedConfig?.pages?.find((p) => p.slug === "uvod")?.slug ||
    publishedConfig?.pages?.[0]?.slug ||
    "";

  // Performance optimization: Strip heavy containers from inactive pages in the snapshot.
  // The active page gets its full containers/modules, while other pages retain only lightweight
  // navigation metadata (id, slug, title, parent, order, isInMenu).
  // This reduces the HTML RSC serialization payload from ~450 KB down to ~25 KB!
  const optimizedSnapshot: PublishedBrandSnapshot | null = publishedConfig
    ? {
        ...publishedConfig,
        pages: (publishedConfig.pages || []).map((p) => {
          if (p.slug === targetSlug || (!targetSlug && (p.slug === "uvod" || p.order === 0))) {
            return p;
          }
          return {
            id: p.id,
            slug: p.slug,
            title: p.title,
            parent: p.parent,
            isInMenu: p.isInMenu,
            menuStyle: p.menuStyle,
            order: p.order,
            templateId: p.templateId,
            containers: [],
          };
        }),
      }
    : null;

  return (
    <PublishedManualView
      snapshot={optimizedSnapshot}
      brandSlug={brandRecord.slug || domain}
      initialPageSlug={requestedPageSlug}
      locale={currentLocale}
    />
  );
}
