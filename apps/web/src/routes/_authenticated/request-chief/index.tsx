import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { client, unwrap } from "@/shared/lib/api";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/_authenticated/request-chief/")({
  component: RequestChiefPage,
});

function RequestChiefPage() {
  const router = useRouter();

  const form = useForm({
    defaultValues: { delegation_name: "", message: "" },
    onSubmit: async ({ value }) => {
      await unwrap(
        client.POST("/requests/chief", {
          body: {
            delegation_name: value.delegation_name,
            message: value.message || undefined,
          },
        }),
      );
      toast.success(m["common.actions.confirm"]());
      await router.navigate({ to: "/leagues" });
    },
  });

  return (
    <div className="container mx-auto max-w-lg px-4 py-10">
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-semibold">Solicitar cargo de Chefe</h1>
        <p className="text-muted-foreground text-sm">
          Preencha o formulário para solicitar o cargo de chefe de delegação.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field
          name="delegation_name"
          validators={{
            onChange: ({ value }) => (!value.trim() ? m["delegation.form.error.name"]() : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor="delegation_name">{m["delegation.form.label.name"]()}</Label>
              <Input
                id="delegation_name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={m["delegation.form.placeholder.name"]()}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-destructive text-sm">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="message">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor="message">{m["notification.desc.requestRejected"]()}</Label>
              <Input
                id="message"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={m["common.actions.search"]()}
              />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.isSubmitting, s.errors] as const}>
          {([isSubmitting, errors]) => (
            <>
              {errors.length > 0 && <p className="text-destructive text-sm">{String(errors[0])}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? m["common.actions.submit"]() : m["common.actions.submit"]()}
              </Button>
            </>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
