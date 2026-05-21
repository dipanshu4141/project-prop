'use client';

import { useState } from 'react';
import { ImagePlus, Images } from 'lucide-react';
import { MediaSliderModal } from '@/components/v2/property/MediaSliderModal';
import { MediaUploadModal } from '@/components/v2/property/MediaUploadModal';

export function ClientPropertyActions({
  clientPropertyId,
  currentStatus,
  listingId,
}: {
  clientPropertyId: string;
  currentStatus:    string;
  listingId:        string;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [showSlider, setShowSlider] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {/* View media */}
        <button
          onClick={() => setShowSlider(true)}
          title="View media"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all"
        >
          <Images className="h-3.5 w-3.5" />
        </button>

        {/* Add media */}
        <button
          onClick={() => setShowUpload(true)}
          title="Add media"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all"
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {showSlider && (
        <MediaSliderModal
          listingId={listingId}
          onClose={() => setShowSlider(false)}
        />
      )}

      {showUpload && (
        <MediaUploadModal
          listingId={listingId}
          onClose={() => setShowUpload(false)}
          onDone={() => setShowUpload(false)}
        />
      )}
    </>
  );
}