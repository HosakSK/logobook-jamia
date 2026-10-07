"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface ChangePasswordFormProps {
  dict: Dictionary;
}

export function ChangePasswordForm({ dict }: ChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await changePasswordAction(null, formData);
      if (res.success) {
        setSuccess(true);
        form.reset();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update password");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-[rgba(63,85,102,0.45)] rounded-[3px] bg-[#17212a] text-[#fafbfc] p-6 shadow-xs space-y-6">
      <div className="border-b border-[rgba(63,85,102,0.4)] pb-4">
        <h2 className="text-base font-bold text-[#fafbfc]">{dict.admin.securityPassword}</h2>
        <p className="text-xs text-[#96abbe] mt-0.5">{dict.admin.securityPasswordDesc}</p>
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
          <span>{dict.admin.passwordUpdated}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="oldPassword" className="text-xs font-semibold">
            {dict.admin.currentPasswordLabel}
          </Label>
          <Input
            id="oldPassword"
            name="oldPassword"
            type="password"
            required
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold">
            {dict.admin.newPasswordLabel}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirm" className="text-xs font-semibold">
            {dict.admin.confirmPasswordLabel}
          </Label>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
            placeholder="••••••••"
          />
        </div>
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
            dict.admin.updatePassword
          )}
        </Button>
      </div>
    </form>
  );
}
