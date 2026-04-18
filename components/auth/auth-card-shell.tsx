import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCardShell({
  title,
  description,
  children,
  footer,
  supabaseReady,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  supabaseReady: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md rounded-lg shadow-soft">
        <CardHeader>
          <Badge className="mb-2 w-fit rounded-md" variant={supabaseReady ? "default" : "secondary"}>
            {supabaseReady ? "Supabase ready" : "Supabase env pending"}
          </Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {children}
          <p className="text-sm text-muted-foreground">{footer}</p>
          <Link className="text-xs text-muted-foreground underline-offset-4 hover:underline" href="/api/health">
            Check system health
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
