import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ks-flex ks-h-9 ks-w-full ks-rounded-md ks-border ks-border-input ks-bg-transparent ks-px-3 ks-py-1 ks-text-sm ks-shadow-sm ks-transition-colors file:ks-border-0 file:ks-bg-transparent file:ks-text-sm file:ks-font-medium file:ks-text-foreground placeholder:ks-text-muted-foreground focus-visible:ks-outline-none disabled:ks-cursor-not-allowed disabled:ks-opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
