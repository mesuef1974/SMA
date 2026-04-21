export default function ReportsLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-10 w-36 rounded-xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
