import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4 bg-background">
      <div className="space-y-4 max-w-md">
        <h1 className="text-6xl font-black text-primary">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Stránka nenájdená</h2>
        <p className="text-sm text-muted-foreground">
          Požadovaný manuál alebo stránka neexistuje, bola presunutá alebo zmenila adresu.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/">Návrat na hlavnú stránku</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
