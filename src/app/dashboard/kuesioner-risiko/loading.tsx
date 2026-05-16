export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 border-b bg-card/80 backdrop-blur-sm" />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-72 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-96 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        {/* Info banner skeleton */}
        <div className="h-20 rounded-xl border bg-muted/20 animate-pulse" />
        {/* Scale reference skeleton */}
        <div className="rounded-xl border bg-card p-4">
          <div className="h-4 w-56 rounded bg-muted animate-pulse mb-3" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        {/* CP Tab skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-10 w-16 rounded-xl bg-muted animate-pulse shrink-0" />
          ))}
        </div>
        {/* Form skeleton */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
              <div className="h-4 w-36 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-10 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse border border-border/30" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
