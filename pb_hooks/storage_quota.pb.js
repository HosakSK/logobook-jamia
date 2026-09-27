/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase Hook: Storage Quota Enforcer (Cloudflare R2 & File Uploads)
 * Enforces per-tier storage limits for assetFiles and mediaAssets.
 */

const TIER_STORAGE_LIMITS_BYTES = {
  FREE: 500 * 1024 * 1024,              // 500 MB
  COMPANY: 1000 * 1024 * 1024,          // 1 GB
  FREELANCER: 2500 * 1024 * 1024,       // 2.5 GB
  AGENCY: 10000 * 1024 * 1024,          // 10 GB
  PLATINUM: 999999 * 1024 * 1024,       // Unlimited
};

onRecordCreateRequest((e) => {
  try {
    // Superusers bypass storage quotas
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
      return e.next();
    }
    if (e.auth && e.auth.collectionName === "_superusers") {
      return e.next();
    }

    const authRecord = e.auth;
    if (!authRecord) {
      return e.next();
    }

    let userTier = "FREE";
    try {
      if (typeof authRecord.get === "function") {
        userTier = authRecord.get("tier") || "FREE";
      } else if (authRecord.tier) {
        userTier = authRecord.tier || "FREE";
      } else if (typeof authRecord.getString === "function") {
        userTier = authRecord.getString("tier") || "FREE";
      }
    } catch (_) {}

    const quotaLimit = TIER_STORAGE_LIMITS_BYTES[userTier] || TIER_STORAGE_LIMITS_BYTES.FREE;

    if (typeof e.findUploadedFiles === "function") {
      const uploadedFiles = e.findUploadedFiles("file");
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          if (uploadedFiles[i] && uploadedFiles[i].size > quotaLimit) {
            throw new BadRequestError(`Súbor presahuje maximálny limit úložiska pre balíček ${userTier}.`);
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof BadRequestError) {
      throw err;
    }
    console.log("[StorageQuotaHook Error]:", err);
  }

  return e.next();
}, "assetFiles", "mediaAssets");
