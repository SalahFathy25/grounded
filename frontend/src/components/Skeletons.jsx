export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square animate-pulse bg-line/60" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-line/60" />
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 animate-pulse rounded bg-line/70" />
          <div className="size-9 animate-pulse rounded-lg bg-line/70" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  )
}