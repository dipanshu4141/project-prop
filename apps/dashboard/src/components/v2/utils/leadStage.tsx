const STAGE_STYLES: Record<string, { label: string; class: string }> = {
  NEW:         { label: 'New',         class: 'bg-slate-100 text-slate-600 border-slate-200'       },
  CONTACTED:   { label: 'Contacted',   class: 'bg-sky-50 text-sky-700 border-sky-200'              },
  VISIT:       { label: 'Visit',       class: 'bg-violet-50 text-violet-700 border-violet-200'     },
  NEGOTIATION: { label: 'Negotiation', class: 'bg-amber-50 text-amber-700 border-amber-200'        },
  CLOSED:      { label: 'Closed',      class: 'bg-emerald-50 text-emerald-700 border-emerald-200'  },
  LOST:        { label: 'Lost',        class: 'bg-red-50 text-red-600 border-red-200'              },
  INTERESTED:  { label: 'Interested',  class: 'bg-emerald-50 text-emerald-700 border-emerald-200'  },
  NOT_INTERESTED: { label: 'Not interested', class: 'bg-red-50 text-red-600 border-red-200'       },
  OPEN:        { label: 'Open',        class: 'bg-sky-50 text-sky-700 border-sky-200'              },
};

export function LeadStageBadge({ stage }: { stage: string }) {
  const s = STAGE_STYLES[stage] ?? { label: stage, class: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${s.class}`}>
      {s.label}
    </span>
  );
}