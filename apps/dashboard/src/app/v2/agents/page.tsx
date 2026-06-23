// src/app/v2/agents/page.tsx
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { Plus } from "lucide-react";
import { AgentList } from "./AgentList";

export default function AgentsPage() {
  return (
    <PageContainer className="bg-[#F7F5F0]">
      <PageHeader
        title="Agents & Realtors"
        actions={
          <button className="
            inline-flex items-center gap-2 rounded-[9px]
            bg-[#0B1F14] px-4 py-2.5 text-sm font-medium text-white
            shadow-sm transition-all duration-150
            hover:bg-[#1A3525] hover:shadow-md hover:-translate-y-[1px]
          ">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white">
              <Plus className="h-3 w-3" />
            </span>
            Add Agent
          </button>
        }
      />
      <AgentList />
    </PageContainer>
  );
}