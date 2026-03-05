import type { ReactNode } from "react";
import { AppShell } from "@/components/v2/layout/AppShell";

export default function V2Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
