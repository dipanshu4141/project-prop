"use client";

import { Clock, MessageCircle, StickyNote, Calendar, ArrowRightLeft } from "lucide-react";

type ClientEvent = {
  id:        string;
  type:      string;
  metadata?: any;
  createdAt: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type EventMeta = { icon: React.ElementType; label: string; color: string; dot: string };

function metaFor(event: ClientEvent): EventMeta {
  switch (event.type) {
    case "PROPERTY_SHARED":
      return { icon: Calendar,       label: "Property shared",                                       color: "text-sky-600",     dot: "bg-sky-400"     };
    case "WHATSAPP_SENT":
      return { icon: MessageCircle,  label: "WhatsApp sent",                                         color: "text-emerald-600", dot: "bg-emerald-400" };
    case "FOLLOW_UP_SET":
      return { icon: Clock,          label: event.metadata?.auto ? "Follow-up auto set" : "Follow-up scheduled", color: "text-amber-600",   dot: "bg-amber-400"   };
    case "NOTE_ADDED":
      return { icon: StickyNote,     label: "Note added",                                            color: "text-violet-600",  dot: "bg-violet-400"  };
    case "STATUS_CHANGED":
      return { icon: ArrowRightLeft, label: "Status updated",                                        color: "text-slate-500",   dot: "bg-slate-300"   };
    default:
      return { icon: Clock,          label: "Activity",                                              color: "text-slate-400",   dot: "bg-slate-200"   };
  }
}

export function ClientTimeline({ events }: { events: ClientEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 text-xl">📋</div>
        <p className="text-[13px] font-medium text-slate-600">No activity yet</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">Actions like sharing properties and notes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-100" />

      {events.map((e, i) => {
        const { icon: Icon, label, color, dot } = metaFor(e);
        return (
          <div key={e.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {/* Dot */}
            <div className={`relative z-10 mt-1 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-white border-2 border-slate-100`}>
              <div className={`h-2 w-2 rounded-full ${dot}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                  <p className="text-[13px] font-medium text-slate-800 truncate">{label}</p>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0">{timeAgo(e.createdAt)}</span>
              </div>

              {e.metadata?.note && (
                <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="text-[12px] text-slate-600 italic">"{e.metadata.note}"</p>
                </div>
              )}

              {e.metadata?.status && (
                <p className="text-[11.5px] text-slate-400 mt-0.5">→ {e.metadata.status}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}