import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@sports-system/ui/components/field";

import * as m from "@/paraglide/messages";

type SportRulesFormValues = {
  rules_json_text: string;
};

interface SportRulesFormProps {
  defaultRules: Record<string, unknown>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: { rules_json: Record<string, unknown> }) => Promise<void>;
}

export function SportRulesForm({
  defaultRules,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: SportRulesFormProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      rules_json_text: JSON.stringify(defaultRules, null, 2),
    } satisfies SportRulesFormValues,
    onSubmit: async ({ value }) => {
      try {
        const parsed = JSON.parse(value.rules_json_text) as Record<string, unknown>;
        setJsonError(null);
        await onSubmit({ rules_json: parsed });
      } catch {
        setJsonError(m['sport.rules.error.json']());
      }
    },
  });

  return (
    <Card className="border border-border/70">
      <CardHeader>
        <CardTitle>{m['sport.rules.title']()}</CardTitle>
        <CardDescription>{m['sport.rules.desc']()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="rules_json_text">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="sport-rules">{m['sport.rules.label']()}</FieldLabel>
                <textarea
                  id="sport-rules"
                  className="min-h-72 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldDescription>
                  {m['sport.rules.examplePrefix']()}{" "}
                  {`{"roster_size": 18, "substitutes": 7, "schedule_conflict_check": true}`}
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          {jsonError ? (
            <Alert variant="destructive">
              <AlertTitle>{m['sport.rules.alert.jsonTitle']()}</AlertTitle>
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>{m['sport.rules.alert.saveTitle']()}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? m['sport.rules.submitting']() : m['sport.rules.submit']()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
