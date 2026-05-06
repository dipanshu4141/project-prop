export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold text-foreground sm:text-4xl truncate">
          {title}
        </h1>
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>

      {actions && (
        <div className="flex-shrink-0 self-start">{actions}</div>
      )}
    </div>
  );
}