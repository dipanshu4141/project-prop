"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className={className ?? "mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"}
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      <span>Back</span>
    </button>
  );
}