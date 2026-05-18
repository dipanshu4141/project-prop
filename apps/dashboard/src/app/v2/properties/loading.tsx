export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">
      <div className="sticky top-14 lg:top-0 z-20 h-12 bg-white border-b border-slate-100 animate-pulse" />
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <div className="h-[3px] w-full bg-slate-100 animate-pulse" />
              <div className="px-2.5 pt-2 pb-3 space-y-2">
                <div className="h-2 w-16 rounded bg-slate-100 animate-pulse" />
                <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
                <div className="h-2 w-16 rounded bg-slate-100 animate-pulse" />
                <div className="h-2 w-12 rounded bg-slate-100 animate-pulse" />
                <div className="mt-3 h-7 w-full rounded-lg bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}