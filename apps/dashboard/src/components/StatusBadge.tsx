import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  if (status === "green") return <Badge className="bg-green-500">Green</Badge>;
  if (status === "yellow") return <Badge className="bg-yellow-500">Yellow</Badge>;
  if (status === "red") return <Badge className="bg-red-500">Red</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}
