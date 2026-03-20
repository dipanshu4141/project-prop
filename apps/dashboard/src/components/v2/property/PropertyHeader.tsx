"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyStatusSelect } from "./PropertyStatusSelect";
import { SharePropertyModal } from "./SharePropertyModal";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  title: string;
  propertyId: string;
  status: string;
  prevId?: string | null;
  nextId?: string | null;
  /**
   * compact mode — used inside the sticky top nav strip on the detail page.
   * Hides the title, back button, status select, and share button.
   * Shows only the prev / next navigation arrows.
   */
  compact?: boolean;
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function PropertyHeader({
  title,
  propertyId,
  status,
  prevId,
  nextId,
  compact = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  /* ── COMPACT MODE — only prev/next arrows ── */
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-1">
          <NavButton
            direction="prev"
            disabled={!prevId}
            onClick={() => prevId && router.push(`/v2/properties/${prevId}`)}
          />
          <NavButton
            direction="next"
            disabled={!nextId}
            onClick={() => nextId && router.push(`/v2/properties/${nextId}`)}
          />
        </div>

        {open && (
          <SharePropertyModal
            propertyId={propertyId}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  /* ── FULL MODE — original layout ── */
  return (
    <>
      <div className="relative flex items-center justify-between">

        {/* LEFT — back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        {/* CENTER — prev / next */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <NavButton
            direction="prev"
            disabled={!prevId}
            onClick={() => prevId && router.push(`/v2/properties/${prevId}`)}
          />
          <NavButton
            direction="next"
            disabled={!nextId}
            onClick={() => nextId && router.push(`/v2/properties/${nextId}`)}
          />
        </div>

        {/* RIGHT — status + share */}
        <div className="flex items-center gap-2">
          <PropertyStatusSelect
            propertyId={propertyId}
            currentStatus={status as "APPROVED" | "REJECTED" | "REVIEW"}
          />
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {open && (
        <SharePropertyModal
          propertyId={propertyId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* NAV BUTTON — shared between compact and full mode                  */
/* ------------------------------------------------------------------ */

function NavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous property" : "Next property"}
      className="
        flex h-8 w-8 items-center justify-center rounded-lg
        border border-slate-200 bg-white text-slate-600
        transition-all duration-150
        hover:border-slate-400 hover:text-slate-900
        active:scale-95
        disabled:opacity-40 disabled:pointer-events-none
      "
    >
      {direction === "prev"
        ? <ChevronLeft className="h-3.5 w-3.5" />
        : <ChevronRight className="h-3.5 w-3.5" />
      }
    </button>
  );
}