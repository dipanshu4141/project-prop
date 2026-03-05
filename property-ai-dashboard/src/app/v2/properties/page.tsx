"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import PropertiesClient from "./PropertiesClient";
import AddPropertyModal from "./AddPropertyModal";

export default function PropertiesPage() {
  const [addOpen, setAddOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();



  return (
    <PageContainer className="bg-slate-50">
      <PageHeader
        title="Properties"
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="
              inline-flex items-center gap-2
              rounded-lg
              bg-gradient-to-r from-indigo-600 to-indigo-500
              px-4 py-2
              text-sm font-medium text-white
              shadow-sm
              transition hover:shadow-md
            "
          >
            <Plus className="h-4 w-4" />
            Add Propertyyys
          </button>
        }
      />

      <PropertiesClient />

      {/* ADD PROPERTY MODAL */}
      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </PageContainer>
  );
}
