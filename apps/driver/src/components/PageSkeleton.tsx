import { Card } from "@online-store/ui/card";

/** Simple loading placeholder shared by the dashboard route segments. */
export default function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-7 w-12 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
      <Card className="h-52 animate-pulse bg-muted/40" />
      <Card className="h-40 animate-pulse bg-muted/30" />
    </div>
  );
}
