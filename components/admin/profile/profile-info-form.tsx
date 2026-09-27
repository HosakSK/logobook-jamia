"use client";

import { useState, useTransition, useRef } from "react";
import { updateUserProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dictionary } from "@/lib/i18n";
import { getFileUrl } from "@/lib/pocketbase";
import { Camera, Check, AlertCircle, Loader2 } from "lucide-react";

interface ProfileInfoFormProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    avatar?: string;
    locale?: string;
  };
  dict: Dictionary;
}

export function ProfileInfoForm({ user, dict }: ProfileInfoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar ? getFileUrl("users", user.id, user.avatar) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(dict.admin.avatarHint);
        return;
      }
      setError(null);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateUserProfileAction(null, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/40 rounded-[3px] bg-card p-6 shadow-xs space-y-6">
      <div className="border-b border-border/30 pb-4">
        <h2 className="text-base font-bold text-foreground">{dict.admin.personalInfo}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{dict.admin.personalInfoDesc}</p>
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

      {/* Avatar Row */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-[3px] bg-neutral-900 border border-border/60 overflow-hidden flex items-center justify-center text-white font-bold text-xl shadow-xs">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user.name || "Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {user.name ? user.name.slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase() || "LB"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-[3px] text-[10px]"
          >
            <Camera className="h-4 w-4 mb-1" />
            <span>Zmeniť</span>
          </button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">{dict.admin.avatarLabel}</Label>
          <p className="text-[11px] text-muted-foreground">{dict.admin.avatarHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs rounded-[3px] border-border/60 mt-1"
          >
            Vybrať súbor
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">
            {dict.admin.fullNameLabel}
          </Label>
          <Input
            id="name"
            name="name"
            defaultValue={user.name || ""}
            required
            className="h-9 text-xs rounded-[3px] bg-background/50 border-border/60"
          />
        </div>

        {/* Interface Language */}
        <div className="space-y-1.5">
          <Label htmlFor="locale" className="text-xs font-semibold">
            {dict.admin.uiLanguageLabel}
          </Label>
          <select
            id="locale"
            name="locale"
            defaultValue={user.locale || "sk"}
            className="w-full h-9 px-3 text-xs bg-background/50 border border-border/60 rounded-[3px] text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#c8d400]"
          >
            <option value="sk">Slovenčina (SK)</option>
            <option value="cs">Čeština (CS)</option>
            <option value="en">English (EN)</option>
          </select>
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
            dict.admin.saveChanges
          )}
        </Button>
      </div>
    </form>
  );
}
