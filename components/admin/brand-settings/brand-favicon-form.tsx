"use client";

import { useState, useTransition } from "react";
import { setBrandFaviconAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Sparkles, FolderOpen, Trash2 } from "lucide-react";
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
  const [savedFaviconUrl, setSavedFaviconUrl] = useState<string | null>(initialFaviconUrl || null);
  const [selectedItem, setSelectedItem] = useState<SelectedMediaItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFaviconUrl || null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // When media is picked from modal, update preview and mark as pending save
  const handleMediaSelect = (item: SelectedMediaItem) => {
    setError(null);
    setSelectedItem(item);
    setPreviewUrl(item.url);
  };

  const handleSaveFavicon = () => {
    if (!selectedItem && previewUrl === savedFaviconUrl) return;

    setError(null);
    startTransition(async () => {
      const res = await setBrandFaviconAction(brandId, selectedItem ? (selectedItem.id || selectedItem.url) : previewUrl);
      if (res.success) {
        setSuccess(true);
        const newUrl = res.faviconUrl || (selectedItem ? selectedItem.url : previewUrl);
        setSavedFaviconUrl(newUrl);
        setPreviewUrl(newUrl);
        setSelectedItem(null);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa uložiť favicon");
      }
    });
  };

  const handleRemoveFavicon = () => {
    setError(null);
    startTransition(async () => {
      const res = await setBrandFaviconAction(brandId, "");
      if (res.success) {
        setSavedFaviconUrl(null);
        setPreviewUrl(null);
        setSelectedItem(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa odstrániť favicon");
      }
    });
  };

  const hasUnsavedChanges = selectedItem !== null || (previewUrl !== savedFaviconUrl);

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
          <span>Favicon bol úspešne uložený!</span>
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

        <div className="space-y-2.5 flex-1">
          <Label className="text-xs font-semibold text-muted-foreground">Favicon a ikona záložky</Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vyberte z už nahraných médií a symbolov značky alebo nahrajte nový .ico, .png, .svg súbor.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={isPending}
              onClick={() => setIsPickerOpen(true)}
              className="shadow-xs cursor-pointer border-[#c8d400]/40 hover:border-[#c8d400] text-[#fafbfc]"
            >
              <FolderOpen className="h-4 w-4 mr-2 text-[#c8d400]" />
              <span>{previewUrl ? "Zmeniť favicon" : "Vybrať alebo nahrať favicon"}</span>
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                disabled={isPending}
                onClick={handleRemoveFavicon}
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Odstrániť</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(63,85,102,0.3)]">
        <span className="text-xs text-muted-foreground">
          {hasUnsavedChanges ? (
            <span className="text-amber-400 font-medium">Máte neuložený výber favicony</span>
          ) : (
            "Zmeny sa aplikujú na záložku prehliadača manuálu"
          )}
        </span>
        <Button
          type="button"
          onClick={handleSaveFavicon}
          disabled={isPending || !hasUnsavedChanges}
          size="default"
          className="bg-[#c8d400] hover:bg-[#b0bc00] text-[#070b0f] font-bold shadow-md cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Ukladám...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              <span>Uložiť favicon</span>
            </>
          )}
        </Button>
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
