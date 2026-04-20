import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/components/legal-page";
import { legalPages } from "@/features/legal/content";

export const metadata: Metadata = {
  title: "Terms of Service | RE-post",
  description: legalPages.terms.description,
};

export default function TermsPage() {
  return <LegalPage {...legalPages.terms} />;
}
