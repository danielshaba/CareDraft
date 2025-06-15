import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        outline: "border border-brand-500 bg-transparent text-brand-500 hover:bg-brand-50 hover:text-brand-600 focus:ring-brand-500",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
        ghost: "bg-transparent text-brand-500 hover:bg-brand-50 hover:text-brand-600 focus:ring-brand-500",
        link: "text-brand-500 underline-offset-4 hover:underline hover:text-brand-600 focus:ring-brand-500",
        success: "bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-600",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 