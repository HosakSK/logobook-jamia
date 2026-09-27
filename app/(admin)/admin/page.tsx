import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moje Brand Manuály</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prehľad aktívnych manuálov a rozpracovaných projektov.
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Nový manuál
        </Button>
      </div>

      {/* Empty / Placeholder State */}
      <div className="rounded-xl border border-dashed p-12 text-center flex flex-col items-center justify-center bg-card">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4 stroke-[1.5]" />
        <h3 className="font-semibold text-base mb-1">Žiadne manuály</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Zatiaľ nemáte vytvorený žiadny brand manuál. Začnite kliknutím na tlačidlo nižšie.
        </p>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Vytvoriť prvý projekt
        </Button>
      </div>
    </div>
  );
}
