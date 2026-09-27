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
    <div className="border border-border/40 rounded-[3px] bg-card p-6 shadow-xs space-y-4">
      <div className="border-b border-border/30 pb-4">
        <h2 className="text-base font-bold text-foreground">{dict.admin.faviconLabel}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dict.admin.faviconHint}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-[3px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-[3px]">
          <Check className="h-4 w-4 shrink-0" />
          <span>Favicon bol úspešne nahraný!</span>
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Favicon Preview Box */}
        <div className="h-16 w-16 rounded-[3px] border border-border/60 bg-background/50 flex items-center justify-center overflow-hidden p-2 shadow-xs">
          {previewUrl ? (
            <img src={previewUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
          ) : (
            <Sparkles className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Nahrať novú ikonu</Label>
          <p className="text-[11px] text-muted-foreground">
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
            size="sm"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 text-xs rounded-[3px] border-border/60 mt-1 gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Nahrávam...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Vybrať favicon</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
