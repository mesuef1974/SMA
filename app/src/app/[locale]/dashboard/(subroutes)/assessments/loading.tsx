export default function AssessmentsLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-10 w-44 rounded-xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
