import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandAssetsAction } from "@/actions/assets";
import { AssetsGalleryView } from "@/components/admin/assets/assets-gallery-view";

export default async function BrandLogosPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  const pb = await getServerPocketBase();
  let brand: any = null;
  try {
    brand = await pb.collection("brands").getOne(brandId);
  } catch {
    try {
      brand = await pb.collection("brands").getFirstListItem(`slug = "${brandId}"`);
    } catch {
      notFound();
    }
  }

  const assetsRes = await getBrandAssetsAction(brand.id);
  const assets = assetsRes.success ? assetsRes.assets : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AssetsGalleryView
        initialAssets={assets}
        brandId={brand.id}
        brandName={brand.name}
        locale={currentLocale}
        dict={dict}
      />
    </div>
  );
}
