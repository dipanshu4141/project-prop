'use client';

// apps/dashboard/src/components/v2/clients/ClientAssignDropdown.tsx
// Drop this anywhere on the client detail page.
// Only renders for OWNER role — brokers see nothing.

import { useState, useEffect, useRef } from 'react';
import { UserCheck, ChevronDown, Loader2, Users } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Member = {
  memberId: string;
  role:     string;
  user: { id: string; name: string | null; email: string };
};

type ClientAssignDropdownProps = {
  clientId:       string;
  currentOwnerId: string | null;   // null = in pool
  currentOwnerName?: string | null;
  onReassigned?:  (newOwnerId: string | null, newOwnerName: string | null) => void;
};

export function ClientAssignDropdown({
  clientId,
  currentOwnerId,
  currentOwnerName,
  onReassigned,
}: ClientAssignDropdownProps) {
  const { workspace } = useAuth();
  const isOwner = workspace?.role === 'OWNER';

  const [members,  setMembers]  = useState<Member[]>([]);
  const [open,     setOpen]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Only fetch members when owner opens the dropdown
  useEffect(() => {
    if (!isOwner) return;
    apiGet<Member[]>('/team/members')
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [isOwner]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (!isOwner) return null;

  async function handleSelect(toUserId: string | null) {
    setSaving(true);
    setError('');
    setOpen(false);
    try {
      await apiPatch(`/clients/${clientId}/reassign`, { toUserId });
      const newName = toUserId
        ? members.find((m) => m.user.id === toUserId)?.user.name ?? null
        : null;
      onReassigned?.(toUserId, newName);
    } catch (err: any) {
      setError(err.message ?? 'Failed to reassign');
    } finally {
      setSaving(false);
    }
  }

  const displayName = currentOwnerId
    ? (currentOwnerName ?? members.find((m) => m.user.id === currentOwnerId)?.user.name ?? 'Assigned')
    : 'Lead Pool';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12.5px] font-medium text-slate-700 hover:border-slate-400 transition-colors"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : currentOwnerId ? (
          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Users className="h-3.5 w-3.5 text-violet-500" />
        )}
        {displayName}
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {error && (
        <p className="absolute top-full left-0 mt-1 text-[11px] text-red-500 whitespace-nowrap">{error}</p>
      )}

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden min-w-[200px]"
          style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.07)' }}
        >
          <div className="p-1">
            {/* Return to pool */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-violet-50 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-100 flex-shrink-0">
                <Users className="h-3 w-3 text-violet-600" />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-violet-700">Lead Pool</p>
                <p className="text-[10.5px] text-slate-400">Unassign — visible to all realtors</p>
              </div>
              {!currentOwnerId && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto">
                  <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {members.length > 0 && (
              <div className="my-1 border-t border-slate-100" />
            )}

            {/* realtor list */}
            {members.map((m) => {
              const isSelected = m.user.id === currentOwnerId;
              const initials   = (m.user.name ?? m.user.email)
                .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

              return (
                <button
                  key={m.memberId}
                  onClick={() => handleSelect(m.user.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-sky-100 text-[9px] font-bold text-sky-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">
                      {m.user.name ?? m.user.email}
                    </p>
                    <p className="text-[10.5px] text-slate-400">{m.role}</p>
                  </div>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                      <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}