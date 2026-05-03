import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import { Button } from "@sports-system/ui/components/button";
import { Globe } from "lucide-react";

import * as m from "@/paraglide/messages";
import {
  getLocale,
  locales,
  type Locale,
  localizeHref,
} from "@/paraglide/runtime";

const localeLabels: Record<Locale, string> = {
  en: m['locale.en'](),
  "pt-BR": m['locale.ptBr'](),
  es: m['locale.es'](),
};

export function LocaleSwitcher() {
  const currentLocale = getLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="size-8 hover:bg-muted">
          <Globe size={16} />
          <span className="sr-only">{m['locale.switchLabel']()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => {
          const href = localizeHref(
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/",
            { locale },
          );

          return (
            <DropdownMenuItem key={locale} className="p-0">
              <a
                href={href}
                className={`flex w-full items-center px-2 py-1.5 text-sm ${currentLocale === locale ? "font-semibold" : ""}`}
              >
                {localeLabels[locale]}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
