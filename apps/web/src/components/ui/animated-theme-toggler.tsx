import { useCallback, useRef } from "react"
import { Flame, Leaf } from "lucide-react"
import { useTheme } from "next-themes"
import { flushSync } from "react-dom"

import { cn } from "@sports-system/ui/lib/utils"

import { Button } from "@sports-system/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sports-system/ui/components/tooltip"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const currentTheme = resolvedTheme === "moss" ? "moss" : "ember"
    const nextTheme = currentTheme === "moss" ? "ember" : "moss"

    if (!("startViewTransition" in document)) {
      setTheme(nextTheme)
      return
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    await transition.ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [duration, resolvedTheme, setTheme])

  const isMoss = resolvedTheme === "moss"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={buttonRef}
            onClick={toggleTheme}
            className={cn(className)}
            size="default"
            variant="default"
            {...props}
          />
        }
      >
        {isMoss ? <Leaf size={16} /> : <Flame size={16} />}
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isMoss ? "Alternar para Ember" : "Alternar para Moss"}</p>
      </TooltipContent>
    </Tooltip>
  )
}
