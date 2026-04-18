export default function LessonsLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-muted" />
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
