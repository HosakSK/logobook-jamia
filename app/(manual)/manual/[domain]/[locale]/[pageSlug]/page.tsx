import { notFound } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { PublishedManualView } from "@/components/manual/published-manual-view";

interface LocalizedManualSubPageProps {
  params: Promise<{ domain: string; locale: string; pageSlug: string }>;
}

export default async function LocalizedManualSubPage({
  params,
}: LocalizedManualSubPageProps) {
  const { domain, locale, pageSlug } = await params;
  const currentLocale: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  const pb = await getServerPocketBase();
  let brandRecord: any = null;

  try {
    brandRecord = await pb
      .collection("brands")
      .getFirstListItem(`slug = "${domain}" || customDomain = "${domain}" || id = "${domain}"`);
  } catch {
    // Brand record not found
  }

  if (!brandRecord) {
    return notFound();
  }

  const publishedConfig = (brandRecord.publishedConfig || null) as PublishedBrandSnapshot | null;

  return (
    <PublishedManualView
      snapshot={publishedConfig}
      brandSlug={brandRecord.slug || domain}
      initialPageSlug={pageSlug}
      locale={currentLocale}
    />
  );
}
