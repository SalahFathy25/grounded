function ShimmerBar({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-line/60 ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-paper/70 to-transparent" />
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-line/50">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-paper/70 to-transparent" />
      </div>
      <div className="space-y-3 p-4">
        <ShimmerBar className="h-4 w-3/4" />
        <ShimmerBar className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <ShimmerBar className="h-6 w-20" />
          <ShimmerBar className="size-9 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  )
}