import { serverGet } from '@/lib/serverApi';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CollectionClient } from './CollectionClient';

async function getCollection(id: string) {
  try { return await serverGet<any>(`/collections/${id}`); }
  catch { return null; }
}

export default async function CollectionPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await getCollection(id);
  if (!col) notFound();

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">
      <div className="sticky top-14 lg:top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 py-2.5">
        <Link
          href="/v2/collections"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Collections
        </Link>
        <p className="text-[13px] font-semibold text-slate-700">
          {col.emoji} {col.name}
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6">
        <CollectionClient collection={col} />
      </div>
    </div>
  );
}