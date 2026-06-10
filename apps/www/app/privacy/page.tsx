import type { Metadata } from "next";
import { readLegalDocument } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Veladon collects, uses, stores, and protects your health information — and what we will never do with it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const html = readLegalDocument("privacy");
  return (
    <main className="legal">
      <div className="col" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
