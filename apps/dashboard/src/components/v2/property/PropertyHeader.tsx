"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { PropertyStatusSelect } from "./PropertyStatusSelect";
import { SharePropertyModal } from "./SharePropertyModal";

type Props = {
  title: string;
  propertyId: string;
  status: string;
  prevId?: string | null;
  nextId?: string | null;
};

export function PropertyHeader({
  title,
  propertyId,
  status,
  prevId,
  nextId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative flex items-center justify-between">
        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-3">
          {/* 🔙 PURE BACK (history-based) */}
          <button
            onClick={() => router.back()}
            className="rounded-md p-2 hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <h1 className="text-lg font-semibold truncate">
            {title}
          </h1>
        </div>

        {/* ================= CENTER NAV ================= */}
        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            flex items-center gap-1
          "
        >
          <button
            disabled={!prevId}
            onClick={() => {
              if (!prevId) return;
              router.push(`/v2/properties/${prevId}`);
            }}
            className="
              h-10 w-10
              flex items-center justify-center
              rounded-lg
              transition
              hover:bg-indigo-100
              active:scale-95
              disabled:opacity-40 disabled:pointer-events-none
            "
            aria-label="Previous property"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            disabled={!nextId}
            onClick={() => {
              if (!nextId) return;
              router.push(`/v2/properties/${nextId}`);
            }}
            className="
              h-10 w-10
              flex items-center justify-center
              rounded-lg
              transition
              hover:bg-indigo-100
              active:scale-95
              disabled:opacity-40 disabled:pointer-events-none
            "
            aria-label="Next property"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-2">
          <PropertyStatusSelect
            propertyId={propertyId}
            currentStatus={status}
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
