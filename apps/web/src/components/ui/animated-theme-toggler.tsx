import { Leaf, Palette, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@sports-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import { cn } from "@sports-system/ui/lib/utils";

interface AnimatedThemeTogglerProps {
  className?: string;
}

type ThemeOption = {
  id: "light" | "sunny" | "moss";
  label: string;
  icon: typeof SunMedium;
};

const THEME_OPTIONS: ThemeOption[] = [
  { id: "light", label: "Light", icon: SunMedium },
  { id: "sunny", label: "Sunny", icon: Palette },
  { id: "moss", label: "Moss", icon: Leaf },
];

export function AnimatedThemeToggler({ className }: AnimatedThemeTogglerProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const activeTheme = (resolvedTheme ?? "moss") as ThemeOption["id"];
  const activeOption = THEME_OPTIONS.find((option) => option.id === activeTheme) ?? THEME_OPTIONS[0];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn("gap-1.5", className)}
          />
        }
      >
        <ActiveIcon size={14} />
        <span className="hidden md:inline">{activeOption.label}</span>
        <span className="sr-only">Escolher tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={activeTheme}
          onValueChange={(value) => setTheme(value as ThemeOption["id"])}
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <DropdownMenuRadioItem key={option.id} value={option.id}>
                <Icon size={14} />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
