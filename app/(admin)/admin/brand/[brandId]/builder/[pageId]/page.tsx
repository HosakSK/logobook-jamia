import { redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandPagesAction, getPageDetailAction } from "@/actions/pages";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { BuilderTreeSidebar, BuilderCanvas } from "@/components/admin/builder";
import { BrandCascadeProvider } from "@/components/modules/cascade";

export default async function BrandBuilderPageDetail({
  params,
}: {
  params: Promise<{ brandId: string; pageId: string }>;
}) {
  const { brandId, pageId } = await params;
  const pb = await getServerPocketBase();

  let brandName = brandId;
  let brandSlug = brandId;
  try {
    const brand = await pb.collection("brands").getOne(brandId);
    if (brand?.name) brandName = brand.name;
    if (brand?.slug) brandSlug = brand.slug;
  } catch {
    // fallback
  }

  // Load pages tree
  const pagesRes = await getBrandPagesAction(brandId);

  // Load page detail
  const pageRes = await getPageDetailAction(pageId);
  if (!pageRes.success || !pageRes.page) {
    redirect(`/admin/brand/${brandId}/builder`);
  }

  // Load brand cascade tokens
  const cascadeRes = await getBrandCascadeTokensAction(brandId);

  return (
    <BrandCascadeProvider
      tokens={cascadeRes.tokens}
      style={cascadeRes.cssVariables as unknown as React.CSSProperties}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Hierarchical Tree Sidebar */}
        <BuilderTreeSidebar
          brandId={brandId}
          currentPageId={pageId}
          pages={pagesRes.pages}
          tree={pagesRes.tree}
        />

        {/* Center Live Canvas */}
        <BuilderCanvas
          brandId={brandId}
          brandSlug={brandSlug}
          page={pageRes.page}
        />
      </div>
    </BrandCascadeProvider>
  );
}
