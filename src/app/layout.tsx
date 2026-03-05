import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "First Commit — See how it was built",
  description:
    "See how it was built. Developers share step-by-step build stories — from first commit to production — powered by AI coding sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${newsreader.variable} font-sans antialiased selection:bg-accent/30 selection:text-accent-foreground`}
      >
        <ThemeProvider>
          <LocaleProvider>
            <AppShell>{children}</AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
