export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b bg-card/80 backdrop-blur-sm" />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        {/* Search skeleton */}
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        {/* Table skeleton */}
        <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
          <div className="space-y-0">
            <div className="h-12 bg-muted/40 border-b" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/30">
                <div className="w-8 h-4 rounded bg-muted animate-pulse" />
                <div className="w-16 h-6 rounded-lg bg-muted animate-pulse" />
                <div className="w-12 h-4 rounded bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                </div>
                <div className="w-20 h-4 rounded bg-muted animate-pulse" />
                <div className="w-16 h-6 rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
