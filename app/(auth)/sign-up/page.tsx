import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/env/public";
import { signUpAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

export default async function SignUpPage() {
  const supabaseReady = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCardShell
      description="Create the workspace that will hold your streaks, scheduled posts, media, and publishing history."
      footer={
        <>
          Already posting?{" "}
          <Link className="font-medium text-primary" href="/sign-in">
            Sign in
          </Link>
        </>
      }
      supabaseReady={supabaseReady}
      title="Start the streak"
    >
      <AuthForm action={signUpAction} disabled={!supabaseReady} mode="sign-up" />
    </AuthCardShell>
  );
}
