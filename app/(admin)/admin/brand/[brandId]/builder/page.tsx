import { notFound, redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandPagesAction } from "@/actions/pages";
import { BuilderEmptyState } from "@/components/admin/builder";

export default async function BrandBuilderIndexPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
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

  // Check if pages already exist for this brand
  const pagesRes = await getBrandPagesAction(brand.id);

  const brandSlugOrId = brand.slug || brand.id;

  if (pagesRes.success && pagesRes.pages.length > 0) {
    // Redirect directly to the first active page using clean slug
    const firstPage = pagesRes.pages[0];
    const pageSlugOrId = firstPage.slug || firstPage.id;
    redirect(`/admin/brand/${brandSlugOrId}/builder/${pageSlugOrId}`);
  }

  // If no pages exist yet, display the onboarding empty state
  return <BuilderEmptyState brandId={brand.id} brandName={brand.name || brand.id} />;
}
