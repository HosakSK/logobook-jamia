/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase Hook: Storage Quota Enforcer (Cloudflare R2 & File Uploads)
 * Enforces per-tier storage limits for assetFiles and mediaAssets.
 */

const TIER_STORAGE_LIMITS_BYTES = {
  FREE: 500 * 1024 * 1024,              // 500 MB
  COMPANY: 5 * 1024 * 1024 * 1024,      // 5 GB
  FREELANCER: 15 * 1024 * 1024 * 1024,  // 15 GB
  AGENCY: 50 * 1024 * 1024 * 1024,      // 50 GB
  PLATINUM: 500 * 1024 * 1024 * 1024,   // 500 GB
};

onRecordCreateRequest((e) => {
  const collectionName = e.collection?.name;
  if (collectionName !== "assetFiles" && collectionName !== "mediaAssets") {
    e.next();
    return;
  }

  const authRecord = e.auth;
  // Superusers bypass storage quotas
  if (e.isSuperuser || (authRecord && authRecord.collectionName === "_superusers")) {
    e.next();
    return;
  }

  const userTier = (authRecord && authRecord.get("tier")) || "FREE";
  const quotaLimit = TIER_STORAGE_LIMITS_BYTES[userTier] || TIER_STORAGE_LIMITS_BYTES.FREE;

  // Check upload file existence
  const file = e.record.get("file");
  if (file && typeof file === "object" && file.size) {
    if (file.size > quotaLimit) {
      throw new BadRequestError(`Súbor presahuje maximálny limit úložiska pre balíček ${userTier}.`);
    }
  }

  e.next();
}, "assetFiles", "mediaAssets");
