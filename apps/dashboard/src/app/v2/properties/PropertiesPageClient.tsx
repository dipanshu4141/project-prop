"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import PropertiesClient from "./PropertiesClient";
import AddPropertyModal from "./AddPropertyModal";
import { PasteMessageButton } from "@/components/v2/property/PasteMessageButton";
import { useRouter } from 'next/navigation';
import { StartDealModal } from '@/components/v2/deals/StartDealModal';
import Link from 'next/link';
import { Radio } from 'lucide-react';


function GroupsBanner() {
  return (
    <Link href="/v2/groups">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200 flex-shrink-0">
            <Radio className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Subscribe to WhatsApp groups</p>
            <p className="text-xs text-emerald-600 mt-0.5">Listings from subscribed groups appear here automatically</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 group-hover:border-emerald-300 transition-colors flex-shrink-0">
          Manage groups →
        </span>
      </div>
    </Link>
  );
}

export default function PropertiesPageClient() {
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();
  const [showDeal, setShowDeal] = useState(false);
  

  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader 
        title="Properties"
        actions={
          <div className="flex gap-2">
            <PasteMessageButton />
            <button
              onClick={() => setAddOpen(true)}
              className="
                inline-flex items-center gap-2
                rounded-[9px]
                bg-[#0B1F14]
                px-4 py-2.5
                text-sm font-medium text-white
                shadow-sm
                transition-all duration-150
                hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]
              "
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white text-[13px] leading-none font-light">
                <Plus className="h-3 w-3" />
              </span>
              Add Property
            </button>
          </div>
        }
      />

      <GroupsBanner />
    <PropertiesClient />

      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </PageContainer>
  );
}