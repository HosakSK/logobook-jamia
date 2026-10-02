import { notFound, redirect } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandPagesAction, getPageDetailAction } from "@/actions/pages";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { BuilderTreeSidebar, BuilderCanvas, BuilderEmptyState } from "@/components/admin/builder";
import { BrandCascadeProvider } from "@/components/modules/cascade";

export default async function BrandBuilderPageDetail({
  params,
}: {
  params: Promise<{ brandId: string; pageId: string }>;
}) {
  const { brandId, pageId } = await params;
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

  const resolvedBrandId = brand.id;
  const brandSlug = brand.slug || brand.id;
  const brandName = brand.name || brand.id;

  // Load pages tree
  const pagesRes = await getBrandPagesAction(resolvedBrandId);

  // Load page detail
  const pageRes = await getPageDetailAction(pageId, resolvedBrandId);
  if (!pageRes.success || !pageRes.page) {
    if (pagesRes.pages.length > 0) {
      const firstPage = pagesRes.pages[0];
      if (firstPage.id !== pageId && firstPage.slug !== pageId) {
        redirect(`/admin/brand/${brandSlug}/builder/${firstPage.slug || firstPage.id}`);
      }
    }
    return <BuilderEmptyState brandId={resolvedBrandId} brandName={brandName} />;
  }

  // Load brand cascade tokens
  const cascadeRes = await getBrandCascadeTokensAction(resolvedBrandId);

  return (
    <BrandCascadeProvider
      tokens={cascadeRes.tokens}
      style={cascadeRes.cssVariables as unknown as React.CSSProperties}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Hierarchical Tree Sidebar */}
        <BuilderTreeSidebar
          brandId={brandSlug}
          currentPageId={pageRes.page.id}
          currentPageSlug={pageRes.page.slug}
          pages={pagesRes.pages}
          tree={pagesRes.tree}
        />

        {/* Center Live Canvas */}
        <BuilderCanvas
          brandId={resolvedBrandId}
          brandSlug={brandSlug}
          page={pageRes.page}
        />
      </div>
    </BrandCascadeProvider>
  );
}
