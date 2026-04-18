export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Greeting skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-7 w-40 rounded-full bg-muted" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-muted" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded-full bg-muted" />
              <div className="size-8 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-16 rounded-full bg-muted" />
            <div className="h-2.5 w-24 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <div className="h-3 w-28 rounded-full bg-muted mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-border/50 bg-card" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-full bg-muted mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border/50 bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
