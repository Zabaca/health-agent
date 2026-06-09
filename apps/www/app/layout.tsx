import type { Metadata } from "next";
import { Newsreader, Inter_Tight } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-newsreader",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://veladon.com"),
  title: {
    default: "Veladon — Your medical record. Yours.",
    template: "%s — Veladon",
  },
  description:
    "Veladon is your personal health record storage. Request your medical records from any provider, organize them in one app, and share them on your terms.",
  openGraph: {
    title: "Veladon — Your medical record. Yours.",
    description:
      "Your personal health record storage. Request your records from any provider, organize them in one app, share them on your terms.",
    url: "https://veladon.com",
    siteName: "Veladon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veladon — Your medical record. Yours.",
    description:
      "Your personal health record storage. Request your records from any provider, organize them in one app, share them on your terms.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${interTight.variable}`}>
      <body>
        <header className="site-header">
          <div className="row">
            <Link href="/" className="brand">
              Veladon
            </Link>
            <nav aria-label="Primary">
              <Link href="/support">Support</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="row">
            <div>Veladon · A Zabaca product · veladon.com</div>
            <nav aria-label="Footer">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/support">Support</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
