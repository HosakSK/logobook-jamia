import { BookOpen } from "lucide-react";

export default async function ManualPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="border rounded-2xl p-10 bg-card shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium uppercase tracking-wider">
            Identita Značky
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Vitajte v manuáli značky {domain}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Tento manuál definuje základné vizuálne štandardy, pravidlá používania logotypu,
          typografiu a farby značky. Konkrétne moduly a obsah sa načítajú z konfigurácie manuálu.
        </p>
        <div className="pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div>
            Doménový identifikátor: <span className="font-mono font-semibold text-foreground">{domain}</span>
          </div>
          <div>•</div>
          <div>
            Stav: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aktívny</span>
          </div>
        </div>
      </div>
    </div>
  );
}
