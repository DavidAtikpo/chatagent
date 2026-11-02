/** Skeleton affiché pendant le chargement d’une route dashboard. */
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy aria-label="Loading">
      <div className="h-8 w-48 max-w-full rounded bg-slate-200" />
      <div className="h-4 w-full max-w-md rounded bg-slate-100" />
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-md bg-slate-100" />
        ))}
      </div>
      <div className="h-40 rounded-lg border border-slate-100 bg-slate-50" />
      <div className="h-32 rounded-lg border border-slate-100 bg-slate-50" />
    </div>
  );
}
