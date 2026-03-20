"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import PropertiesClient from "./PropertiesClient";
import AddPropertyModal from "./AddPropertyModal";
import { PasteMessageButton } from "@/components/v2/property/PasteMessageButton";

export default function PropertiesPageClient() {
  const [addOpen, setAddOpen] = useState(false);

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

      <PropertiesClient />

      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </PageContainer>
  );
}