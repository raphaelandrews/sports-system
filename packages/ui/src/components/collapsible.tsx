import * as React from "react"

interface CollapsibleContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

function useCollapsible() {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error("useCollapsible must be used within Collapsible")
  return ctx
}

interface CollapsibleProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children?: React.ReactNode
  asChild?: boolean
}

function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  asChild,
  ...props
}: CollapsibleProps & Omit<React.ComponentProps<"div">, keyof CollapsibleProps>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  const state = open ? "open" : "closed"

  if (asChild && React.isValidElement(children)) {
    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          "data-state": state,
          ...props,
        })}
      </CollapsibleContext.Provider>
    )
  }

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div data-state={state} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
  onClick,
  asChild,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen } = useCollapsible()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(!open)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        setOpen(!open)
        const originalOnClick = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }>).props.onClick
        originalOnClick?.(e)
      },
      "data-state": open ? "open" : "closed",
    })
  }

  return (
    <button
      type="button"
      data-state={open ? "open" : "closed"}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useCollapsible()

  if (!open) return null

  return (
    <div data-state="open" className={className} {...props}>
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
