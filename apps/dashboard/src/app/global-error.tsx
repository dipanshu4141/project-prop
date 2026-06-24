'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-[18px] font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-[13px] text-slate-500 mb-6">
              We hit an unexpected error. Please try again, or contact support if this keeps happening.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-[#0B1F14] px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#1A3525] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
