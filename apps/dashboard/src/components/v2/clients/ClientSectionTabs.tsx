// apps/dashboard/src/components/v2/clients/ClientSectionTabs.tsx
'use client';

import { useState } from 'react';
import { Building2, StickyNote, Activity } from 'lucide-react';

interface Props {
  propertiesContent: React.ReactNode;
  notesContent:      React.ReactNode;
  activityContent:   React.ReactNode;
  propertiesCount:   number;
  notesCount:        number;
  activityCount:     number;
}

export function ClientSectionTabs({
  propertiesContent, notesContent, activityContent,
  propertiesCount, notesCount, activityCount,
}: Props) {
  const [tab, setTab] = useState<'properties' | 'notes' | 'activity'>('properties');

  const tabs = [
    { key: 'properties', label: 'Properties', count: propertiesCount, icon: Building2 },
    { key: 'notes',      label: 'Notes',      count: notesCount,      icon: StickyNote },
    { key: 'activity',   label: 'Activity',   count: activityCount,   icon: Activity   },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold transition-colors ${tab === t.key ? 'bg-[#0B1F14] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <t.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'properties' && propertiesContent}
      {tab === 'notes'      && notesContent}
      {tab === 'activity'   && activityContent}
    </div>
  );
}