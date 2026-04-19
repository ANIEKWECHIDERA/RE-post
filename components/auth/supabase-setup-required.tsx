import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SupabaseSetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="max-w-xl rounded-lg shadow-soft">
        <CardHeader>
          <CardTitle>Connect Supabase to enter RE-post</CardTitle>
          <CardDescription>
            Auth is wired, but this workspace does not have Supabase environment
            variables yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>
            Add these values to `.env` before testing sign up, sign in, profile
            bootstrap, or protected data loading:
          </p>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs text-foreground">
            NEXT_PUBLIC_SUPABASE_URL{'\n'}
            NEXT_PUBLIC_SUPABASE_ANON_KEY{'\n'}
            SUPABASE_SERVICE_ROLE_KEY{'\n'}
            TOKEN_ENCRYPTION_KEY
          </pre>
          <p>
            Remote migrations are applied; after env setup, profile and streak
            bootstrap rows can be created.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
