import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "600", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Logobook.sk | Moderný online brand manuál",
  description:
    "Profesionálna platforma pre tvorbu, správu a zdieľanie dizajn manuálov a digitálnych identít.",
  icons: {
    icon: "/logo/logo-symbol-dark.svg",
    shortcut: "/logo/logo-symbol-dark.svg",
    apple: "/logo/logo-symbol-dark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sk"
      suppressHydrationWarning
      className={plusJakartaSans.variable}
    >
      <body className="min-h-screen font-sans bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground font-light">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
