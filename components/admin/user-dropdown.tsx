"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { getDictionary, Locale, DEFAULT_LOCALE } from "@/lib/i18n";
import { User, CreditCard, LogOut, ChevronDown, ShieldCheck } from "lucide-react";

interface UserDropdownProps {
  user?: {
    email: string;
    name?: string;
    tier?: string;
    verified?: boolean;
  } | null;
  locale?: Locale;
}

export function UserDropdown({ user, locale = DEFAULT_LOCALE }: UserDropdownProps) {
  const dict = getDictionary(locale);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tier = user?.tier || "FREE";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="h-8 w-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs shadow-xs">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-foreground leading-none truncate max-w-[120px]">
            {displayName}
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-mono font-semibold">
            {tier}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-card border z-50 py-1.5 animate-in fade-in-50 zoom-in-95">
          {/* User Header */}
          <div className="px-3.5 py-2.5 border-b space-y-1">
            <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                {tier} Tier
              </span>
              {user?.verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>{dict.admin.profile}</span>
            </Link>
            <Link
              href="/admin/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{dict.admin.billing}</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t pt-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{dict.admin.logout}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
