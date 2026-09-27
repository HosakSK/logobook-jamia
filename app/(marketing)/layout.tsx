import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-xl">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-black">LB</span>
            Logobook.sk
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Administrácia
            </Link>
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/admin">Prihlásiť sa</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} Logobook.sk. Všetky práva vyhradené.
        </div>
      </footer>
    </div>
  );
}
