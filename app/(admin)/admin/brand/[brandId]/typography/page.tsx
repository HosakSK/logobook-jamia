import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandTypographyAction } from "@/actions/typography";
import { TypographyGalleryView } from "@/components/admin/typography/typography-gallery-view";
import { resolveManualTheme } from "@/lib/constants/themes";

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

  // Fetch shapes and colors to resolve active heading color
  let globalShapes: any = null;
  try {
    globalShapes = await pb.collection("globalShapes").getFirstListItem(`brand = "${brand.id}"`);
  } catch {}

  let brandColors: Array<{ hex: string; role?: string; name?: string }> = [];
  try {
    const colList = await pb.collection("globalColors").getFullList({
      filter: `brand = "${brand.id}"`,
      sort: "order",
    });
    brandColors = colList.map((c: any) => ({
      hex: c.hex,
      role: c.role,
      name: typeof c.name === "object" ? c.name?.sk || c.name?.en : c.name,
    }));
  } catch {}

  const resolvedTheme = resolveManualTheme(
    globalShapes?.themeConfig,
    globalShapes?.manualBgColor,
    brandColors
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TypographyGalleryView
        initialTypography={typography}
        brandId={brand.id}
        brandName={brand.name}
        headingColor={resolvedTheme.headingColor}
      />
    </div>
  );
}
