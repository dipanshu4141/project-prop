import { ReactNode } from "react";

export function StatCard({
  title,
  value,
  icon,
  footer,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  footer?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>

      {footer && (
        <div className="mt-1 text-xs text-muted-foreground">{footer}</div>
      )}
    </div>
  );
}
