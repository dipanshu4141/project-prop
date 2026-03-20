"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { WhatsAppDraftModal } from "./WhatsAppDraftModal";

type Props = {
  clientPropertyId: string;
  clientName?:      string | null;
  clientPhone:      string;
  propertyLabel:    string;
  onSent?:          () => void;
};

export function WhatsAppAction({
  clientPropertyId,
  clientName,
  clientPhone,
  propertyLabel,
  onSent,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Send via WhatsApp"
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 hover:border-[#25D366] hover:text-[#25D366] transition-all"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {open && (
        <WhatsAppDraftModal
          clientPropertyId={clientPropertyId}
          clientName={clientName}
          clientPhone={clientPhone}
          propertyLabel={propertyLabel}
          onClose={() => setOpen(false)}
          onSent={onSent}
        />
      )}
    </>
  );
}