import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#d8e600] to-[#b6c400] text-[#070b0f] font-bold shadow-[0_2px_14px_rgba(200,212,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_4px_24px_rgba(200,212,0,0.4)] hover:brightness-105",
        destructive:
          "bg-gradient-to-b from-[#d9533c] to-[#bb4934] text-white shadow-[0_2px_12px_rgba(187,73,52,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110",
        outline:
          "border border-white/12 bg-white/[0.04] text-foreground hover:bg-white/[0.09] hover:border-white/20 hover:text-white shadow-xs",
        secondary:
          "bg-white/[0.06] hover:bg-white/[0.1] text-foreground border border-white/[0.08] shadow-xs",
        ghost: "hover:bg-white/[0.06] text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-xs",
        sm: "h-9 px-4 py-1.5 text-xs",
        lg: "h-12 px-8 py-3 text-sm font-bold",
        icon: "h-10 w-10 p-0",
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
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonVariants({ variant, size, className }), (children.props as any).className),
        ref,
        ...props,
      });
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
