import { Suspense } from "react";
import PropertiesPageClient from "./PropertiesPageClient";

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading properties…</div>}>
      <PropertiesPageClient />
    </Suspense>
  );
}