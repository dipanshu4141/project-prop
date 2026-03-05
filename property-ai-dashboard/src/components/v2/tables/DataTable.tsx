import { ReactNode, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import React from "react";

type DataTableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

export function DataTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DataTableRow({
    className,
    ...props
  }: DataTableRowProps) {
    return (
      <tr
        {...props}
        className={cn(
          "border-b transition-colors hover:bg-muted/50",
          className
        )}
      />
    );
  }

export function DataTableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 ${className || ""}`} {...props}>
      {children}
    </td>
  );
}
