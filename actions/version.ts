"use server";

import packageJson from "@/package.json";

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl?: string;
  releaseNotes?: string;
  repo: string;
}

function isNewerVersion(latest: string, current: string): boolean {
  const lParts = latest.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = current.split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(lParts.length, cParts.length);

  for (let i = 0; i < maxLen; i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

/**
 * Checks GitHub Releases API to see if a newer version is available.
 * Cached on server for 1 hour to respect rate limits.
 */
export async function checkAppVersionAction(): Promise<VersionCheckResult> {
  const currentVersion = packageJson.version || "0.0.1.60";
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "HosakSK/logobook-jamia";

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Logobook-Version-Checker",
      },
    });

    if (!res.ok) {
      // Fallback: check repository tags
      try {
        const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags`, {
          next: { revalidate: 3600 },
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Logobook-Version-Checker",
          },
        });

        if (tagsRes.ok) {
          const tags = (await tagsRes.json()) as Array<{ name: string }>;
          if (tags && tags.length > 0) {
            const latestTag = tags[0].name.replace(/^v/, "");
            const hasUpdate = isNewerVersion(latestTag, currentVersion);
            return {
              currentVersion,
              latestVersion: latestTag,
              hasUpdate,
              releaseUrl: `https://github.com/${repo}/releases`,
              repo,
            };
          }
        }
      } catch {
        // Tag fallback error ignored
      }

      return {
        currentVersion,
        latestVersion: currentVersion,
        hasUpdate: false,
        repo,
      };
    }

    const data = await res.json();
    const latestVersion = (data.tag_name || data.name || currentVersion).replace(/^v/, "");
    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    return {
      currentVersion,
      latestVersion,
      hasUpdate,
      releaseUrl: data.html_url || `https://github.com/${repo}/releases`,
      releaseNotes: data.body,
      repo,
    };
  } catch {
    return {
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      repo,
    };
  }
}
