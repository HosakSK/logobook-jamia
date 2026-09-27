import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar placeholder */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card p-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-black">LB</span>
          <span className="font-bold text-lg">Logobook CMS</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1 text-sm font-medium">
          <Link href="/admin" className="rounded-lg bg-accent px-3 py-2 text-foreground font-semibold">
            Prehľad manuálov
          </Link>
          <span className="text-xs font-semibold text-muted-foreground uppercase px-3 mt-4 mb-1">
            Nastavenia
          </span>
          <span className="rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed">
            Tím a oprávnenia
          </span>
          <span className="rounded-lg px-3 py-2 text-muted-foreground cursor-not-allowed">
            Predplatné a kvóty
          </span>
        </nav>
        <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>v0.0.1.6</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Administrácia</h2>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Späť na web
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
