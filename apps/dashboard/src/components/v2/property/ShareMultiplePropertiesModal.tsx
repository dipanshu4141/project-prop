// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { X, Share2, Check, MessageSquare } from "lucide-react";
// import { buildWhatsAppMessageForMultiple } from "@/utils/buildWhatsAppMessage";
// import { apiGet, apiPost } from "@/lib/api";
// import { useAuth } from "@/context/AuthContext";

// type Property = {
//   id: string;
//   [key: string]: any;
// };

// type TeamMember = {
//   id:      string;
//   name:    string;
//   phone:   string;
//   isSelf?: boolean;
// };

// function memberInitials(name: string) {
//   return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
// }

// export function ShareMultiplePropertiesModal({
//   propertiesMap,
//   onClose,
// }: {
//   propertiesMap: Record<string, Property | null>;
//   onClose: () => void;
// }) {
//   const { user } = useAuth();

//   const [clientName,  setClientName]  = useState("");
//   const [clientPhone, setClientPhone] = useState("");

//   const [team,            setTeam]            = useState<TeamMember[]>([]);
//   const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
//   const [teamLoaded,      setTeamLoaded]      = useState(false);

//   const [resolvedProperties, setResolvedProperties] = useState<Property[]>([]);
//   const [resolving, setResolving] = useState(true);
//   const [loading,   setLoading]   = useState(false);

//   const propertyIds = useMemo(() => Object.keys(propertiesMap), [propertiesMap]);

//   /* ── Self entry from auth ── */
//   const selfEntry = useMemo<TeamMember | null>(() => {
//     if (!user) return null;
//     return { id: user.id, name: user.name ?? user.email ?? "You", phone: "", isSelf: true };
//   }, [user]);

//   /* ── Load team, prepend self ── */
//   useEffect(() => {
//     let cancelled = false;
//     async function loadTeam() {
//       if (selfEntry && !cancelled) {
//         setTeam([selfEntry]);
//         setSelectedTeamIds([selfEntry.id]);
//       }
//       try {
//         const data = await apiGet<any>("/team/members");
//         const list: any[] = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
//         if (!cancelled) {
//           const others: TeamMember[] = list
//             .filter((m) => m.user?.id !== selfEntry?.id)
//             .map((m) => ({
//               id:    m.memberId ?? m.id,
//               name:  m.user?.name ?? m.user?.email ?? "Unknown",
//               phone: m.user?.phone ?? "",
//             }));
//           setTeam(selfEntry ? [selfEntry, ...others] : others);
//           setTeamLoaded(true);
//         }
//       } catch {
//         if (!cancelled) setTeamLoaded(true);
//       }
//     }
//     loadTeam();
//     return () => { cancelled = true; };
//   }, [selfEntry]);

//   /* ── Resolve properties ── */
//   useEffect(() => {
//     let cancelled = false;
//     async function resolveAll() {
//       setResolving(true);
//       const known      = Object.values(propertiesMap).filter((p): p is Property => Boolean(p));
//       const missingIds = propertyIds.filter((id) => !propertiesMap[id]);
//       const fetched: Property[] = [];
//       for (const id of missingIds) {
//         const data = await apiGet<Property>(`/properties/${id}`).catch(() => null);
//         if (data) fetched.push(data);
//       }
//       if (!cancelled) { setResolvedProperties([...known, ...fetched]); setResolving(false); }
//     }
//     resolveAll();
//     return () => { cancelled = true; };
//   }, [propertiesMap, propertyIds]);

//   function toggleTeam(id: string) {
//     setSelectedTeamIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   }

//   const selectedTeam = useMemo(
//     () => team.filter((t) => selectedTeamIds.includes(t.id)),
//     [team, selectedTeamIds]
//   );

//   const previewMessage = useMemo(() => {
//     if (resolving) return "Preparing message…";
//     if (resolvedProperties.length === 0) return "No properties selected.";
//     const senders = selectedTeam.length > 0 ? selectedTeam : (selfEntry ? [selfEntry] : []);
//     return buildWhatsAppMessageForMultiple(resolvedProperties, senders, clientName);
//   }, [resolvedProperties, selectedTeam, selfEntry, clientName, resolving]);

//   async function share() {
//     if (!clientPhone || resolvedProperties.length === 0) return;
//     const phone = clientPhone.replace(/\D/g, "");
//     if (!phone) return;

//     const senders = selectedTeam.length > 0 ? selectedTeam : (selfEntry ? [selfEntry] : []);
//     const message = buildWhatsAppMessageForMultiple(resolvedProperties, senders, clientName);
//     const params  = new URLSearchParams();
//     params.set("phone", `91${phone}`);
//     params.set("text",  message);

//     setLoading(true);
//     try {
//       await Promise.all(
//         resolvedProperties.map((p) =>
//           apiPost(`/properties/${p.id}/share`, {
//             clientName,
//             clientPhone: phone,
//             teamMemberIds: selectedTeamIds,
//             platform: "WHATSAPP",
//           })
//         )
//       );
//       window.open(`https://api.whatsapp.com/send/?${params.toString()}`, "_blank", "noopener,noreferrer");
//     } catch (err) {
//       console.error("Failed to attach leads:", err);
//     } finally {
//       setLoading(false);
//       onClose();
//     }
//   }

//   const canShare = !loading && !resolving && !!clientPhone;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
//           <div className="flex items-center gap-3">
//             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
//               <Share2 className="h-4 w-4 text-emerald-600" />
//             </div>
//             <div>
//               <p className="text-[14px] font-semibold text-slate-900">
//                 Share {propertyIds.length} {propertyIds.length === 1 ? "property" : "properties"}
//               </p>
//               <p className="text-[11.5px] text-slate-400">via WhatsApp</p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

//           {/* Client info */}
//           <div className="space-y-3">
//             <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Client details</p>
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <label className="text-[11.5px] font-medium text-slate-500">Name</label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Ravi Sharma"
//                   value={clientName}
//                   onChange={(e) => setClientName(e.target.value)}
//                   className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
//                 />
//               </div>
//               <div className="space-y-1.5">
//                 <label className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500">
//                   Phone <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="tel"
//                   placeholder="+91 98200 00000"
//                   value={clientPhone}
//                   onChange={(e) => setClientPhone(e.target.value)}
//                   className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Sender selection */}
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Send from</p>
//               <span className="text-[11px] text-slate-400">
//                 {selectedTeamIds.length === 0 ? "Defaulting to you" : `${selectedTeamIds.length} selected`}
//               </span>
//             </div>

//             <div className="max-h-[180px] overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
//               {team.map((m) => {
//                 const active = selectedTeamIds.includes(m.id);
//                 return (
//                   <button
//                     key={m.id}
//                     onClick={() => toggleTeam(m.id)}
//                     className={["w-full flex items-center gap-3 px-4 py-3 text-left transition-colors", active ? "bg-emerald-50" : "bg-white hover:bg-slate-50"].join(" ")}
//                   >
//                     <div className={[
//                       "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
//                       m.isSelf
//                         ? active ? "bg-[#0B1F14] text-white" : "bg-slate-200 text-slate-600"
//                         : active ? "bg-emerald-500 text-white" : "bg-sky-100 text-sky-700",
//                     ].join(" ")}>
//                       {memberInitials(m.name)}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-1.5">
//                         <p className={["text-[13px] font-medium truncate", active ? "text-emerald-900" : "text-slate-700"].join(" ")}>
//                           {m.name}
//                         </p>
//                         {m.isSelf && (
//                           <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">you</span>
//                         )}
//                       </div>
//                       {m.phone && <p className="text-[11px] text-slate-400 truncate">{m.phone}</p>}
//                     </div>
//                     <div className={[
//                       "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
//                       active ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white",
//                     ].join(" ")}>
//                       {active && <Check className="h-2.5 w-2.5" />}
//                     </div>
//                   </button>
//                 );
//               })}
//               {!teamLoaded && team.length <= 1 && (
//                 <div className="px-4 py-2.5 text-[11.5px] text-slate-400 flex items-center gap-2">
//                   <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-500" />
//                   Loading team members…
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Message preview */}
//           <div className="space-y-2">
//             <div className="flex items-center gap-2">
//               <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
//               <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">Message preview</p>
//             </div>
//             <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600 whitespace-pre-wrap leading-relaxed font-mono max-h-[180px] overflow-y-auto">
//               {previewMessage}
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex-shrink-0">
//           <button
//             onClick={onClose}
//             className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={share}
//             disabled={!canShare}
//             className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1fb855] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
//           >
//             {loading ? (
//               <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Sharing…</>
//             ) : (
//               <><Share2 className="h-3.5 w-3.5" />Share on WhatsApp</>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



'use client';

// apps/dashboard/src/components/v2/property/ShareMultiplePropertiesModal.tsx

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X, Share2, Check, MessageSquare, Link2, Loader2 } from 'lucide-react';
import {
  buildWhatsAppMessageForMultiple,
  type MessageProperty,
  type MessageSender,
} from '@/utils/buildWhatsAppMessage';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Property = { id: string; [key: string]: any };

type TeamMember = {
  id:      string;
  name:    string;
  phone:   string;
  isSelf?: boolean;
};

type ShareTokenResponse = {
  url:       string;
  expiresAt: string;
  clientId:  string;
  isNew:     boolean;
};

// ── Static class maps (no dynamic Tailwind) ───────────────────────────────────

const INPUT_BASE =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors';

const INPUT_WITH_ICON =
  'h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors';

const TEAM_BTN_ACTIVE  = 'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors bg-emerald-50';
const TEAM_BTN_IDLE    = 'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors bg-white hover:bg-slate-50';
const AVATAR_SELF_ON   = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors bg-[#0B1F14] text-white';
const AVATAR_SELF_OFF  = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors bg-slate-200 text-slate-600';
const AVATAR_OTHER_ON  = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors bg-emerald-500 text-white';
const AVATAR_OTHER_OFF = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors bg-sky-100 text-sky-700';
const CHECK_ON  = 'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all border-emerald-500 bg-emerald-500 text-white';
const CHECK_OFF = 'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all border-slate-200 bg-white';
const NAME_ON   = 'text-[13px] font-medium truncate text-emerald-900';
const NAME_OFF  = 'text-[13px] font-medium truncate text-slate-700';

// ── Helpers ───────────────────────────────────────────────────────────────────

function memberInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareMultiplePropertiesModal({
  propertiesMap,
  onClose,
}: {
  propertiesMap: Record<string, Property | null>;
  onClose: () => void;
}) {
  const { user } = useAuth();

  // ── Client details ──
  const [clientName,  setClientName]  = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // ── Auto-generated share link ──
  const [shareUrl,      setShareUrl]      = useState<string | null>(null);
  const [linkLoading,   setLinkLoading]   = useState(false);
  const [linkClientId,  setLinkClientId]  = useState<string | null>(null);

  // ── Team ──
  const [team,            setTeam]            = useState<TeamMember[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamLoaded,      setTeamLoaded]      = useState(false);

  // ── Properties ──
  const [resolvedProperties, setResolvedProperties] = useState<Property[]>([]);
  const [resolving, setResolving] = useState(true);

  // ── Share state ──
  const [loading, setLoading] = useState(false);

  const propertyIds     = useMemo(() => Object.keys(propertiesMap), [propertiesMap]);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Self entry ──
  const selfEntry = useMemo<TeamMember | null>(() => {
    if (!user) return null;
    return { id: user.id, name: user.name ?? user.email ?? 'You', phone: '', isSelf: true };
  }, [user]);

  // ── Load team ──
  useEffect(() => {
    let cancelled = false;
    async function loadTeam() {
      if (selfEntry && !cancelled) {
        setTeam([selfEntry]);
        setSelectedTeamIds([selfEntry.id]);
      }
      try {
        const data = await apiGet<{ items?: unknown[]; data?: unknown[] } | unknown[]>('/team/members');
        const list: unknown[] =
          (data as { items?: unknown[] }).items ??
          (data as { data?: unknown[] }).data ??
          (Array.isArray(data) ? data : []);
        if (!cancelled) {
          const others: TeamMember[] = (
            list as { user?: { id?: string; name?: string; email?: string; phone?: string }; memberId?: string; id?: string }[]
          )
            .filter((m) => m.user?.id !== selfEntry?.id)
            .map((m) => ({
              id:    m.memberId ?? m.id ?? '',
              name:  m.user?.name ?? m.user?.email ?? 'Unknown',
              phone: m.user?.phone ?? '',
            }));
          setTeam(selfEntry ? [selfEntry, ...others] : others);
          setTeamLoaded(true);
        }
      } catch {
        if (!cancelled) setTeamLoaded(true);
      }
    }
    loadTeam();
    return () => { cancelled = true; };
  }, [selfEntry]);

  // ── Resolve properties ──
  useEffect(() => {
    let cancelled = false;
    async function resolveAll() {
      setResolving(true);
      const known      = Object.values(propertiesMap).filter((p): p is Property => Boolean(p));
      const missingIds = propertyIds.filter((id) => !propertiesMap[id]);
      const fetched: Property[] = [];
      for (const id of missingIds) {
        const data = await apiGet<Property>(`/properties/${id}`).catch(() => null);
        if (data) fetched.push(data);
      }
      if (!cancelled) {
        setResolvedProperties([...known, ...fetched]);
        setResolving(false);
      }
    }
    resolveAll();
    return () => { cancelled = true; };
  }, [propertiesMap, propertyIds]);

  // ── Auto-generate share link when phone is valid (debounced 600ms) ──
  const generateLinkForPhone = useCallback(
    (phone: string, name: string) => {
      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

      if (!isValidPhone(phone)) {
        setShareUrl(null);
        setLinkClientId(null);
        return;
      }

      phoneDebounceRef.current = setTimeout(async () => {
        setLinkLoading(true);
        try {
          const data = await apiPost<ShareTokenResponse>(
            '/clients/share-token-by-phone',
            { phone: phone.replace(/\D/g, ''), name: name.trim() || undefined },
          );
          setShareUrl(data.url);
          setLinkClientId(data.clientId);
        } catch (err) {
          console.warn('Could not generate share link:', err);
          setShareUrl(null);
          setLinkClientId(null);
        } finally {
          setLinkLoading(false);
        }
      }, 600);
    },
    [],
  );

  // Trigger link generation when phone changes
  useEffect(() => {
    generateLinkForPhone(clientPhone, clientName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientPhone, clientName]);

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const selectedTeam = useMemo(
    () => team.filter((t) => selectedTeamIds.includes(t.id)),
    [team, selectedTeamIds],
  );

  // ── Message preview ──
  const previewMessage = useMemo(() => {
    if (resolving) return 'Preparing message…';
    if (resolvedProperties.length === 0) return 'No properties selected.';
    const senders: MessageSender[] =
      selectedTeam.length > 0 ? selectedTeam : selfEntry ? [selfEntry] : [];
    // Show placeholder while link is loading, real URL when ready
    const linkForPreview = linkLoading
      ? '[generating link…]'
      : shareUrl ?? undefined;
    return buildWhatsAppMessageForMultiple(
      resolvedProperties as MessageProperty[],
      senders,
      clientName,
      isValidPhone(clientPhone) ? linkForPreview : undefined,
    );
  }, [
    resolvedProperties, selectedTeam, selfEntry,
    clientName, clientPhone, shareUrl, linkLoading, resolving,
  ]);

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// ── Share handler ──
async function share() {
  if (!clientPhone || resolvedProperties.length === 0) return;
  const phone = clientPhone.replace(/\D/g, '');
  if (!phone) return;

  setLoading(true);

  const onIOS = isIOS();

  // Only iOS needs the blank-window trick to preserve user-gesture trust
  const waWindow = onIOS ? window.open('', '_blank') : null;

  try {
    let finalUrl = shareUrl;
    if (!finalUrl && isValidPhone(clientPhone)) {
      try {
        const data = await apiPost<ShareTokenResponse>(
          '/clients/share-token-by-phone',
          { phone, name: clientName.trim() || undefined },
        );
        finalUrl = data.url;
        setShareUrl(data.url);
        setLinkClientId(data.clientId);
      } catch {
        // non-fatal
      }
    }

    const senders: MessageSender[] =
      selectedTeam.length > 0 ? selectedTeam : selfEntry ? [selfEntry] : [];
    const message = buildWhatsAppMessageForMultiple(
      resolvedProperties as MessageProperty[],
      senders,
      clientName,
      finalUrl,
    );

    await Promise.all(
      resolvedProperties.map((p) =>
        apiPost(`/properties/${p.id}/share`, {
          clientName,
          clientPhone: phone,
          clientId: linkClientId,
          teamMemberIds: selectedTeamIds,
          platform: 'WHATSAPP',
        }).catch(() => null),
      ),
    );

    const params = new URLSearchParams();
    params.set('phone', `91${phone}`);
    params.set('text', message);
    const url = `https://api.whatsapp.com/send/?${params.toString()}`;

    if (onIOS) {
      // iOS: redirect the pre-opened blank tab
      if (waWindow) {
        waWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } else {
      // Android/desktop: direct navigation triggers the WhatsApp app intent properly
      window.location.href = url;
    }
  } catch (err) {
    console.error('Share failed:', err);
    waWindow?.close();
  } finally {
    setLoading(false);
    onClose();
  }
}

  const canShare = !loading && !resolving && isValidPhone(clientPhone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Share2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">
                Share {propertyIds.length}{' '}
                {propertyIds.length === 1 ? 'property' : 'properties'}
              </p>
              <p className="text-[11.5px] text-slate-400">via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Client details ── */}
          <div className="space-y-3">
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
              Client details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium text-slate-500">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ravi Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={INPUT_BASE}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11.5px] font-medium text-slate-500">
                  Phone <span className="text-red-400">*</span>
                </label>
                {/* Phone input with inline link-status icon */}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98200 00000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={INPUT_WITH_ICON}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {linkLoading && isValidPhone(clientPhone) && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    )}
                    {!linkLoading && shareUrl && (
                      <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>

                {/* Link status pill below phone */}
                <div className="h-4">
                  {linkLoading && isValidPhone(clientPhone) && (
                    <p className="text-[11px] text-slate-400">Generating portal link…</p>
                  )}
                  {!linkLoading && shareUrl && (
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                      <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
                      Portal link ready — included in message
                    </p>
                  )}
                  {!linkLoading && !shareUrl && isValidPhone(clientPhone) && (
                    <p className="text-[11px] text-slate-400">Could not generate link</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sender selection ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Send from
              </p>
              <span className="text-[11px] text-slate-400">
                {selectedTeamIds.length === 0
                  ? 'Defaulting to you'
                  : `${selectedTeamIds.length} selected`}
              </span>
            </div>

            <div className="max-h-[180px] overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
              {team.map((m) => {
                const active = selectedTeamIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleTeam(m.id)}
                    className={active ? TEAM_BTN_ACTIVE : TEAM_BTN_IDLE}
                  >
                    <div className={
                      m.isSelf
                        ? active ? AVATAR_SELF_ON  : AVATAR_SELF_OFF
                        : active ? AVATAR_OTHER_ON : AVATAR_OTHER_OFF
                    }>
                      {memberInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={active ? NAME_ON : NAME_OFF}>{m.name}</p>
                        {m.isSelf && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            you
                          </span>
                        )}
                      </div>
                      {m.phone && (
                        <p className="text-[11px] text-slate-400 truncate">{m.phone}</p>
                      )}
                    </div>
                    <div className={active ? CHECK_ON : CHECK_OFF}>
                      {active && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </button>
                );
              })}

              {!teamLoaded && team.length <= 1 && (
                <div className="px-4 py-2.5 text-[11.5px] text-slate-400 flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-500" />
                  Loading team members…
                </div>
              )}
            </div>
          </div>

          {/* ── Message preview ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                Message preview
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600 whitespace-pre-wrap leading-relaxed font-mono max-h-[200px] overflow-y-auto">
              {previewMessage}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={share}
            disabled={!canShare}
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1fb855] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sharing…
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Share via WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}