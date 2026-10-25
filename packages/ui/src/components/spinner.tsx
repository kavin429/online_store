import { LoaderIcon, type LucideProps } from "lucide-react";
import { cn } from "../lib/utils";

export function Spinner({ className, ...props }: LucideProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("w-4 h-4 animate-spin", className)}
      {...props}
    />
  );
}

export function SpinnerCustom() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  );
}
