export default function PropertyDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">
      <div className="sticky top-14 lg:top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-slate-100 animate-pulse" />
              <div className="px-5 py-5 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm h-24 animate-pulse" />
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm h-48 animate-pulse" />
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm h-48 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}