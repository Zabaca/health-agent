import type { Metadata } from "next";
import { readLegalDocument } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The Veladon Terms of Service.",
};

export default function TermsPage() {
  const html = readLegalDocument("terms");
  return (
    <main className="legal">
      <div className="col" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
