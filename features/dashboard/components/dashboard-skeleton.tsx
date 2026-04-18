import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto grid max-w-7xl gap-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </main>
  );
}
