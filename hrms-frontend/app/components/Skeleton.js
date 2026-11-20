// Grey pulsing placeholders shown while data is loading.

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

// 4 columns with 2 fake cards each (Recruitment board)
export function KanbanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((col) => (
        <div
          key={col}
          className="rounded-2xl border border-white/10 bg-white/5 p-3"
        >
          <Skeleton className="mb-4 h-5 w-28" />
          {[0, 1].map((i) => (
            <div
              key={i}
              className="mb-3 rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// list on the left + big preview on the right (Documents page)
export function DocumentsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <Skeleton className="mb-4 h-10 w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-3 space-y-2 border-t border-white/10 pt-3">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    </div>
  );
}

// table rows (Dashboard)
export function TableRowsSkeleton({ rows = 3, cols = 3 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="border-t border-white/10">
      <td colSpan={cols} className="px-5 py-4">
        <Skeleton className="h-8 w-full" />
      </td>
    </tr>
  ));
}
