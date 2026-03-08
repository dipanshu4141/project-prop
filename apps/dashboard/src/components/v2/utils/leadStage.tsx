import { Badge } from "@/components/v2/ui/Badge";

export function LeadStageBadge({ stage }: { stage: string }) {
  switch (stage) {
    case "NEW":
      return <Badge>New</Badge>;
    case "OPEN":
      return <Badge variant="success">Open</Badge>;
    case "CLOSED":
      return <Badge variant="success">Closed</Badge>;
    case "LOST":
      return <Badge variant="danger">Lost</Badge>;
    default:
      return <Badge>{stage}</Badge>;
  }
}