import type { Metadata } from "next";
import { readLegalDocument } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Veladon Terms of Service — the contract between you and Zabaca, LLC for using the Veladon personal health record app.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const html = readLegalDocument("terms");
  return (
    <main className="legal">
      <div className="col" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
