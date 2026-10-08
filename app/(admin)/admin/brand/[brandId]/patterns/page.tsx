import { notFound } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { getBrandMediaAction } from "@/actions/media";
import { MediaGalleryView } from "@/components/admin/media/media-gallery-view";

export default async function BrandPatternsPage({
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

  const mediaRes = await getBrandMediaAction(brand.id);
  const media = mediaRes.success ? mediaRes.media : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <MediaGalleryView
        initialMedia={media}
        brandId={brand.id}
        brandName={brand.name}
        pageMode="patterns"
      />
    </div>
  );
}
