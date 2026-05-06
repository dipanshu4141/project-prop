import { PageContainer } from "@/components/v2/layout/PageContainer";
import { PageHeader } from "@/components/v2/layout/PageHeader";
import { CalendarPlus } from "lucide-react";

export default function VisitsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Visits"
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <CalendarPlus className="h-4 w-4" />
            Schedule Visit
          </button>
        }
      />

      <div className="rounded-xl border bg-card p-10 text-center">
        <div className="text-muted-foreground">
          No visits scheduled yet
        </div>
      </div>
    </PageContainer>
  );
}
