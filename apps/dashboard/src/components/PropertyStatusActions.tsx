'use client';

import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ;

export function PropertyStatusActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`${API_URL}/properties/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      // Refresh property list
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });

  function ActionButton({
    label,
    newStatus,
    variant,
  }: {
    label: string;
    newStatus: string;
    variant?: any;
  }) {
    return (
      <Button
        size="sm"
        variant={variant}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(newStatus)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {status !== "APPROVED" && (
        <ActionButton label="✅ Approve" newStatus="APPROVED" />
      )}

      {status !== "REJECTED" && (
        <ActionButton label="❌ Reject" newStatus="REJECTED" variant="destructive" />
      )}

      {status !== "REVIEW" && (
        <ActionButton label="🟡 Review" newStatus="REVIEW" variant="outline" />
      )}
    </div>
  );
}
