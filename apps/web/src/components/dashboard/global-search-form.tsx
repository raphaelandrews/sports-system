import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

export function GlobalSearchForm() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const routeQuery =
    location.pathname.startsWith("/dashboard/search") && typeof location.search.q === "string"
      ? location.search.q
      : "";

  const [value, setValue] = useState(routeQuery);

  useEffect(() => {
    setValue(routeQuery);
  }, [routeQuery]);

  return (
    <form
      className="flex w-full max-w-md items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const nextQuery = value.trim();
        startTransition(() => {
          void navigate({
            to: "/dashboard/search",
            search: nextQuery ? { q: nextQuery } : {},
          });
        });
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar atletas, delegações, eventos"
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="outline">
        Buscar
      </Button>
    </form>
  );
}
