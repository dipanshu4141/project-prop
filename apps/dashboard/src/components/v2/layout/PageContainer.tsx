import { cn } from "@/lib/utils";

type PageContainerProps = {
  children:   React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 lg:py-8",
        className
      )}
    >
      {/* Top spacer — clears fixed mobile top bar (h-14) + breathing room */}
      {/* <div className="h-[calc(3.5rem+0.75rem)] lg:hidden" aria-hidden="true" /> */}
      <div className="h-5 lg:hidden" aria-hidden="true" />
      {children}

      {/* Bottom spacer — clears fixed mobile bottom nav (h-16) + breathing room */}
      <div className="h-[calc(4rem+1.5rem)] lg:hidden" aria-hidden="true" />
    </div>
  );
}