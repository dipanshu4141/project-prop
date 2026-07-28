// apps/dashboard/src/components/v2/property/PropertySectionTabs.tsx
'use client';

import { useState } from 'react';
import { FileText, Image } from 'lucide-react';

interface Props {
  detailsContent: React.ReactNode;
  mediaContent:   React.ReactNode;
  mediaCount:     number;
}

export function PropertySectionTabs({ detailsContent, mediaContent, mediaCount }: Props) {
  const [tab, setTab] = useState<'details' | 'media'>('details');

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {[
          { key: 'details', label: 'Details', icon: FileText,  count: null       },
          { key: 'media',   label: 'Media',   icon: Image,     count: mediaCount },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${tab === t.key ? 'bg-[#0B1F14] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'details' && detailsContent}
      {tab === 'media'   && mediaContent}
    </div>
  );
}