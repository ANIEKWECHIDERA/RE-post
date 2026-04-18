import { BarChart3, CalendarDays, Home, Link2, PenSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/server/auth/actions";

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Compose", icon: PenSquare, active: false },
  { label: "Schedule", icon: CalendarDays, active: false },
  { label: "Connections", icon: Link2, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
];

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: {
    email: string;
    displayName: string;
  };
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card px-5 py-6 lg:block">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">RE-post</p>
            <p className="text-xs text-muted-foreground">Creator command center</p>
          </div>
          <Badge className="rounded-md" variant="secondary">
            v2
          </Badge>
        </div>

        <Separator className="my-6" />

        <nav className="grid gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border bg-background p-4">
          <p className="text-sm font-medium">Today&apos;s creator loop</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Draft once. Validate per platform. Publish with confidence.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Saturday, April 18</p>
              <h1 className="text-xl font-semibold">Creator Home</h1>
            </div>
            <div className="flex items-center gap-3">
              <form action={signOutAction}>
                <Button variant="outline" className="hidden rounded-md sm:inline-flex" type="submit">
                  Sign out
                </Button>
              </form>
              <Avatar className="h-9 w-9 rounded-md">
                <AvatarFallback className="rounded-md bg-accent text-accent-foreground">
                  {getInitials(currentUser.displayName, currentUser.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

function getInitials(displayName: string, email: string) {
  const source = displayName.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
