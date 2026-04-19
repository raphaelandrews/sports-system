import { Field } from "@base-ui/react/field"
import * as React from "react"

import { cn } from "@sports-system/ui/lib/utils"

function Form({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form"
      className={cn("grid gap-4", className)}
      {...props}
    />
  )
}

function FormField({ className, ...props }: Field.Root.Props) {
  return (
    <Field.Root
      data-slot="form-field"
      className={cn("grid gap-1.5", className)}
      {...props}
    />
  )
}

function FormLabel({ className, ...props }: Field.Label.Props) {
  return (
    <Field.Label
      data-slot="form-label"
      className={cn(
        "flex items-center gap-2 text-xs leading-none font-medium select-none",
        className
      )}
      {...props}
    />
  )
}

function FormControl({ ...props }: Field.Control.Props) {
  return <Field.Control data-slot="form-control" {...props} />
}

function FormDescription({ className, ...props }: Field.Description.Props) {
  return (
    <Field.Description
      data-slot="form-description"
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: Field.Error.Props) {
  return (
    <Field.Error
      data-slot="form-message"
      className={cn("text-destructive text-xs font-medium", className)}
      {...props}
    />
  )
}

export { Form, FormField, FormLabel, FormControl, FormDescription, FormMessage }
