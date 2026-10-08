"use client";

import { useState, useEffect, useTransition } from "react";
import { setBrandHeaderLogoAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Sparkles, FolderOpen, Trash2, Eye, Sliders } from "lucide-react";
import { UniversalMediaPickerModal, SelectedMediaItem } from "@/components/admin/media/universal-media-picker-modal";

interface BrandHeaderLogoFormProps {
  brandId: string;
  initialHeaderLogoUrl?: string | null;
  initialHeaderLogoHeight?: number;
  initialShowHeaderBrandName?: boolean;
  brandName?: string;
  themeSurfaceColor?: string;
  themeBgColor?: string;
  themeTextColor?: string;
  themeBorderColor?: string;
  themePrimaryColor?: string;
  isDarkTheme?: boolean;
  dict: Dictionary;
}

export function BrandHeaderLogoForm({
  brandId,
  initialHeaderLogoUrl,
  initialHeaderLogoHeight = 40,
  initialShowHeaderBrandName = true,
  brandName = "Brand",
  themeSurfaceColor = "#0e161d",
  themeBgColor = "#070b0f",
  themeTextColor = "#fafbfc",
  themeBorderColor = "rgba(63,85,102,0.6)",
  themePrimaryColor = "#c8d400",
  isDarkTheme = true,
  dict,
}: BrandHeaderLogoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(initialHeaderLogoUrl || null);
  const [selectedItem, setSelectedItem] = useState<SelectedMediaItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialHeaderLogoUrl || null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Logo height (in px, 24px - 64px, default 40px)
  const [logoHeight, setLogoHeight] = useState<number>(initialHeaderLogoHeight || 40);
  const [savedLogoHeight, setSavedLogoHeight] = useState<number>(initialHeaderLogoHeight || 40);

  // Show brand name next to logo in header
  const [showHeaderBrandName, setShowHeaderBrandName] = useState<boolean>(initialShowHeaderBrandName ?? true);
  const [savedShowHeaderBrandName, setSavedShowHeaderBrandName] = useState<boolean>(initialShowHeaderBrandName ?? true);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);

  // Synchronize when initialHeaderLogoUrl prop changes (e.g. after revalidation or page load)
  useEffect(() => {
    if (!selectedItem) {
      setPreviewUrl(initialHeaderLogoUrl || null);
      setSavedLogoUrl(initialHeaderLogoUrl || null);
      setImgLoadError(false);
    }
  }, [initialHeaderLogoUrl, selectedItem]);

  // When media is picked from modal, update preview and mark as pending save
  const handleMediaSelect = (item: SelectedMediaItem) => {
    setError(null);
    setImgLoadError(false);
    setSelectedItem(item);
    setPreviewUrl(item.url);
  };

  const handleSaveLogo = () => {
    setError(null);
    startTransition(async () => {
      const mediaParam = selectedItem ? (selectedItem.id || selectedItem.url) : previewUrl;
      const res = await setBrandHeaderLogoAction(brandId, mediaParam, {
        headerLogoHeight: logoHeight,
        showHeaderBrandName,
      });

      if (res.success) {
        setSuccess(true);
        const newUrl = res.headerLogoUrl || (selectedItem ? selectedItem.url : previewUrl);
        setSavedLogoUrl(newUrl);
        setPreviewUrl(newUrl);
        setSelectedItem(null);
        setSavedLogoHeight(res.headerLogoHeight ?? logoHeight);
        setSavedShowHeaderBrandName(res.showHeaderBrandName ?? showHeaderBrandName);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa uložiť nastavenia loga v hlavičke");
      }
    });
  };

  const handleRemoveLogo = () => {
    setError(null);
    startTransition(async () => {
      const res = await setBrandHeaderLogoAction(brandId, null, {
        headerLogoHeight: logoHeight,
        showHeaderBrandName,
      });
      if (res.success) {
        setSavedLogoUrl(null);
        setPreviewUrl(null);
        setSelectedItem(null);
        setSavedLogoHeight(res.headerLogoHeight ?? logoHeight);
        setSavedShowHeaderBrandName(res.showHeaderBrandName ?? showHeaderBrandName);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Nepodarilo sa odstrániť logo");
      }
    });
  };

  const hasUnsavedChanges =
    selectedItem !== null ||
    previewUrl !== savedLogoUrl ||
    logoHeight !== savedLogoHeight ||
    showHeaderBrandName !== savedShowHeaderBrandName;

  return (
    <div className="border border-[rgba(63,85,102,0.45)] rounded-2xl bg-[#17212a] text-[#fafbfc] p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-[rgba(63,85,102,0.4)] pb-5">
        <h2 className="text-lg font-bold text-[#fafbfc]">Logo a zobrazenie v hlavičke (Top bar)</h2>
        <p className="text-xs text-[#96abbe] mt-1">
          Oficiálne logo manuálu, jeho veľkosť a nastavenie zobrazenia názvu značky v hornom paneli.
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
          <span>Nastavenia loga v hlavičke boli úspešne uložené!</span>
        </div>
      )}

      {/* Live Preview Box representing Top Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-[#96abbe]">
            <Eye className="h-3.5 w-3.5 text-[#c8d400]" />
            Náhľad hlavičky verejného manuálu:
          </span>
          <span className="text-[11px] text-[#96abbe]/80">Výška loga: {logoHeight}px</span>
        </div>
        {/* Top Bar Box styled strictly by the active manual theme */}
        <div
          className="rounded-xl px-5 py-4 shadow-inner flex items-center justify-between overflow-hidden min-h-[72px] transition-colors"
          style={{
            backgroundColor: themeSurfaceColor,
            borderColor: themeBorderColor,
            borderWidth: "1px",
            borderStyle: "solid",
            color: themeTextColor,
          }}
        >
          <div className="flex items-center gap-3">
            {previewUrl && !imgLoadError ? (
              <div
                className="flex items-center justify-center transition-all duration-200"
                style={{ height: `${logoHeight}px` }}
              >
                <img
                  src={previewUrl}
                  alt="Logo v hlavičke"
                  style={{
                    height: `${logoHeight}px`,
                    maxHeight: `${logoHeight}px`,
                    maxWidth: "320px",
                  }}
                  className="w-auto object-contain object-left block"
                  onError={() => {
                    console.warn("Header logo preview failed to load image:", previewUrl);
                    setImgLoadError(true);
                  }}
                />
              </div>
            ) : (
              <div
                className="h-10 w-10 flex items-center justify-center font-bold text-xs shadow-xs rounded-xl shrink-0"
                style={{
                  backgroundColor: themePrimaryColor,
                  color: isDarkTheme ? "#070b0f" : "#fafbfc",
                }}
              >
                {brandName.slice(0, 2).toUpperCase()}
              </div>
            )}

            {showHeaderBrandName && (
              <div className="flex items-center">
                <span
                  className="font-bold tracking-tight text-sm uppercase"
                  style={{ color: themeTextColor }}
                >
                  {brandName}
                </span>
                <span
                  className="text-xs ml-2.5 pl-2.5 font-medium border-l"
                  style={{
                    color: isDarkTheme ? "#96abbe" : "#587489",
                    borderColor: themeBorderColor,
                  }}
                >
                  Brand Manual
                </span>
              </div>
            )}
          </div>

          <div
            className="text-[11px] font-mono hidden sm:block"
            style={{ color: isDarkTheme ? "rgba(150,171,190,0.6)" : "rgba(88,116,137,0.7)" }}
          >
            Top Bar Preview
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="space-y-6 pt-2">
        {/* Logo Picker Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[rgba(63,85,102,0.3)] bg-[#0e161d]">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#fafbfc]">
              Grafický súbor loga
            </Label>
            <p className="text-xs text-[#96abbe]">
              {previewUrl
                ? "Logo je vybrané. Môžete ho nahradiť iným formátom alebo zmazať."
                : "Zatiaľ nie je zvolené žiadne logo. Zobrazuje sa iniciálový odznak."}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={isPending}
              onClick={() => setIsPickerOpen(true)}
              className="shadow-xs cursor-pointer border-[#c8d400]/40 hover:border-[#c8d400] text-[#fafbfc]"
            >
              <FolderOpen className="h-4 w-4 mr-2 text-[#c8d400]" />
              <span>{previewUrl ? "Zmeniť logo" : "Vybrať logo"}</span>
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

        {/* Logo Size Control (Slider) */}
        <div className="p-4 rounded-xl border border-[rgba(63,85,102,0.3)] bg-[#0e161d] space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-[#fafbfc] flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#c8d400]" />
              Veľkosť loga v hlavičke
            </Label>
            <span className="text-xs font-mono font-bold text-[#c8d400] bg-[#17212a] px-2.5 py-0.5 rounded border border-[rgba(63,85,102,0.4)]">
              {logoHeight} px
            </span>
          </div>
          <p className="text-xs text-[#96abbe]">
            Nastavte výšku loga v pixeloch (od 24px do 110px, predvolene 44px). Pomer strán je automaticky zachovaný.
          </p>
          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min="24"
              max="110"
              step="2"
              value={logoHeight}
              onChange={(e) => setLogoHeight(Number(e.target.value))}
              className="flex-1 accent-[#c8d400] h-2 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <Input
              type="number"
              min={20}
              max={140}
              value={logoHeight}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) setLogoHeight(Math.max(20, Math.min(140, val)));
              }}
              className="w-20 h-9 text-xs rounded-lg bg-background/50 border-[rgba(63,85,102,0.4)] text-center font-mono"
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#96abbe]/60 font-mono pt-0.5">
            <span>24px (Kompaktné)</span>
            <span>44px (Štandard)</span>
            <span>72px (Veľké)</span>
            <span>110px (Extra veľké)</span>
          </div>
        </div>

        {/* Show Brand Name Toggle Switch */}
        <div className="p-4 rounded-xl border border-[rgba(63,85,102,0.3)] bg-[#0e161d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#fafbfc]">
              Zobraziť v hlavičke aj textový názov značky
            </Label>
            <p className="text-xs text-[#96abbe] leading-relaxed max-w-lg">
              Zapnuté: vedľa loga sa zobrazí aj textový názov „{brandName}“ a štítok Brand Manual. Vypnuté: v hlavičke sa zobrazí iba čisté logo.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showHeaderBrandName}
            onClick={() => setShowHeaderBrandName(!showHeaderBrandName)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              showHeaderBrandName ? "bg-[#c8d400]" : "bg-neutral-800 border-[rgba(63,85,102,0.5)]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#070b0f] shadow-md ring-0 transition duration-200 ease-in-out ${
                showHeaderBrandName ? "translate-x-5" : "translate-x-0 bg-neutral-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(63,85,102,0.3)]">
        <span className="text-xs text-muted-foreground">
          {hasUnsavedChanges ? (
            <span className="text-amber-400 font-medium">Máte neuložené zmeny v nastavení hlavičky</span>
          ) : (
            "Všetky zmeny hlavičky sú uložené"
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
              <span>Uložiť nastavenia hlavičky</span>
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
