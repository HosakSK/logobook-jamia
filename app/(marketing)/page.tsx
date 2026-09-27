import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Layers, ShieldCheck, Zap } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Beta verzia 0.0.1
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
          Online brand manuál, ktorý vaše logo nikdy nezradí
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Zabudnite na neaktuálne 100-stranové PDF manuály. Logobook.sk je moderná, interaktívna platforma pre prezentáciu a distribúciu identity vašej značky.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin">
              Vstúpiť do administrácie <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/m/demo">
              Ukážkový manuál
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
            <Zap className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Blesková rýchlosť</h3>
            <p className="text-sm text-muted-foreground">
              Postavené na Next.js a PocketBase pre okamžité načítanie a plynulý zážitok.
            </p>
          </div>
          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
            <BookOpen className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">25 stavebných modulov</h3>
            <p className="text-sm text-muted-foreground">
              Všetko od zobrazenia loga, pravidiel ochrannej zóny až po RAL a Pantone palety.
            </p>
          </div>
          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
            <Layers className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Multi-tenancy & Vlastné domény</h3>
            <p className="text-sm text-muted-foreground">
              Každý manuál beží na vlastnej subdoméne alebo firemnej doméne s SSL certifikátom.
            </p>
          </div>
          <div className="rounded-xl border p-6 bg-card text-card-foreground shadow-sm">
            <ShieldCheck className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Offline HTML export</h3>
            <p className="text-sm text-muted-foreground">
              Stiahnite si manuál ako 100% autonómny ZIP balík použiteľný aj bez internetu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
