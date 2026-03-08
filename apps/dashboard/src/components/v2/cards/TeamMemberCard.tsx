import { Badge } from "@/components/v2/ui/Badge";
import { Phone, Trash2 } from "lucide-react";

export function TeamMemberCard() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">Rahul Sharma</div>
          <div className="text-xs text-muted-foreground">Sales Agent</div>
        </div>
        <Badge variant="success">Active</Badge>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Phone: 9876543210
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Phone className="h-4 w-4" />
          Call
        </button>
        <button className="inline-flex items-center justify-center rounded-md border px-3 py-2 hover:bg-muted text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
