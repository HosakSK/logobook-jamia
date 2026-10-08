"use client";

import { useState, useTransition } from "react";
import { setBrandHeaderLogoAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Sparkles, FolderOpen, Trash2 } from "lucide-react";
import { UniversalMediaPickerModal, SelectedMediaItem } from "@/components/admin/media/universal-media-picker-modal";

interface BrandHeaderLogoFormProps {
  brandId: string;
  initialHeaderLogoUrl?: string | null;
  dict: Dictionary;
}

export function BrandHeaderLogoForm({
  brandId,
  initialHeaderLogoUrl,
  dict,
}: BrandHeaderLogoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(initialHeaderLogoUrl || null);
  const [selectedItem, setSelectedItem] = useState<SelectedMediaItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialHeaderLogoUrl || null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // When media is picked from modal, update preview and mark as pending save
  const handleMediaSelect = (item: SelectedMediaItem) => {
    setError(null);
    setSelectedItem(item);
    setPreviewUrl(item.url);
  };

  const handleSaveLogo = () => {
    if (!selectedItem && previewUrl === savedLogoUrl) return;

    setError(null);
    startTransition(async () => {
      const res = await setBrandHeaderLogoAction(brandId, selectedItem ? (selectedItem.id || selectedItem.url) : previewUrl);
      if (res.success) {
        setSuccess(true);
        const newUrl = res.headerLogoUrl || (selectedItem ? selectedItem.url : previewUrl);
        setSavedLogoUrl(newUrl);
        setPreviewUrl(newUrl);
        setSelectedItem(null);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa uložiť logo v hlavičke");
      }
    });
  };

  const handleRemoveLogo = () => {
    setError(null);
    startTransition(async () => {
      const res = await setBrandHeaderLogoAction(brandId, null);
      if (res.success) {
        setSavedLogoUrl(null);
        setPreviewUrl(null);
        setSelectedItem(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa odstrániť logo");
      }
    });
  };

  const hasUnsavedChanges = selectedItem !== null || (previewUrl !== savedLogoUrl);

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-2xl bg-[#17212a] text-[#fafbfc] p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-[rgba(63,85,102,0.4)] pb-5">
        <h2 className="text-lg font-bold text-[#fafbfc]">Logo v hlavičke manuálu (Top bar)</h2>
        <p className="text-xs text-[#96abbe] mt-1">
          Oficiálne logo alebo symbol zobrazený v ľavom hornom rohu verejného manuálu a na uzamknutej obrazovke.
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
          <span>Logo v hlavičke bolo úspešne uložené!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Header Logo Preview Box */}
        <div className="h-24 w-44 rounded-xl border border-[rgba(63,85,102,0.6)] bg-[#070b0f] flex items-center justify-center overflow-hidden p-3 shadow-sm shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Logo v hlavičke"
              className="max-h-16 max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 text-center">
              <Sparkles className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground/60">Zatiaľ nezvolené</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5 flex-1">
          <Label className="text-xs font-semibold text-muted-foreground">
            Logo manuálu značky
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vyberte oficiálne logo z nahraných súborov značky, grafických symbolov alebo nahrajte nový SVG / PNG súbor. Ak logo nezvolíte, zobrazí sa farebný symbol s iniciálami a textovým názvom značky.
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
              <span>{previewUrl ? "Zmeniť logo v hlavičke" : "Vybrať logo v hlavičke"}</span>
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="default"
                disabled={isPending}
                onClick={handleRemoveLogo}
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
            <span className="text-amber-400 font-medium">Máte neuložený výber loga</span>
          ) : (
            "Zmeny sa aplikujú na verejný manuál"
          )}
        </span>
        <Button
          type="button"
          onClick={handleSaveLogo}
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
              <span>Uložiť logo</span>
            </>
          )}
        </Button>
      </div>

      {/* Universal Media Picker Modal */}
      <UniversalMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        brandId={brandId}
        onSelect={handleMediaSelect}
        currentUrl={previewUrl}
        title="Vybrať logo do hlavičky manuálu"
        description="Vyberte vektorové logo alebo grafický súbor pre horné menu brand manuálu."
        acceptedFileTypes="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg"
        allowDirectUrl={true}
        includeBrandLogos={true}
      />
    </div>
  );
}
