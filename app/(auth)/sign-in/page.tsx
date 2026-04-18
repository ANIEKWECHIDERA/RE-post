import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env/public";

export default function SignInPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-md rounded-lg shadow-soft">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Auth UI is scaffolded in Phase 1. Phase 3 will connect Supabase Auth actions and protected routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input disabled placeholder="creator@example.com" type="email" />
          <Input disabled placeholder="Password" type="password" />
          <Button disabled={!supabaseReady} className="rounded-md">
            {supabaseReady ? "Sign in" : "Add Supabase env first"}
          </Button>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link className="font-medium text-primary" href="/sign-up">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
