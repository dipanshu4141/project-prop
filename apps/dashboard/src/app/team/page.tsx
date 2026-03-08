'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TeamPage() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Load team members
  const { data: team = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/team`);
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!name || !phone) {
        alert("Name and phone are required");
        return;
      }

      await fetch(`${API_URL}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      setName("");
      setPhone("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API_URL}/team/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  return (
    <div className="p-6 max-w-3xl space-y-6">

      <h1 className="text-2xl font-bold">🧑‍💼 Team Members</h1>

      {/* Add Form */}
      <div className="border rounded p-4 bg-white space-y-3">
        <div className="font-semibold">➕ Add Team Member</div>

        <input
          className="border w-full px-3 py-2 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border w-full px-3 py-2 rounded"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Button
          disabled={addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          {addMutation.isPending ? "Adding..." : "Add Member"}
        </Button>
      </div>

      {/* List */}
      <div className="border rounded bg-white">
        <div className="p-4 font-semibold border-b">Team List</div>

        {isLoading && (
          <div className="p-4 text-gray-500">Loading...</div>
        )}

        {!isLoading && team.length === 0 && (
          <div className="p-4 text-gray-500">No team members yet</div>
        )}

        {!isLoading && team.map((m: any) => (
          <div
            key={m.id}
            className="flex justify-between items-center p-4 border-t"
          >
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-gray-500">{m.phone}</div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this team member?")) {
                  deleteMutation.mutate(m.id);
                }
              }}
            >
              🗑 Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}