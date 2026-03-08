import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { TeamMemberCard } from "@/components/v2/cards/TeamMemberCard";
import { Plus } from "lucide-react";

export default function TeamPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Team"
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <TeamMemberCard />
        <TeamMemberCard />
        <TeamMemberCard />
        <TeamMemberCard />
        <TeamMemberCard />
      </div>
    </PageContainer>
  );
}
