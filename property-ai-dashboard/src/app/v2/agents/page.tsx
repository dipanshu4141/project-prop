// src/app/v2/agents/page.tsx
import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { AgentList } from "./AgentList";

export default function AgentsPage() {
  return (
    <PageContainer>
      <PageHeader title="Agents" />
      <AgentList />
    </PageContainer>
  );
}
