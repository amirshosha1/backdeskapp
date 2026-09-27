import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "tap inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** The one primary action on a screen. */
        primary: "bg-ink text-white",
        /** Brand-blue action on the light page. */
        brand: "bg-brand text-white",
        /** Soft grey pill — secondary actions on the light page. */
        soft: "bg-fill text-ink",
        /** White pill on the royal hero. */
        light: "bg-white text-navy-900",
        /** Frosted pill on the royal hero. */
        glass: "glass text-white",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 text-sm",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
