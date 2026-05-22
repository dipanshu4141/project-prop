'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, CheckCircle2, AlertCircle, VideoIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/* ─── Compression ────────────────────────────────────────── */

async function compressIfImage(file: File, compressed: boolean): Promise<File> {
  if (!file.type.startsWith('image/') || !compressed) return file;
  try {
    const blob = await imageCompression(file, {
      maxSizeMB:        1,
      maxWidthOrHeight: 1920,
      useWebWorker:     true,
      fileType:         'image/webp',
    });
    return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
    });
  } catch {
    return file;
  }
}

/* ─── Types ──────────────────────────────────────────────── */

interface UploadFile {
  file:         File;
  preview:      string;
  type:         'IMAGE' | 'VIDEO';
  compressed:   boolean;
  status:       'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  error?:       string;
  originalSize?: number;
  finalSize?:    number;
}

interface Props {
  listingId: string;
  onClose:   () => void;
  onDone?:   () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function mimeToType(mime: string): 'IMAGE' | 'VIDEO' | null {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  return null;
}

export function MediaUploadModal({ listingId, onClose, onDone }: Props) {
  const [queue,     setQueue]     = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const items: UploadFile[] = files
      .filter((f) => mimeToType(f.type) !== null)
      .map((f) => ({
        file:         f,
        preview:      URL.createObjectURL(f),
        type:         mimeToType(f.type)!,
        compressed:   true,
        status:       'pending',
        originalSize: f.size,
      }));
    setQueue((q) => [...q, ...items]);
    e.target.value = '';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const items: UploadFile[] = files
      .filter((f) => mimeToType(f.type) !== null)
      .map((f) => ({
        file:         f,
        preview:      URL.createObjectURL(f),
        type:         mimeToType(f.type)!,
        compressed:   true,
        status:       'pending',
        originalSize: f.size,
      }));
    setQueue((q) => [...q, ...items]);
  }, []);

  const toggleCompressed = (idx: number) =>
    setQueue((q) => q.map((item, i) => i === idx ? { ...item, compressed: !item.compressed } : item));

  const removeFromQueue = (idx: number) =>
    setQueue((q) => q.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    if (uploading) return;
    setUploading(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== 'pending') continue;

      setQueue((q) => q.map((it, idx) => idx === i ? { ...it, status: 'compressing' } : it));
      const fileToUpload = await compressIfImage(item.file, item.compressed);
      const mimeType  = fileToUpload.type;
      const sizeBytes = fileToUpload.size;

      setQueue((q) => q.map((it, idx) => idx === i
        ? { ...it, status: 'uploading', finalSize: sizeBytes }
        : it
      ));

      try {
        const presignRes = await fetch('/api/media/presign', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ listingId, type: item.type, mimeType, sizeBytes, isCompressed: item.compressed }),
        });
        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error((err as any).message ?? 'Failed to get upload URL');
        }
        const { presignedUrl, r2Key } = await presignRes.json();

        const putRes = await fetch(presignedUrl, {
          method:  'PUT',
          headers: { 'Content-Type': mimeType },
          body:    fileToUpload,
        });
        if (!putRes.ok) throw new Error('Upload failed');

        const confirmRes = await fetch('/api/media/confirm', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ r2Key, listingId, type: item.type, mimeType, sizeBytes, isCompressed: item.compressed }),
        });
        if (!confirmRes.ok) throw new Error('Failed to confirm upload');

        setQueue((q) => q.map((it, idx) => idx === i ? { ...it, status: 'done' } : it));
      } catch (err: any) {
        setQueue((q) => q.map((it, idx) => idx === i
          ? { ...it, status: 'error', error: err.message ?? 'Upload failed' }
          : it
        ));
      }
    }

    setTimeout(() => {
      setQueue((q) => q.filter((it) => it.status !== 'done'));
      setUploading(false);
      if (onDone) onDone();
    }, 1000);
  };

  const pendingCount = queue.filter((q) => q.status === 'pending').length;

  const modal = (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Add media</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Images auto-compressed to WebP · toggle HD to skip</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Upload className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-600">Tap to add photos & videos</p>
            <p className="text-[11px] text-slate-400">JPG, PNG, WEBP → compressed to WebP · MP4 supported</p>
          </div>
          <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={onFilePick} />

          {queue.length > 0 && (
            <div className="space-y-2">
              {queue.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    {item.type === 'IMAGE'
                      ? <img src={item.preview} className="h-full w-full object-cover" alt="" />
                      : <div className="flex h-full w-full items-center justify-center"><VideoIcon className="h-5 w-5 text-slate-400" /></div>
                    }
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
                  {item.status === 'pending' && (
                    <button
                      onClick={() => toggleCompressed(idx)}
                      className={['rounded-md px-2 py-1 text-[11px] font-medium transition-colors flex-shrink-0',
                        item.compressed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'].join(' ')}
                    >
                      {item.compressed ? 'WebP' : 'HD'}
                    </button>
                  )}
                  {item.status === 'compressing' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                      <span className="text-[10px] text-amber-600">Compressing…</span>
                    </div>
                  )}
                  {item.status === 'uploading' && <Loader2      className="h-4 w-4 animate-spin text-emerald-500 flex-shrink-0" />}
                  {item.status === 'done'       && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                  {item.status === 'error'      && <AlertCircle  className="h-4 w-4 text-red-400 flex-shrink-0" />}
                  {item.status === 'pending' && (
                    <button onClick={() => removeFromQueue(idx)} className="rounded-md p-1 text-slate-400 hover:bg-slate-200 transition-colors flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {pendingCount > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 flex-shrink-0">
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {uploading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                : <><Upload className="h-4 w-4" />Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}