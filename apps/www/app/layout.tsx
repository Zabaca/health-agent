import type { Metadata, Viewport } from "next";
import { Newsreader, Inter_Tight } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const SITE_URL = "https://www.veladon.com";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veladon — Your medical record. Yours.",
    template: "%s — Veladon",
  },
  description:
    "Request your medical records from any provider, organize them in one app, share them on your terms. Veladon — your personal health record storage.",
  alternates: {
    canonical: "/",
  },
  applicationName: "Veladon",
  appleWebApp: {
    title: "Veladon",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Veladon — Your medical record. Yours.",
    description:
      "Your personal health record storage. Request your records from any provider, organize them in one app, share them on your terms.",
    url: SITE_URL,
    siteName: "Veladon",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veladon — Your medical record. Yours.",
    description:
      "Your personal health record storage. Request your records from any provider, organize them in one app, share them on your terms.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Zabaca, LLC",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "info@veladon.com",
      areaServed: "US",
      availableLanguage: ["English"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "717 Brea Canyon Rd Ste 6",
    addressLocality: "Walnut",
    addressRegion: "CA",
    postalCode: "91789",
    addressCountry: "US",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
