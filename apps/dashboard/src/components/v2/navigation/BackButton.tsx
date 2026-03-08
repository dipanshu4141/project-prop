"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      ← Back
    </button>
  );
}
