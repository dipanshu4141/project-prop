'use client';

import { useState } from 'react';
import { Download, X, Share, SquarePlus } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function InstallAppButton({ collapsed, variant = 'dark' }: { collapsed?: boolean; variant?: 'dark' | 'light' }) {
  const { platform, canInstall, promptInstall, hasNativePrompt } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (!canInstall) return null;

  async function handleClick() {
    if (platform === 'android' && hasNativePrompt) {
      await promptInstall();
    } else if (platform === 'ios') {
      setShowIosModal(true);
    } else {
      // Desktop with native prompt support (Chrome/Edge)
      if (hasNativePrompt) await promptInstall();
      else setShowIosModal(true); // fallback instructions for unsupported desktop browsers
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Install app"
        className={[
          "flex items-center rounded-xl text-[13px] font-semibold transition-colors",
          collapsed ? "justify-center px-0 py-2.5 w-full" : "gap-3 px-3 py-2.5 w-full",
          variant === 'dark'
            ? "text-white/50 hover:text-white hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-50",
        ].join(" ")}
      >
        <Download className={["h-4 w-4 flex-shrink-0", variant === 'dark' ? "text-white/40" : "text-slate-400"].join(" ")} />
        {!collapsed && <span>Install app</span>}
      </button>

      {showIosModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowIosModal(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#1C1917]">Install GrowCliento</h2>
              <button onClick={() => setShowIosModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[13px] text-slate-500 mb-5">
              Add GrowCliento to your home screen for quick access, just like a native app.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFBE37] text-[12px] font-bold text-[#1C1917]">1</div>
                <div className="flex items-center gap-2 text-[13px] text-slate-700 pt-0.5">
                  Tap the <Share className="h-4 w-4 inline text-blue-500" /> Share icon in Safari's toolbar
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFBE37] text-[12px] font-bold text-[#1C1917]">2</div>
                <div className="flex items-center gap-2 text-[13px] text-slate-700 pt-0.5">
                  Scroll down and tap <SquarePlus className="h-4 w-4 inline text-slate-600" /> <strong>Add to Home Screen</strong>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFBE37] text-[12px] font-bold text-[#1C1917]">3</div>
                <p className="text-[13px] text-slate-700 pt-0.5">Tap <strong>Add</strong> in the top right corner</p>
              </div>
            </div>

            <p className="mt-5 text-[11px] text-slate-400">
              Note: This only works in Safari. If you're using Chrome or another browser on iOS, open this page in Safari first.
            </p>
          </div>
        </div>
      )}
    </>
  );
}