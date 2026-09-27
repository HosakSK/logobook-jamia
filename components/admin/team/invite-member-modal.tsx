"use client";

import { useState, useTransition } from "react";
import { inviteMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { UserPlus, Lock, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface InviteMemberModalProps {
  brandId: string;
  isLocked: boolean;
  lockReason?: string;
  dict: Dictionary;
}

export function InviteMemberModal({
  brandId,
  isLocked,
  lockReason,
  dict,
}: InviteMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await inviteMemberAction(brandId, null, formData);
      if (res.success) {
        setSuccess(true);
        form.reset();
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 1500);
      } else {
        setError(res.error || "Failed to invite member");
      }
    });
  };

  if (isLocked) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-9 px-4 text-xs font-semibold rounded-[3px] border-border/60 gap-1.5 opacity-80"
      >
        <Link href="/admin/billing" title={lockReason || dict.admin.teamLimitLocked}>
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>{dict.admin.inviteMemberButton}</span>
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          setError(null);
          setSuccess(false);
          setIsOpen(true);
        }}
        className="h-9 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>{dict.admin.inviteMemberButton}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0e161d] border border-border/60 rounded-[3px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <UserPlus className="h-5 w-5 text-[#c8d400]" />
                <h3>{dict.admin.inviteMemberModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {dict.admin.inviteMemberModalDesc}
            </p>

            {error && (
              <div className="flex items-start gap-2 p-3 text-xs bg-red-950/60 border border-red-500/50 text-red-300 rounded-[3px]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-[3px]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Člen tímu bol úspešne pridaný!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  {dict.admin.emailAddressLabel}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="kolega@firma.sk"
                  className="h-9 text-xs rounded-[3px] bg-background border-border/60"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs font-semibold">
                  {dict.admin.roleLabel}
                </Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="EDITOR"
                  className="w-full h-9 px-3 text-xs bg-background border border-border/60 rounded-[3px] text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#c8d400]"
                >
                  <option value="EDITOR">EDITOR – {dict.admin.roleEditorDesc}</option>
                  <option value="VIEWER">VIEWER – {dict.admin.roleViewerDesc}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-9 text-xs rounded-[3px] border-border/60"
                >
                  Zrušiť
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{dict.admin.inviting}</span>
                    </>
                  ) : (
                    <span>{dict.admin.sendInvitation}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
