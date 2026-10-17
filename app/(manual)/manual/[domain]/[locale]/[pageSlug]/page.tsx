import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PublishedManualView } from "@/components/manual/published-manual-view";
import { getCachedBrandBySlug } from "@/lib/manual/brand-cache";

interface LocalizedManualSubPageProps {
  params: Promise<{ domain: string; locale: string; pageSlug: string }>;
}

export default async function LocalizedManualSubPage({
  params,
}: LocalizedManualSubPageProps) {
  const { domain, locale, pageSlug } = await params;
  const currentLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const brandRecord = await getCachedBrandBySlug(domain);

  if (!brandRecord) {
    return notFound();
  }

  const publishedConfig = (brandRecord.publishedConfig || null) as PublishedBrandSnapshot | null;

  // Performance optimization: Strip heavy containers from inactive pages in the snapshot.
  // The active page gets its full containers/modules, while other pages retain only lightweight
  // navigation metadata (id, slug, title, parent, order, isInMenu).
  // This reduces the HTML RSC serialization payload from ~450 KB down to ~25 KB!
  const optimizedSnapshot: PublishedBrandSnapshot | null = publishedConfig
    ? {
        ...publishedConfig,
        pages: (publishedConfig.pages || []).map((p) => {
          if (p.slug === pageSlug) {
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
      initialPageSlug={pageSlug}
      locale={currentLocale}
    />
  );
}
