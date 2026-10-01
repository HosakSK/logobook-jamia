import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getServerPocketBase } from "@/lib/pocketbase-server";
import { PublishedBrandSnapshot } from "@/actions/publish";
import { getBrandCascadeTokensAction } from "@/actions/cascade";
import { generateBrandCssTheme, generateBrandW3cTokens } from "@/lib/tokens/generator";
import { generateBrandAiContext } from "@/lib/export/ai-context-generator";
import { IntegrationsHubView } from "@/components/admin/integrations/integrations-hub-view";

export default async function BrandIntegrationsPage({
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

  const snapshot = (brand.publishedConfig || null) as PublishedBrandSnapshot | null;

  // Resolve base URL from incoming request headers
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "logobook.sk";
  const protoHeader = headerStore.get("x-forwarded-proto");
  const protocol =
    protoHeader ||
    (host.includes("localhost") || host.includes("89.168") || host.includes("sslip.io")
      ? "http"
      : "https");
  const appBaseUrl = `${protocol}://${host}`;

  // Fetch cascade tokens
  let cascadeTokens = null;
  try {
    const cascadeRes = await getBrandCascadeTokensAction(brand.id);
    if (cascadeRes.success) {
      cascadeTokens = cascadeRes.tokens;
    }
  } catch {
    // defaults apply
  }

  // Generate previews (using snapshot if published, or mock structure)
  const mockSnapshot: PublishedBrandSnapshot = snapshot || {
    brandId: brand.id,
    publishedAt: new Date().toISOString(),
    version: 1,
    brand: {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      defaultLocale: "en",
    },
    pages: [],
  };

  const cssPreview = generateBrandCssTheme({
    snapshot: mockSnapshot,
    cascadeTokens,
  });

  const jsonTokens = generateBrandW3cTokens({
    snapshot: mockSnapshot,
    cascadeTokens,
  });
  const jsonPreview = JSON.stringify(jsonTokens, null, 2);

  const aiPreview = generateBrandAiContext({
    snapshot: mockSnapshot,
    cascadeTokens,
    appBaseUrl,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <IntegrationsHubView
        brand={{
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          customDomain: brand.customDomain,
          status: brand.status,
        }}
        snapshot={snapshot}
        appBaseUrl={appBaseUrl}
        cssPreview={cssPreview}
        jsonPreview={jsonPreview}
        aiPreview={aiPreview}
      />
    </div>
  );
}
