'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export function MessageModal({ message, groupName }: { message: string; groupName?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Clickable preview — no button */}
      <div
        onClick={() => setOpen(true)}
        className="mt-3 pt-3 border-t border-slate-100 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            WhatsApp message
          </p>
          {groupName && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {groupName}
            </span>
          )}
        </div>
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-colors">
          <p className="text-[12px] text-slate-500 line-clamp-3 whitespace-pre-wrap">
            {message}
          </p>
          <p className="text-[10.5px] text-emerald-600 mt-1.5 font-medium">Tap to read full message</p>
        </div>
      </div>

      {/* Popup modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* WhatsApp-style background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#0B141A',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div
            className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1F2C34' }}>
              <div>
                <p className="text-[13px] font-semibold text-white">WhatsApp message</p>
                {groupName && <p className="text-[11px] text-white/50 mt-0.5">{groupName}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message bubble */}
            <div
              className="px-4 py-5 max-h-[70vh] overflow-y-auto"
              style={{ backgroundColor: '#0B141A' }}
            >
              <div className="max-w-[85%] ml-auto">
                <div
                  className="rounded-tl-2xl rounded-bl-2xl rounded-br-2xl px-3 py-2.5"
                  style={{ backgroundColor: '#005C4B' }}
                >
                  <p className="text-[13.5px] text-white whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1.5">
                    <p className="text-[10px] text-white/50">
                      {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {/* Double tick */}
                    <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
                      <path d="M11.071.653a.5.5 0 0 0-.707.022L5.847 5.408 4.854 4.34a.5.5 0 0 0-.708.708l1.5 1.5a.5.5 0 0 0 .72-.014l5-5.5a.5.5 0 0 0-.295-.381z" fill="#53BDEB"/>
                      <path d="M15.071.653a.5.5 0 0 0-.707.022L9.847 5.408l-.5-.56a.5.5 0 0 0-.744.668l.854.96a.5.5 0 0 0 .72-.014l5-5.5a.5.5 0 0 0-.106-.309z" fill="#53BDEB"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}