"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publishBrandAction, getBrandPublishStatusAction } from "@/actions/publish";

interface PublishBrandButtonProps {
  brandId: string;
  brandSlug: string;
  initialPublishedAt?: string | null;
  initialVersion?: number;
  className?: string;
}

export function PublishBrandButton({
  brandId,
  brandSlug,
  initialPublishedAt,
  initialVersion,
  className = "",
}: PublishBrandButtonProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt || null);
  const [version, setVersion] = useState<number>(initialVersion || 0);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch initial publish status if not provided
  useEffect(() => {
    if (!initialPublishedAt) {
      getBrandPublishStatusAction(brandId).then((res) => {
        if (res.success && res.status === "PUBLISHED" && res.publishedAt) {
          setPublishedAt(res.publishedAt);
          if (res.version) setVersion(res.version);
        }
      });
    }
  }, [brandId, initialPublishedAt]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setFeedbackMessage(null);

      const res = await publishBrandAction(brandId);
      if (!res.success) {
        setFeedbackMessage({
          type: "error",
          text: res.error || "Nepodarilo sa publikovať manuál.",
        });
        return;
      }

      if (res.publishedAt) {
        setPublishedAt(res.publishedAt);
      }
      if (res.version) {
        setVersion(res.version);
      }

      setFeedbackMessage({
        type: "success",
        text: `Manuál v${res.version} (${res.pagesCount} stránok) bol úspešne publikovaný na web!`,
      });

      router.refresh();
      // Auto-hide feedback after 5 seconds
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: unknown) {
      setFeedbackMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Chyba pri publikovaní.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Publish Status Badge */}
      {publishedAt ? (
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          title={`Naposledy publikované: ${formattedDate}`}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
          <span>Publikované v{version}</span>
          <span className="text-[10px] text-muted-foreground hidden lg:inline">({formattedDate})</span>
        </div>
      ) : (
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          title="Zmeny sú zatiaľ iba v rozpracovanom stave"
        >
          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>Koncept (Nepublikované)</span>
        </div>
      )}

      {/* Main Action Button */}
      <Button
        type="button"
        size="sm"
        disabled={isPublishing}
        onClick={handlePublish}
        className="h-7 px-3 text-xs font-semibold gap-1.5 rounded-[2px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer disabled:opacity-50"
      >
        {isPublishing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Publikujem...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Publikovať zmeny</span>
          </>
        )}
      </Button>

      {/* Temporary Toast / Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-3 rounded-[3px] shadow-lg border text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-neutral-900 text-white border-emerald-500/50"
              : "bg-rose-950 text-rose-200 border-rose-800"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}
    </div>
  );
}
