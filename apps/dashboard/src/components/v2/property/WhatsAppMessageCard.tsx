// "use client";

// import { useEffect, useRef, useState } from "react";

// export function WhatsAppMessageCard({ message }: { message: string }) {
//   const [open, setOpen] = useState(false);
//   const [maxHeight, setMaxHeight] = useState<number | null>(null);
//   const bodyRef = useRef<HTMLDivElement | null>(null);

//   // Measure left-side column height when expanded
//   useEffect(() => {
//     if (!open) return;
  
//     const leftColumn = document.getElementById("property-left-column");
//     if (!leftColumn) return;
  
//     const rect = leftColumn.getBoundingClientRect();
  
//     // subtract header + padding so it visually matches
//     const OFFSET = 80; // tuned for your layout
//     const MAX_SAFE_HEIGHT = 420; // prevents dominance
  
//     const calculated = Math.max(
//       180,
//       Math.min(rect.height - OFFSET, MAX_SAFE_HEIGHT)
//     );
  
//     setMaxHeight(calculated);
//   }, [open]);
  

//   return (
//     <div className="mt-4 rounded-lg border bg-white">
//       {/* HEADER */}
//       <button
//         onClick={() => setOpen(v => !v)}
//         className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
//       >
//         <div className="font-medium">Whatsapp Message</div>
//         <span className="text-xs text-muted-foreground">
//           {open ? "Hide" : "View"}
//         </span>
//       </button>

//       {/* BODY */}
//       {open && (
//         <div
//           ref={bodyRef}
//           className="relative resize-y overflow-auto border-t px-4 py-3 text-sm text-slate-800"
//           style={{
//             maxHeight: maxHeight ? `${maxHeight}px` : "360px",
//             minHeight: "140px",
//           }}
//         >
//           <pre className="whitespace-pre-wrap">{message}</pre>

//           {/* resize hint */}
//           <div className="pointer-events-none absolute bottom-1 right-2 text-[11px] text-muted-foreground">
//             drag to resize
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



























"use client";

import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export function WhatsAppMessageCard({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const leftColumn = document.getElementById("property-left-column");
    if (!leftColumn) return;

    const rect = leftColumn.getBoundingClientRect();

    const OFFSET = 80;
    const MAX_SAFE_HEIGHT = 420;

    const calculated = Math.max(
      180,
      Math.min(rect.height - OFFSET, MAX_SAFE_HEIGHT)
    );

    setMaxHeight(calculated);
  }, [open]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-700 bg-[#0b141a]">

      {/* INLINE KEYFRAMES */}
      <style>
        {`
          @keyframes whatsappInline {
            0% { color: #25D366; }
            50% { color: #ffffff; }
            100% { color: #25D366; }
          }
        `}
      </style>

      <style>
        {`
        @keyframes whatsappGlow {
          0% {
            text-shadow: 0 0 0px rgba(37,211,102,0);
          }
          50% {
            text-shadow: 0 0 10px rgba(37,211,102,0.9), 
                        0 0 20px rgba(37,211,102,0.6);
          }
          100% {
            text-shadow: 0 0 0px rgba(37,211,102,0);
          }
        }

        @keyframes whatsappShine {
          0% {
            background-position: -200px;
          }
          100% {
            background-position: 200px;
          }
        }
        `}
        </style>

      {/* HEADER */}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-[#202c33] px-4 py-3 hover:bg-[#2a3942]"
      >
        <div className="flex items-center gap-2 font-medium">

          <FaWhatsapp style={{ color: "#25D366", fontSize: "18px" }} />

          {/* <span style={{ color: "#25D366" }}>
            WhatsApp
          </span> */}

          {/* <span
            style={{
              animation: "whatsappInline 4s linear infinite"
            }}
          >
            Message
          </span> */}

          <span
            style={{
              color: "#25D366",
              fontWeight: 500,
              background: "linear-gradient(90deg,#25D366,#ffffff,#25D366)",
              backgroundSize: "200px",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "whatsappShine 2s linear infinite",
            }}
          >
            WhatsApp Message
          </span>

        </div>

        <span className="text-xs text-slate-300">
          {open ? "Hide" : "View"}
        </span>
      </button>

      {/* BODY */}
      {open && (
        <div
          ref={bodyRef}
          className="relative resize-y overflow-auto border-t border-slate-700 p-4"
          style={{
            maxHeight: maxHeight ? `${maxHeight}px` : "360px",
            minHeight: "140px",
            backgroundColor: "#0b141a",
            backgroundImage:
              "linear-gradient(rgba(11,20,26,0.92), rgba(11,20,26,0.92)), url('/whatsapp-bg.png')",
            backgroundRepeat: "repeat",
          }}
        >
          {/* MESSAGE BUBBLE */}
          <div className="relative max-w-[85%] rounded-lg bg-[#202c33] px-4 py-3 text-white shadow">

            {/* bubble tail */}
            <div className="absolute -left-1 top-2 h-3 w-3 rotate-45 bg-[#202c33]" />

            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">
              {message}
            </pre>

          </div>

          {/* resize hint */}
          <div className="pointer-events-none absolute bottom-1 right-2 text-[11px] text-slate-400">
            drag to resize
          </div>

        </div>
      )}
    </div>
  );
}