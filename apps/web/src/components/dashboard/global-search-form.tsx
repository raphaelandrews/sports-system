import { Input } from "@sports-system/ui/components/input";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { useNavigate, useRouterState } from "@tanstack/react-router";
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
      <Field className="w-full max-w-md">
        <FieldLabel htmlFor="global-search" className="sr-only">Buscar</FieldLabel>
        <Input
          id="global-search"
          className="rounded-full px-4"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar atletas, delegações, eventos..."
        />
      </Field>
    </form>
  );
}
