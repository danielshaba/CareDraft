import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus-visible:ring-brand-500 focus-visible:border-brand-500",
        error: "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 text-red-900 placeholder:text-red-400",
        success: "border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500 text-green-900",
        warning: "border-yellow-500 focus-visible:ring-yellow-500 focus-visible:border-yellow-500 text-yellow-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps 
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: string
  success?: string
  warning?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, error, success, warning, ...props }, ref) => {
    // Determine variant based on validation states
    const computedVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(inputVariants({ variant: computedVariant, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {success && !error && (
          <p className="mt-1 text-sm text-green-600">{success}</p>
        )}
        {warning && !error && !success && (
          <p className="mt-1 text-sm text-yellow-600">{warning}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants } 