import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Alert — brand-book §Components > Alert
 * 14×16 padding, border-inline-start 4px, 4 semantic variants.
 * Uses `border-s` (logical) so direction flips in RTL.
 */
const alertVariants = cva(
  "relative flex w-full gap-3 rounded-[var(--r-md)] border-s-4 bg-card px-4 py-3.5 text-sm text-card-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        info:
          "border-s-info bg-info/10 text-info-foreground [&>svg]:text-info dark:bg-info/20",
        success:
          "border-s-success bg-success/10 text-success-foreground [&>svg]:text-success dark:bg-success/20",
        warning:
          "border-s-warning bg-warning/15 text-warning-foreground [&>svg]:text-warning dark:bg-warning/25",
        error:
          "border-s-destructive bg-destructive/10 text-destructive-foreground [&>svg]:text-destructive dark:bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

function Alert({
  className,
  variant = "info",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold leading-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
