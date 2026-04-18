import { redirect } from "next/navigation";

import { SupabaseSetupRequired } from "@/components/auth/supabase-setup-required";
import { AppShell } from "@/components/layout/app-shell";
import { isSupabaseConfigured } from "@/lib/env/public";
import { getCurrentUser } from "@/server/auth/session";
import { ensureProfileBootstrap } from "@/server/profiles/bootstrap";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SupabaseSetupRequired />;
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const bootstrap = await ensureProfileBootstrap(user);

  if (!bootstrap.ok) {
    return <SupabaseSetupRequired />;
  }

  return (
    <AppShell
      currentUser={{
        email: user.email ?? "creator@re-post.app",
        displayName:
          typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : "Creator",
      }}
    >
      {children}
    </AppShell>
  );
}
