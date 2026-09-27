"use client";

import { useState, useTransition } from "react";
import { upsertAgencyDefaultsAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface AgencyDefaultsFormProps {
  initialDefaults?: {
    defaultClearanceZone?: { percent?: number };
    defaultMinSize?: { printMm?: number; digitalPx?: number };
    defaultRules?: { text?: string };
    defaultPageTree?: { template?: string };
  } | null;
  dict: Dictionary;
}

export function AgencyDefaultsForm({ initialDefaults, dict }: AgencyDefaultsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const clearance = initialDefaults?.defaultClearanceZone?.percent ?? 10;
  const printMm = initialDefaults?.defaultMinSize?.printMm ?? 15;
  const digitalPx = initialDefaults?.defaultMinSize?.digitalPx ?? 32;
  const rules =
    initialDefaults?.defaultRules?.text ??
    "1. Nepoužívajte logo na vizuálne rušivých pozadiach.\n2. Nemeňte proporcie a pomer strán loga.\n3. Nemeňte farby logotypu mimo definovanú oficiálnu paletu.\n4. Dodržiavajte ochrannú zónu a minimálne veľkosti.";
  const treeTemplate = initialDefaults?.defaultPageTree?.template ?? "standard";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await upsertAgencyDefaultsAction(null, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update agency defaults");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/40 rounded-[3px] bg-card p-6 shadow-xs space-y-6">
      <div className="border-b border-border/30 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{dict.admin.agencyDefaultsTitle}</h2>
            <span className="px-2 py-0.5 rounded-[3px] bg-[#c8d400]/10 text-[#c8d400] text-[10px] font-bold tracking-wider uppercase border border-[#c8d400]/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Agency
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{dict.admin.agencyDefaultsDesc}</p>
        </div>
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
          <span>{dict.admin.changesSaved}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Clearance Zone */}
        <div className="space-y-1.5">
          <Label htmlFor="defaultClearanceZone" className="text-xs font-semibold">
            {dict.admin.defaultClearanceLabel}
          </Label>
          <Input
            id="defaultClearanceZone"
            name="defaultClearanceZone"
            type="number"
            min={0}
            max={100}
            defaultValue={clearance}
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
          />
        </div>

        {/* Min Size Print */}
        <div className="space-y-1.5">
          <Label htmlFor="defaultMinSizePrintMm" className="text-xs font-semibold">
            {dict.admin.defaultMinPrintLabel}
          </Label>
          <Input
            id="defaultMinSizePrintMm"
            name="defaultMinSizePrintMm"
            type="number"
            min={1}
            max={500}
            defaultValue={printMm}
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
          />
        </div>

        {/* Min Size Digital */}
        <div className="space-y-1.5">
          <Label htmlFor="defaultMinSizeDigitalPx" className="text-xs font-semibold">
            {dict.admin.defaultMinDigitalLabel}
          </Label>
          <Input
            id="defaultMinSizeDigitalPx"
            name="defaultMinSizeDigitalPx"
            type="number"
            min={8}
            max={2000}
            defaultValue={digitalPx}
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
          />
        </div>
      </div>

      {/* Page Tree Default */}
      <div className="space-y-1.5">
        <Label htmlFor="defaultPageTree" className="text-xs font-semibold">
          {dict.admin.defaultTreeLabel}
        </Label>
        <select
          id="defaultPageTree"
          name="defaultPageTree"
          defaultValue={treeTemplate}
          className="w-full h-9 px-3 text-xs bg-background/50 border border-border/60 rounded-[3px] text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#c8d400]"
        >
          <option value="standard">{dict.admin.treeStandard}</option>
          <option value="minimal">{dict.admin.treeMinimal}</option>
        </select>
      </div>

      {/* Do's & Don'ts Template */}
      <div className="space-y-1.5">
        <Label htmlFor="defaultRules" className="text-xs font-semibold">
          {dict.admin.defaultRulesLabel}
        </Label>
        <Textarea
          id="defaultRules"
          name="defaultRules"
          rows={5}
          defaultValue={rules}
          className="text-xs rounded-[3px] bg-background/50 border-border/60 font-mono leading-relaxed"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 px-5 bg-[#c8d400] text-[#070b0f] font-semibold hover:bg-[#b5c000] rounded-[3px] text-xs transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              {dict.admin.saving}
            </>
          ) : (
            dict.admin.saveChanges
          )}
        </Button>
      </div>
    </form>
  );
}
