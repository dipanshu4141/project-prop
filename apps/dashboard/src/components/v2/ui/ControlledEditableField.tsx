"use client";

export function ControlledEditableField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: any;
  type?: "text" | "number" | "date";
  onChange: (value: any) => void;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">
        {label}
      </div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border px-2 text-sm"
      />
    </div>
  );
}
