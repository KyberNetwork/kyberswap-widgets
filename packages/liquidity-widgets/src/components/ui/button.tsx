import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ks-inline-flex ks-items-center ks-justify-center ks-whitespace-nowrap ks-rounded-md ks-text-sm ks-font-medium ks-transition-colors focus-visible:ks-outline-none focus-visible:ks-ring-1 focus-visible:ks-ring-neutral-950 disabled:ks-pointer-events-none disabled:ks-opacity-50 dark:focus-visible:ks-ring-neutral-300",
  {
    variants: {
      variant: {
        default: "ks-bg-accent ks-text-black ks-shadow hover:ks-bg-accent",
        destructive:
          "ks-bg-red-500 ks-text-neutral-50 ks-shadow-sm hover:ks-bg-red-500/90",
        outline:
          "ks-border ks-border-stroke ks-bg-transparent ks-shadow-sm hover:ks-bg-transparent hover:ks-text-accent hover:ks-border-accent",
        secondary:
          "ks-bg-neutral-100 ks-text-neutral-900 ks-shadow-sm hover:ks-bg-neutral-100/80 dark:ks-bg-neutral-800 dark:ks-text-neutral-50 dark:hover:ks-bg-neutral-800/80",
        ghost: "hover:ks-bg-accent hover:ks-text-neutral-900",
        link: "ks-text-accent ks-underline-offset-4 hover:ks-underline",
      },
      size: {
        default: "ks-h-9 ks-px-4 ks-py-2",
        sm: "ks-h-8 ks-rounded-md ks-px-3 ks-text-xs",
        lg: "ks-h-10 ks-rounded-md ks-px-8",
        icon: "ks-h-9 ks-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
