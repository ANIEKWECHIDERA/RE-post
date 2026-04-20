import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/components/legal-page";
import { legalPages } from "@/features/legal/content";

export const metadata: Metadata = {
  title: "User Data Deletion | RE-post",
  description: legalPages.deletion.description,
};

export default function DataDeletionPage() {
  return <LegalPage {...legalPages.deletion} />;
}
