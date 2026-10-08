"use client";

import { useState, useTransition } from "react";
import { uploadBrandFaviconAction, setBrandFaviconAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Upload, Check, AlertCircle, Loader2, Sparkles, FolderOpen } from "lucide-react";
import { UniversalMediaPickerModal, SelectedMediaItem } from "@/components/admin/media/universal-media-picker-modal";

interface BrandFaviconFormProps {
  brandId: string;
  initialFaviconUrl?: string | null;
  dict: Dictionary;
}

export function BrandFaviconForm({ brandId, initialFaviconUrl, dict }: BrandFaviconFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFaviconUrl || null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleMediaSelect = (item: SelectedMediaItem) => {
    setError(null);
    setPreviewUrl(item.url);

    startTransition(async () => {
      const res = await setBrandFaviconAction(brandId, item.id || item.url);
      if (res.success) {
        setSuccess(true);
        if (res.faviconUrl) {
          setPreviewUrl(res.faviconUrl);
        }
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa nastaviť favicon");
      }
    });
  };

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-2xl bg-[#17212a] text-[#fafbfc] p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-[rgba(63,85,102,0.4)] pb-5">
        <h2 className="text-lg font-bold text-[#fafbfc]">{dict.admin.faviconLabel}</h2>
        <p className="text-xs text-[#96abbe] mt-1">
          {dict.admin.faviconHint}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 p-4 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>Favicon bol úspešne nahraný!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Favicon Preview Box */}
        <div className="h-20 w-20 rounded-xl border border-[rgba(63,85,102,0.6)] bg-[#070b0f] flex items-center justify-center overflow-hidden p-3 shadow-sm shrink-0">
          {previewUrl ? (
            <img src={previewUrl} alt="Favicon preview" className="h-10 w-10 object-contain" />
          ) : (
            <Sparkles className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>

        <div className="space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground">Favicon a ikona záložky</Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vyberte z už nahraných médií a symbolov značky alebo nahrajte nový .ico, .png, .svg súbor.
          </p>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isPending}
            onClick={() => setIsPickerOpen(true)}
            className="mt-1 shadow-xs cursor-pointer border-[#c8d400]/40 hover:border-[#c8d400] text-[#fafbfc]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Ukladám favicon...</span>
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4 mr-2 text-[#c8d400]" />
                <span>Vybrať alebo nahrať favicon</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <UniversalMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        brandId={brandId}
        title="Vybrať favicon značky"
        description="Zvoľte existujúci symbol, ikonu z knižnice médií alebo nahrajte nový súbor (.ico, .png, .svg)."
        currentUrl={previewUrl}
        onSelect={handleMediaSelect}
        acceptedFileTypes=".ico,image/png,image/svg+xml,.png,.ico,.svg"
        allowDirectUrl={true}
        includeBrandLogos={true}
      />
    </div>
  );
}
