export function ListingsFilterSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-4">
        <div className="h-6 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </div>
        <div className="h-9 w-full animate-pulse rounded-lg bg-surface-muted" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-9 flex-1 animate-pulse rounded-lg bg-surface-muted" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-5 w-full animate-pulse rounded bg-surface-muted" />
        ))}
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="bg-primary rounded-xl p-4 flex flex-col gap-2 items-center justify-center">
        <div className="size-8 animate-pulse rounded bg-primary-foreground/20" />
        <div className="h-5 w-32 animate-pulse rounded bg-primary-foreground/20" />
        <div className="h-4 w-48 animate-pulse rounded bg-primary-foreground/20" />
        <div className="h-8 w-full mt-2 animate-pulse rounded-lg bg-primary-foreground/20" />
      </div>
    </div>
  );
}

export function ListingsToolbarSkeleton() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="h-9 w-[180px] animate-pulse rounded-lg bg-surface-muted" />
    </div>
  );
}

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col bg-surface rounded-xl border border-border overflow-hidden">
          <div className="h-52 animate-pulse bg-surface-muted" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingsContentSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0 pt-0 lg:pt-8">
      <ListingsToolbarSkeleton />
      <ListingsGridSkeleton />
    </div>
  );
}
