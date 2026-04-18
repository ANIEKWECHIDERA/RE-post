import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/env/public";
import { signInAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

export default async function SignInPage() {
  const supabaseReady = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthCardShell
      description="Sign in to manage your creator streak, scheduled posts, and publishing queue."
      footer={
        <>
          New here?{" "}
          <Link className="font-medium text-primary" href="/sign-up">
            Create an account
          </Link>
        </>
      }
      supabaseReady={supabaseReady}
      title="Welcome back"
    >
      <AuthForm action={signInAction} disabled={!supabaseReady} mode="sign-in" />
    </AuthCardShell>
  );
}
