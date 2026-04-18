export default function LeaderboardLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-10 w-44 rounded-xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
