import { cookies } from "next/headers";
import { getDictionary, DEFAULT_LOCALE, isValidLocale, Locale } from "@/lib/i18n";
import { Users, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminTeamPage() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "";
  const currentLocale: Locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(currentLocale);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dict.admin.team}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organization members, agency collaborators, and access roles.
          </p>
        </div>
        <Button size="sm" className="gap-2 self-start sm:self-auto text-xs">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <div className="border rounded-2xl p-6 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b text-xs text-muted-foreground font-medium">
          <span>Member</span>
          <span>Role</span>
        </div>

        <div className="flex items-center justify-between py-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
              OW
            </div>
            <div>
              <p className="font-semibold text-foreground">Workspace Owner</p>
              <p className="text-[11px] text-muted-foreground">Primary Administrator</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground">
            OWNER
          </span>
        </div>
      </div>
    </div>
  );
}
