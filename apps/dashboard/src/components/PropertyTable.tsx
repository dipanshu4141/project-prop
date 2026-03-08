import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyViewDrawer } from "./PropertyViewDrawer";
import { PropertyEditDrawer } from "./PropertyEditDrawer";

function formatPrice(p?: string | number | null) {
  if (!p) return "-";
  const n = typeof p === "string" ? parseInt(p) : p;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString()}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return <Badge className="bg-green-600">APPROVED</Badge>;
  if (status === "REVIEW")
    return <Badge className="bg-yellow-500">REVIEW</Badge>;
  if (status === "REJECTED")
    return <Badge className="bg-red-600">REJECTED</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function PropertyTable({ data }: { data: any[] }) {
  const rows = Array.isArray(data) ? data : [];

  const [viewProperty, setViewProperty] = useState<any | null>(null);
  const [editProperty, setEditProperty] = useState<any | null>(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Building</TableHead>
            <TableHead>BHK</TableHead>
            <TableHead>Price</TableHead>
            {/* <TableHead>Confidence</TableHead> */}
            <TableHead>Leads</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((item) => (
            <TableRow
              key={item.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => setViewProperty(item)}
            >
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>

              <TableCell>
                <Badge variant="outline">{item.listingType}</Badge>
              </TableCell>

              <TableCell>{item.area || "-"}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {item.building || "-"}
              </TableCell>
              <TableCell>{item.bhk || "-"}</TableCell>

              <TableCell className="font-semibold">
                {formatPrice(item.price)}
              </TableCell>

              {/* <TableCell>
                {item.confidence
                  ? `${Math.round(item.confidence * 100)}%`
                  : "-"}
              </TableCell> */}

              <TableCell>
                <div className="text-sm space-y-1">
                  <div className="font-medium">
                    {item.leadsCount || 0} leads
                  </div>

                  {item.overdueFollowUpsCount > 0 && (
                    <div className="text-red-600 text-xs">
                      ⚠️ {item.overdueFollowUpsCount} overdue
                    </div>
                  )}

                  {item.overdueFollowUpsCount === 0 && item.dueFollowUpsCount > 0 && (
                    <div className="text-orange-600 text-xs">
                      🔔 {item.dueFollowUpsCount} due
                    </div>
                  )}
                </div>
              </TableCell>


              <TableCell
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Button size="sm" variant="outline">
                  📤 Share
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No properties found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ================= VIEW DRAWER ================= */}
      {viewProperty && (
        <PropertyViewDrawer
          property={viewProperty}
          onClose={() => setViewProperty(null)}
          onEdit={(prop: any) => {
            setViewProperty(null);
            setEditProperty(prop);
          }}
        />
      )}

      {/* ================= EDIT DRAWER ================= */}
      {editProperty && (
        <PropertyEditDrawer
          property={editProperty}
          onClose={() => setEditProperty(null)}
        />
      )}
    </div>
  );
}
