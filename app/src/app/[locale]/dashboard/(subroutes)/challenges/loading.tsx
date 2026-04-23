export default function ChallengesLoading() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-10 w-40 rounded-xl bg-muted" />
        <div className="h-9 w-36 rounded-xl bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    </div>
  );
}
