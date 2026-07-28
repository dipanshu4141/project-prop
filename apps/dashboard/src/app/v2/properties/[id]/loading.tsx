export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-0 lg:pt-0">

      {/* Nav skeleton */}
      <div className="fixed top-14 lg:top-0 left-0 right-0 z-20 flex items-center gap-2 border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 lg:static lg:border-0 lg:bg-transparent lg:px-6 lg:pt-6 lg:pb-4">
        <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse hidden lg:block" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse" />
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-16 lg:pt-0 pb-24 lg:pb-8 space-y-3">

        {/* Summary card skeleton */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-4 space-y-4">
          <div className="h-1 w-full rounded-full bg-slate-100 animate-pulse" />
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
              <div className="h-7 w-28 rounded bg-slate-100 animate-pulse" />
              <div className="h-3.5 w-36 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-10 w-16 rounded-xl bg-slate-100 animate-pulse" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-7 w-24 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="h-2.5 w-28 rounded bg-slate-100 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Tab bar skeleton */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 h-9 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}