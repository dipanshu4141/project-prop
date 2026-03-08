import {
  DataTable,
  DataTableRow,
  DataTableCell,
} from "@/components/v2/tables/DataTable";
import { LeadStageBadge } from "@/components/v2/utils/leadStage";
import { Phone } from "lucide-react";

export function PropertyLeadsTable({ leads }: { leads: any[] }) {
  return (
    <div className="bg-card p-4">
      {/* <div className="font-medium mb-3">Leads</div> */}

      <DataTable
        columns={["Name", "Phone", "Status", "Follow-up", "Actions"]}
      >
        {leads.length === 0 ? (
          <DataTableRow>
            <DataTableCell colSpan={5}>
              <div className="py-6 text-center text-muted-foreground">
                No leads yet
              </div>
            </DataTableCell>
          </DataTableRow>
        ) : (
          leads.map((lead) => (
            <DataTableRow key={lead.id}>
              <DataTableCell>{lead.targetName || "—"}</DataTableCell>
              <DataTableCell>{lead.targetContact || "—"}</DataTableCell>
              <DataTableCell>
                <LeadStageBadge stage={lead.leadStage} />
              </DataTableCell>
              <DataTableCell>
                {lead.followUpAt
                  ? new Date(lead.followUpAt).toLocaleDateString()
                  : "—"}
              </DataTableCell>
              <DataTableCell>
                <a
                  href={`tel:${lead.targetContact}`}
                  className="rounded-md p-2 hover:bg-muted inline-flex"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTable>
    </div>
  );
}
