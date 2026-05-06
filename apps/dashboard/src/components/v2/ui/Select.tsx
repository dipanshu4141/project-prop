export function Select({
    children,
    ...props
  }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
      <select
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        {...props}
      >
        {children}
      </select>
    );
  }
  