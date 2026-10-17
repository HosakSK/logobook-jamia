"use server";

import { getCachedBrandTokens } from "@/lib/manual/brand-cache";
import { BrandCascadeTokens } from "@/lib/types/module";

/**
 * Server action to fetch and compute Level 1 Brand Tokens for a given brand project.
 * Usable by both Admin PageBuilder and public manual layout renderer.
 */
export async function getBrandCascadeTokensAction(brandId: string): Promise<{
  success: boolean;
  tokens: BrandCascadeTokens;
  cssVariables: Record<string, string>;
  error?: string;
}> {
  return getCachedBrandTokens(brandId);
}
