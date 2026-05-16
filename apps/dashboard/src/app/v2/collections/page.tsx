import { serverGet } from '@/lib/serverApi';
import Link from 'next/link';
import { Bookmark, Plus } from 'lucide-react';

async function getCollections() {
  try { return await serverGet<any[]>('/collections'); }
  catch { return []; }
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="min-h-screen bg-[#F7F5F0] pt-14 lg:pt-0">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 sm:py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold text-slate-900">Collections</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Your saved property collections</p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center">
            <Bookmark className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-[15px] font-semibold text-slate-800">No collections yet</p>
            <p className="mt-1 text-[13px] text-slate-400">
              Tap the bookmark icon on any property to save it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/v2/collections/${col.id}`}
                className="flex flex-col rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all px-4 py-4"
              >
                <span className="text-[28px] mb-2">{col.emoji ?? '📁'}</span>
                <p className="text-[14px] font-semibold text-slate-800 truncate">{col.name}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{col.itemCount} saved</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}