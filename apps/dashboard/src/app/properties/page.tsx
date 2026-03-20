'use client';

export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PropertyTable } from '@/components/PropertyTable';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type TabType = 'all' | 'followups' | 'open' | 'closed';

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const limit = 4;

  // 🔀 CRM Tab
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // 🔎 Filters
  const [area, setArea] = useState('');
  const [building, setBuilding] = useState('');
  const [status, setStatus] = useState('');
  const [smart, setSmart] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', activeTab, page, area, building, status, smart],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (area) params.set('area', area);
      if (building) params.set('building', building);
      if (status) params.set('status', status);
      if (smart) params.set('smart', smart);

      // 🧠 CRM unified view
      if (activeTab === 'followups') {
        params.set('leadView', 'followups');
      } else if (activeTab === 'open') {
        params.set('leadView', 'open');
      } else if (activeTab === 'closed') {
        params.set('leadView', 'closed');
      }

      const finalUrl = `${API_URL}/properties?${params.toString()}`;

      const res = await fetch(finalUrl);
      if (!res.ok) throw new Error('Failed to fetch');

      return res.json();
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading data</div>;

  // ✅ Unified response shape
  const items = (data as any)?.items || [];
  const totalPages = (data as any)?.pages || 1;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Properties</h1>

      {/* 🔀 CRM TABS */}
      <div className="flex gap-2 border-b pb-2">
        {(['all', 'followups', 'open', 'closed'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1 rounded capitalize ${
              activeTab === tab ? 'bg-black text-white' : 'bg-gray-100'
            }`}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
          >
            {tab === 'all' && 'All'}
            {tab === 'followups' && 'Follow-ups Today'}
            {tab === 'open' && 'Open Leads'}
            {tab === 'closed' && 'Closed Deals'}
          </button>
        ))}
      </div>

      {/* 🔎 FILTER BAR */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded border">
        <input
          className="border px-3 py-2 rounded w-48"
          placeholder="Filter by area (Andheri...)"
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
        />

        <input
          className="border px-3 py-2 rounded w-48"
          placeholder="Search building..."
          value={building}
          onChange={(e) => {
            setBuilding(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="border px-3 py-2 rounded"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="APPROVED">Approved</option>
          <option value="REVIEW">Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="NEW">New</option>
        </select>

        <Button
          variant={smart === 'urgent' ? 'default' : 'outline'}
          onClick={() => {
            setSmart((s) => (s === 'urgent' ? '' : 'urgent'));
            setPage(1);
          }}
        >
          🔥 Urgent Deals
        </Button>

        <Button
          variant={smart === 'review' ? 'default' : 'outline'}
          onClick={() => {
            setSmart((s) => (s === 'review' ? '' : 'review'));
            setPage(1);
          }}
        >
          🟡 Needs Review
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setArea('');
            setBuilding('');
            setStatus('');
            setSmart('');
            setPage(1);
          }}
        >
          Reset
        </Button>
      </div>

      {/* 📊 TABLE */}
      <PropertyTable data={items} />

      {/* 📄 PAGINATION */}
      <div className="flex justify-between items-center pt-4">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>

        <span>
          Page {page} of {totalPages}
        </span>

        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// export default function Test() {
//   return (
//     <div className="bg-red-500 text-white p-10 text-3xl">
//       IF THIS IS RED, TAILWIND IS WORKING
//     </div>
//   );
// }
