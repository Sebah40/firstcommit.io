import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { AppShell } from "@/components/layout/app-shell";
import { DEFAULT_LOCALE, STORAGE_KEY, type Locale } from "@/lib/i18n";
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
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://firstcommit.io"),
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    siteName: "First Commit",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(STORAGE_KEY)?.value;
  const initialLocale: Locale =
    cookieLocale === "en" || cookieLocale === "es" ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${newsreader.variable} font-sans antialiased selection:bg-accent/30 selection:text-accent-foreground`}
      >
        <ThemeProvider>
          <LocaleProvider initialLocale={initialLocale}>
            <AppShell>{children}</AppShell>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
