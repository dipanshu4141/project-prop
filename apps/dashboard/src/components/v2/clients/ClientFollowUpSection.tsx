'use client';

import { useState, useTransition } from 'react';
import { Calendar, Loader2, X } from 'lucide-react';
import { apiPost } from '@/lib/api';

export function ClientFollowUpSection({
  clientId,
  initialFollowUp,
}: {
  clientId: string;
  initialFollowUp: string | null;
}) {
  const [date, setDate] = useState(
    initialFollowUp ? new Date(initialFollowUp).toISOString().slice(0, 10) : ''
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function save() {
    if (!date) return;
    startTransition(async () => {
      await apiPost(`/clients/${clientId}/follow-up`, { followUpAt: date });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function clear() {
    setDate('');
    startTransition(async () => {
      await apiPost(`/clients/${clientId}/follow-up`, { followUpAt: null });
    });
  }

  return (
    <div className="border-t border-slate-100 pt-3 mt-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Follow-up date
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => { setDate(e.target.value); setSaved(false); }}
            className="w-full h-8 pl-7 pr-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
        <button
          onClick={save}
          disabled={isPending || !date}
          className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-medium disabled:opacity-40 transition-colors hover:bg-emerald-700"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? '✓' : 'Set'}
        </button>
        {date && (
          <button
            onClick={clear}
            disabled={isPending}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}