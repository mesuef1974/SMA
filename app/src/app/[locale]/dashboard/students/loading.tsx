export default function StudentsLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-10 w-36 rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
