import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env/public";

export default function SignUpPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-md rounded-lg shadow-soft">
        <CardHeader>
          <CardTitle>Start the streak</CardTitle>
          <CardDescription>
            Phase 1 keeps this safe and non-functional until Supabase Auth is wired in Phase 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input disabled placeholder="Creator name" />
          <Input disabled placeholder="creator@example.com" type="email" />
          <Input disabled placeholder="Password" type="password" />
          <Button disabled={!supabaseReady} className="rounded-md">
            {supabaseReady ? "Create account" : "Add Supabase env first"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already posting?{" "}
            <Link className="font-medium text-primary" href="/sign-in">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
