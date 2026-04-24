import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { cn } from "@sports-system/ui/lib/utils";

import { Button } from "@sports-system/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sports-system/ui/components/tooltip";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const currentTheme = resolvedTheme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    if (!("startViewTransition" in document)) {
      setTheme(nextTheme);
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    await transition.ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [duration, resolvedTheme, setTheme]);

  const isDark = mounted && resolvedTheme === "dark";

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
        {mounted ? isDark ? <Sun size={16} /> : <Moon size={16} /> : <Moon size={16} />}
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{mounted && isDark ? "Alternar para claro" : "Alternar para escuro"}</p>
      </TooltipContent>
    </Tooltip>
  );
};
