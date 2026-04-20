import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/components/legal-page";
import { legalPages } from "@/features/legal/content";

export const metadata: Metadata = {
  title: "Privacy Policy | RE-post",
  description: legalPages.privacy.description,
};

export default function PrivacyPage() {
  return <LegalPage {...legalPages.privacy} />;
}
