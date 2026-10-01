import { redirect } from "next/navigation";
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

  let brandName = brandId;
  try {
    const brand = await pb.collection("brands").getOne(brandId);
    if (brand?.name) brandName = brand.name;
  } catch {
    // fallback
  }

  // Check if pages already exist for this brand
  const pagesRes = await getBrandPagesAction(brandId);

  if (pagesRes.success && pagesRes.pages.length > 0) {
    // Redirect directly to the first active page
    redirect(`/admin/brand/${brandId}/builder/${pagesRes.pages[0].id}`);
  }

  // If no pages exist yet, display the onboarding empty state
  return <BuilderEmptyState brandId={brandId} brandName={brandName} />;
}
