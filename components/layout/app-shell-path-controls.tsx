"use client";

import { BarChart3, CalendarDays, Home, Link2, PenSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Compose", href: "/compose", icon: PenSquare },
  { label: "Schedule", href: "/dashboard", icon: CalendarDays },
  { label: "Connections", href: "/connections", icon: Link2 },
  { label: "Analytics", href: "/dashboard", icon: BarChart3 },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Creator Home",
  "/compose": "Compose",
  "/connections": "Connections",
};

export function AppShellNavigation() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {navItems.map(item => {
        const isActive = pathname === item.href && item.label !== "Schedule" && item.label !== "Analytics";

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShellPageTitle() {
  const pathname = usePathname();

  return <>{pageTitles[pathname] ?? "Creator Home"}</>;
}
