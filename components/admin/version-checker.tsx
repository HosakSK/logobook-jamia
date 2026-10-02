"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, X, ExternalLink, GitFork, CheckCircle2 } from "lucide-react";
import { checkAppVersionAction, type VersionCheckResult } from "@/actions/version";
import packageJson from "@/package.json";

export function VersionChecker() {
  const currentAppVersion = packageJson.version || "0.0.1.62";
  const [data, setData] = useState<VersionCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    checkAppVersionAction()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasUpdate = Boolean(data?.hasUpdate);
  const latestVersion = data?.latestVersion || currentAppVersion;
  const currentVersion = data?.currentVersion || currentAppVersion;
  const repo = data?.repo || process.env.NEXT_PUBLIC_GITHUB_REPO || "HosakSK/logobook-jamia";
  const releaseUrl = data?.releaseUrl || `https://github.com/${repo}/releases`;

  return (
    <>
      {/* Footer trigger */}
      {!hasUpdate ? (
        <div
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/80 hover:text-foreground transition-colors cursor-default"
          title={loading ? "Kontrola verzie..." : "Logobook je aktuálny"}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
              loading ? "bg-muted-foreground/40 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <span>v{currentVersion}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/40 px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-[0_0_12px_rgba(200,212,0,0.15)]"
          title={`Dostupná aktualizácia: v${latestVersion}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
          <span>v{currentVersion}</span>
          <ArrowUpRight className="w-3 h-3 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Modal with update details and instructions */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#1f2c36]/98 backdrop-blur-2xl border border-[#2b3b48] rounded-2xl shadow-2xl p-6 text-foreground animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2b3b48]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-[0_0_15px_rgba(200,212,0,0.15)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Dostupná nová verzia Logobooku
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Repozitár: <span className="font-mono text-foreground/80">{repo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                title="Zavrieť"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version comparison */}
            <div className="my-5 grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.08] p-3.5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  Nainštalovaná verzia
                </div>
                <div className="font-mono text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                  v{currentVersion}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/30 p-3.5 rounded-xl shadow-[0_0_20px_rgba(200,212,0,0.08)]">
                <div className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">
                  Nová dostupná verzia
                </div>
                <div className="font-mono text-sm font-bold text-primary flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                  v{latestVersion}
                </div>
              </div>
            </div>

            {/* Release notes if available */}
            {data?.releaseNotes && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-foreground mb-1.5">Poznámky k vydaniu:</div>
                <div className="max-h-36 overflow-y-auto bg-black/40 border border-white/[0.08] p-3 rounded-xl font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {data.releaseNotes}
                </div>
              </div>
            )}

            {/* Update instructions */}
            <div className="mb-6 bg-white/[0.02] border border-white/[0.08] p-4 rounded-xl text-xs space-y-2.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-primary" />
                Ako aktualizovať váš self-hosted Logobook:
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                <li>
                  Otvorte váš forknutý repozitár na GitHube a kliknite na{" "}
                  <strong className="text-foreground">Sync fork</strong>.
                </li>
                <li>
                  Ak používate <strong className="text-foreground">Coolify</strong>, po synchronizácii kliknite na{" "}
                  <strong className="text-foreground">Redeploy</strong> (alebo počkajte na auto-deploy webhook).
                </li>
                <li>
                  Ak bežíte lokálne cez <strong className="text-foreground">Docker Compose</strong>, spustite v termináli:
                  <div className="mt-1 bg-black/60 px-3 py-1.5 rounded-lg font-mono text-[10px] text-primary border border-white/[0.08]">
                    git pull && docker compose up -d --build
                  </div>
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Zavrieť
              </button>
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-black font-semibold text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(200,212,0,0.18)] cursor-pointer"
              >
                <span>Pozrieť Release na GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
