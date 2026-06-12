import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-6 lg:py-8",
        className
      )}
    >
      {/*
        Mobile-only spacers for the two fixed bars.
        Using divs instead of pt/pb avoids tailwind-merge dropping
        lg:py-8 when it sees a conflicting arbitrary pt-[calc(...)].

        Top spacer: clears fixed app top bar (h-14 = 3.5rem) + breathing room (1.25rem)
        Bottom spacer: clears fixed bottom nav (h-16 = 4rem) + breathing room (1.25rem)
        Both are hidden on lg+ where the sidebar is static and there are no fixed bars.
      */}
      <div className="h-[calc(0.5rem+0.5rem)] lg:hidden" aria-hidden="true" />

      {children}

      <div className="h-[calc(4rem+1.25rem)] lg:hidden" aria-hidden="true" />
    </div>
  );
}