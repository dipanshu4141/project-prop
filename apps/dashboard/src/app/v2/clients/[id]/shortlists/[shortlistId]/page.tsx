import { serverGet } from '@/lib/serverApi';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Phone } from 'lucide-react';
import { ShortlistClient } from './ShortlistClient';

async function getShortlist(id: string) {
  try { return await serverGet<any>(`/shortlists/${id}`); }
  catch { return null; }
}

export default async function ShortlistPage({
  params,
}: {
  params: Promise<{ id: string; shortlistId: string }>;
}) {
  const { id: clientId, shortlistId } = await params;
  const shortlist = await getShortlist(shortlistId);
  if (!shortlist) notFound();

  const phone = shortlist.client?.phones?.[0]?.phone ?? '';

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">

      {/* Sticky nav */}
      <div className="sticky top-14 lg:top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5">
        <Link
          href={`/v2/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {shortlist.client?.name ?? 'Client'}
        </Link>

        <p className="absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-slate-700 truncate max-w-[200px]">
          {shortlist.name ?? 'Shortlist'}
        </p>

        {phone && (
            <a
            href={`tel:${phone}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
            >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6">
        <ShortlistClient shortlist={shortlist} />
      </div>
    </div>
  );
}