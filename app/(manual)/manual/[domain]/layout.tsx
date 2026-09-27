import { ThemeToggle } from "@/components/theme-toggle";

export default async function ManualLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Brand Manual Header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-lg uppercase">
              {domain}
            </span>
            <span className="text-xs text-muted-foreground border-l pl-3">
              Brand Manuál
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Manual Content */}
      <main className="flex-1">{children}</main>

      {/* Manual Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          Vytvorené v platforme{" "}
          <a
            href="/"
            className="font-medium underline hover:text-foreground transition-colors"
          >
            Logobook.sk
          </a>
        </div>
      </footer>
    </div>
  );
}
