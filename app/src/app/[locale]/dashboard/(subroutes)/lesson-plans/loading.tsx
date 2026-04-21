export default function LessonPlansLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-10 w-44 rounded-xl bg-muted" />
        <div className="h-9 w-36 rounded-xl bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
