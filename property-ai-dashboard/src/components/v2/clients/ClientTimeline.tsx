"use client";

import { Clock, MessageCircle, StickyNote, Calendar } from "lucide-react";

type ClientEvent = {
  id: string;
  type: string;
  metadata?: any;
  createdAt: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function iconFor(type: string) {
  switch (type) {
    case "PROPERTY_SHARED":
      return <Calendar className="h-4 w-4 text-blue-600" />;
    case "WHATSAPP_SENT":
      return <MessageCircle className="h-4 w-4 text-green-600" />;
    case "FOLLOW_UP_SET":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "NOTE_ADDED":
      return <StickyNote className="h-4 w-4 text-purple-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function labelFor(event: ClientEvent) {
  switch (event.type) {
    case "PROPERTY_SHARED":
      return "Property shared";
    case "WHATSAPP_SENT":
      return "WhatsApp sent";
    case "FOLLOW_UP_SET":
      return event.metadata?.auto
        ? "Follow-up auto set"
        : "Follow-up scheduled";
    case "NOTE_ADDED":
      return "Note added";
    case "STATUS_CHANGED":
      return "Status changed";
    default:
      return "Activity";
  }
}

export function ClientTimeline({ events }: { events: ClientEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="flex items-start gap-3">
          <div className="mt-1 opacity-60">
            {iconFor(e.type)}
          </div>

          <div>
            <div className="text-sm">
              {labelFor(e)}
            </div>

            {e.metadata?.note && (
              <div className="text-xs text-muted-foreground mt-1">
                “{e.metadata.note}”
              </div>
            )}

            <div className="text-xs text-muted-foreground mt-1">
              {timeAgo(e.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
