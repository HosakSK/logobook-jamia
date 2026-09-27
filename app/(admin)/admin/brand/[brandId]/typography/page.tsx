import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandTypographyAction } from "@/actions/typography";
import { TypographyGalleryView } from "@/components/admin/typography/typography-gallery-view";

export default async function BrandTypographyPage({
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

  const typographyRes = await getBrandTypographyAction(brand.id);
  const typography = typographyRes.success ? typographyRes.typography : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TypographyGalleryView
        initialTypography={typography}
        brandId={brand.id}
        brandName={brand.name}
      />
    </div>
  );
}
