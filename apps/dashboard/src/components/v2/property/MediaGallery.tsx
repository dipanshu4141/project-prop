"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImageIcon, VideoIcon, Upload, X, Loader2,
  Share2, Trash2, ZoomIn, CheckCircle2, AlertCircle, Check, EyeOff,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { useAuth } from "@/context/AuthContext";

/* ─── Types ──────────────────────────────────────────────── */

interface MediaItem {
  id:             string;
  url:            string;
  type:           "IMAGE" | "VIDEO" | "DOCUMENT";
  mimeType:       string;
  sizeBytes:      number;
  isCompressed:   boolean;
  isShared:       boolean;
  source:         "BROKER_UPLOAD" | "WHATSAPP_INGESTED";
  countedInQuota: boolean;
  createdAt:      string;
  workspaceId:    string;
}

interface UploadFile {
  file:       File;
  preview:    string;
  type:       "IMAGE" | "VIDEO";
  compressed: boolean;
  status:     "pending" | "compressing" | "uploading" | "done" | "error";
  error?:     string;
  originalSize?: number;
  finalSize?:    number;
}

interface Props {
  listingId:           string;
  canonicalPropertyId?: string;
}

/* ─── Compression ────────────────────────────────────────── */

async function compressIfImage(file: File, compressed: boolean): Promise<File> {
  if (!file.type.startsWith("image/") || !compressed) return file;
  try {
    const blob = await imageCompression(file, {
      maxSizeMB:        1,
      maxWidthOrHeight: 1920,
      useWebWorker:     true,
      fileType:         "image/webp",
    });
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

/* ─── Helpers ────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function mimeToMediaType(mime: string): "IMAGE" | "VIDEO" | null {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return null;
}

/* ─── Component ──────────────────────────────────────────── */

export function MediaGallery({ listingId, canonicalPropertyId }: Props) {
  const [media,    setMedia]    = useState<MediaItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [queue,    setQueue]    = useState<UploadFile[]>([]);
  const [uploading,setUploading]= useState(false);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { workspace } = useAuth();
  const currentWorkspaceId = workspace?.id;

  /* ── Selection mode state ── */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [bulkLoading,   setBulkLoading]   = useState(false);

  /* fetch existing media */
  useEffect(() => {
    fetch(`/api/media/listing/${listingId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setMedia(Array.isArray(d) ? d : []))
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* file picker */
  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const items: UploadFile[] = files
      .filter((f) => mimeToMediaType(f.type) !== null)
      .map((f) => ({
        file:         f,
        preview:      URL.createObjectURL(f),
        type:         mimeToMediaType(f.type)!,
        compressed:   true,
        status:       "pending",
        originalSize: f.size,
      }));
    setQueue((q) => [...q, ...items]);
    e.target.value = "";
  }, []);

  /* drag-drop */
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const items: UploadFile[] = files
      .filter((f) => mimeToMediaType(f.type) !== null)
      .map((f) => ({
        file:         f,
        preview:      URL.createObjectURL(f),
        type:         mimeToMediaType(f.type)!,
        compressed:   true,
        status:       "pending",
        originalSize: f.size,
      }));
    setQueue((q) => [...q, ...items]);
  }, []);

  const toggleCompressed = (idx: number) =>
    setQueue((q) => q.map((item, i) => i === idx ? { ...item, compressed: !item.compressed } : item));

  const removeFromQueue = (idx: number) =>
    setQueue((q) => q.filter((_, i) => i !== idx));

  /* upload all pending */
  const uploadAll = async () => {
    if (uploading) return;
    setUploading(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== "pending") continue;

      setQueue((q) => q.map((it, idx) => idx === i ? { ...it, status: "compressing" } : it));
      const fileToUpload = await compressIfImage(item.file, item.compressed);
      const mimeType  = fileToUpload.type;
      const sizeBytes = fileToUpload.size;

      setQueue((q) => q.map((it, idx) => idx === i
        ? { ...it, status: "uploading", finalSize: sizeBytes }
        : it
      ));

      try {
        const presignRes = await fetch("/api/media/presign", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            listingId,
            type:         item.type,
            mimeType,
            sizeBytes,
            isCompressed: item.compressed,
          }),
        });
        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error((err as any).message ?? "Failed to get upload URL");
        }
        const { presignedUrl, r2Key } = await presignRes.json();

        const putRes = await fetch(presignedUrl, {
          method:  "PUT",
          headers: { "Content-Type": mimeType },
          body:    fileToUpload,
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        const confirmRes = await fetch("/api/media/confirm", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            r2Key,
            listingId,
            type:         item.type,
            mimeType,
            sizeBytes,
            isCompressed: item.compressed,
          }),
        });
        if (!confirmRes.ok) throw new Error("Failed to confirm upload");

        const newMedia: MediaItem = await confirmRes.json();
        setMedia((m) => [...m, newMedia]);
        setQueue((q) => q.map((it, idx) => idx === i ? { ...it, status: "done" } : it));
      } catch (err: any) {
        setQueue((q) => q.map((it, idx) => idx === i
          ? { ...it, status: "error", error: err.message ?? "Upload failed" }
          : it
        ));
      }
    }

    setTimeout(() => {
      setQueue((q) => q.filter((it) => it.status !== "done"));
    }, 1500);
    setUploading(false);
  };

  /* single delete */
  const deleteMedia = async (mediaId: string) => {
    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setMedia((m) => m.filter((it) => it.id !== mediaId));
      showToast("Photo deleted");
    } catch {
      showToast("Delete failed", false);
    }
  };

  /* single share toggle */
  const shareMedia = async (mediaId: string) => {
    if (!canonicalPropertyId) return;
    try {
      const res = await fetch("/api/media/share-community", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mediaId, canonicalPropertyId }),
      });
      if (!res.ok) throw new Error();
      const wasShared = media.find((it) => it.id === mediaId)?.isShared;
      setMedia((m) => m.map((it) => it.id === mediaId ? { ...it, isShared: !it.isShared } : it));
      showToast(wasShared ? "Made private" : "Shared to community");
    } catch {
      showToast("Share failed", false);
    }
  };

  /* ── Bulk actions ── */
  function toggleSelect(id: string) {
    const item = media.find((m) => m.id === id);
    if (!item || item.source !== "BROKER_UPLOAD" || item.workspaceId !== currentWorkspaceId) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}? This can't be undone.`)) return;
    setBulkLoading(true);
    const ids = [...selectedIds];
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/media/${id}`, { method: "DELETE", credentials: "include" }).catch(() => null)
      ),
    );
    setMedia((m) => m.filter((it) => !selectedIds.has(it.id)));
    showToast(`Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}`);
    setBulkLoading(false);
    exitSelectionMode();
  }

  async function bulkSetShared(shared: boolean) {
    if (selectedIds.size === 0 || !canonicalPropertyId) return;
    setBulkLoading(true);
    const ids = [...selectedIds].filter((id) => {
      const item = media.find((m) => m.id === id);
      return item && item.isShared !== shared && item.workspaceId === currentWorkspaceId;
    });
    await Promise.all(
      ids.map((id) =>
        fetch("/api/media/share-community", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ mediaId: id, canonicalPropertyId }),
        }).catch(() => null)
      ),
    );
    setMedia((m) => m.map((it) => ids.includes(it.id) ? { ...it, isShared: shared } : it));
    showToast(shared ? `Shared ${ids.length} to community` : `Made ${ids.length} private`);
    setBulkLoading(false);
    exitSelectionMode();
  }

  const uploaded = media.filter((m) => m.source === "BROKER_UPLOAD");
  const ingested = media.filter((m) => m.source === "WHATSAPP_INGESTED");

  /* ── RENDER ── */
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-slate-400" />
          <p className="text-[13px] font-semibold text-slate-800">Media</p>
          {media.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {media.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {media.length > 0 && (
            <button
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                selectionMode
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "border border-slate-200 text-slate-600 hover:border-slate-400",
              ].join(" ")}
            >
              {selectionMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F14] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1a3525] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={onFilePick}
        />
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* Drop zone */}
        {queue.length === 0 && media.length === 0 && !loading && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-10 px-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-600">Drop photos & videos here</p>
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Auto-compressed to WebP · toggle HD per file · MP4 supported
            </p>
          </div>
        )}

        {/* Upload queue */}
        {queue.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ready to upload
            </p>
            <div className="space-y-2">
              {queue.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    {item.type === "IMAGE" ? (
                      <img src={item.preview} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <VideoIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-slate-700">{item.file.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.finalSize
                        ? <>{formatBytes(item.originalSize ?? item.file.size)} → <span className="text-emerald-600 font-medium">{formatBytes(item.finalSize)}</span></>
                        : formatBytes(item.originalSize ?? item.file.size)
                      }
                    </p>
                  </div>

                  {item.status === "pending" && (
                    <button
                      onClick={() => toggleCompressed(idx)}
                      className={[
                        "rounded-md px-2 py-1 text-[11px] font-medium transition-colors flex-shrink-0",
                        item.compressed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200 text-slate-500 hover:bg-slate-300",
                      ].join(" ")}
                    >
                      {item.compressed ? "WebP" : "HD"}
                    </button>
                  )}

                  {item.status === "compressing" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                      <span className="text-[10px] text-amber-600">Compressing…</span>
                    </div>
                  )}
                  {item.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500 flex-shrink-0" />
                  )}
                  {item.status === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  )}
                  {item.status === "error" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-[11px] text-red-400">{item.error}</span>
                    </div>
                  )}

                  {item.status === "pending" && (
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {queue.some((q) => q.status === "pending") && (
              <button
                onClick={uploadAll}
                disabled={uploading}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {queue.filter((q) => q.status === "pending").length} file
                    {queue.filter((q) => q.status === "pending").length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        )}

        {/* Broker uploaded media */}
        {uploaded.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Uploaded by you
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {uploaded.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onView={() => setLightbox(item)}
                  editable={item.source === "BROKER_UPLOAD" && item.workspaceId === currentWorkspaceId}
                />
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp ingested media */}
        {ingested.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                From WhatsApp
              </p>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                Free
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {ingested.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onView={() => setLightbox(item)}
                  editable={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {lightbox.type === "IMAGE" ? (
            <img
              src={lightbox.url}
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
              alt=""
            />
          ) : (
            <video
              src={lightbox.url}
              controls
              className="max-h-[90vh] max-w-[90vw] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={[
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-lg",
          toast.ok ? "bg-emerald-600" : "bg-red-500",
        ].join(" ")}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Floating bulk action bar */}
      <div className={[
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        "flex min-w-[320px] items-center gap-3 rounded-2xl",
        "bg-[#0B1F14] px-5 py-3.5",
        "border border-white/10 shadow-2xl",
        "transition-all duration-300 ease-out",
        selectedIds.size > 0
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-6 opacity-0 pointer-events-none",
      ].join(" ")}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
          {selectedIds.size}
        </span>
        <span className="text-[13px] font-medium text-white/90">selected</span>
        <div className="ml-auto flex items-center gap-1.5">
          {canonicalPropertyId && (
            <>
              <button
                onClick={() => bulkSetShared(true)}
                disabled={bulkLoading}
                title="Share to community"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => bulkSetShared(false)}
                disabled={bulkLoading}
                title="Make private"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={bulkDelete}
            disabled={bulkLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50 transition-colors"
          >
            {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Media Tile ─────────────────────────────────────────── */

function MediaTile({
  item, selectionMode, selected, onToggleSelect, onView, editable,
}: {
  item:           MediaItem;
  selectionMode:  boolean;
  selected:       boolean;
  onToggleSelect: () => void;
  onView:         () => void;
  editable:       boolean;
}) {
  return (
    <div
      className={[
        "group relative aspect-square overflow-hidden rounded-xl bg-slate-100 cursor-pointer transition-all",
        selected ? "ring-2 ring-emerald-500" : "",
        selectionMode && !editable ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
      onClick={() => {
        if (selectionMode) {
          if (editable) onToggleSelect();
        } else {
          onView();
        }
      }}
    >
      {item.type === "IMAGE" ? (
        <img
          src={item.url}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          alt=""
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-800">
          <VideoIcon className="h-8 w-8 text-white/60" />
        </div>
      )}

      {/* Selection checkbox */}
      {selectionMode && editable &&(
        <div className={[
          "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
          selected
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-white bg-black/30 text-transparent",
        ].join(" ")}>
          {selected && <Check className="h-3 w-3" />}
        </div>
      )}

      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
        {item.isShared && (
          <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            SHARED
          </span>
        )}
        {item.isCompressed && (
          <span className="rounded-md bg-slate-700/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
            WEBP
          </span>
        )}
      </div>
    </div>
  );
}