import { cn } from "@/lib/utils";

type BeautifulLoaderProps = {
  message?: string;
  className?: string;
  compact?: boolean;
};

const BeautifulLoader = ({
  message = "Loading...",
  className,
  compact = false,
}: BeautifulLoaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 backdrop-blur-sm",
        compact ? "py-6 px-4" : "py-12 px-6",
        className
      )}
    >
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-4 border-success/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-success animate-spin" />
        <div className="absolute inset-[9px] rounded-full bg-success/20 animate-pulse" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success/80 animate-bounce [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-success/80 animate-bounce [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-success/80 animate-bounce" />
      </div>

      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );
};

export default BeautifulLoader;
