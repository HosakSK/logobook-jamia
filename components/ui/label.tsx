import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<"label">>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
