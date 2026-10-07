"use client";

import { useState, useTransition, useRef } from "react";
import { uploadBrandFaviconAction } from "@/actions/brand-settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Upload, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(dict.admin.faviconHint);
        return;
      }
      setError(null);
      setPreviewUrl(URL.createObjectURL(file));

      // Auto submit on file selection
      const formData = new FormData();
      formData.set("favicon", file);

      startTransition(async () => {
        const res = await uploadBrandFaviconAction(brandId, formData);
        if (res.success) {
          setSuccess(true);
          if (res.faviconUrl) {
            setPreviewUrl(res.faviconUrl);
          }
          setTimeout(() => setSuccess(false), 4000);
        } else {
          setError(res.error || "Failed to upload favicon");
        }
      });
    }
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
          <Label className="text-xs font-semibold text-muted-foreground">Nahrať novú ikonu</Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Podporované formáty: .ico, .png, .svg (odporúčaný rozmer: 32x32 alebo 64x64 px).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            name="favicon"
            accept=".ico,image/png,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Nahrávam...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                <span>Vybrať favicon</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
