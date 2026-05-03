import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";

import * as m from "@/paraglide/messages";
import type { SportResponse } from "@/types/sports";

interface CompetitionFormProps {
  sports: SportResponse[];
  leagueId: number;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: {
    number: number;
    start_date: string;
    end_date: string;
    sport_focus: number[];
  }) => Promise<void>;
}

export function CompetitionForm({
  sports,
  leagueId,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: CompetitionFormProps) {
  const [selectedSports, setSelectedSports] = useState<number[]>([]);

  const form = useForm({
    defaultValues: {
      number: "",
      start_date: "",
      end_date: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        number: Number(value.number),
        start_date: value.start_date,
        end_date: value.end_date,
        sport_focus: selectedSports,
      });
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card className="border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader>
          <CardTitle>{m['competition.form.title']()}</CardTitle>
          <CardDescription>
            {m['competition.form.description']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="number"
                validators={{
                  onChange: ({ value }) =>
                    Number(value) <= 0 ? { message: m['competition.form.error.number']() } : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="competition-number">{m['competition.form.label.number']()}</FieldLabel>
                    <Input
                      id="competition-number"
                      type="number"
                      min="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-5 md:grid-cols-2">
                <form.Field name="start_date">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="competition-start-date">{m['competition.form.label.start']()}</FieldLabel>
                      <Input
                        id="competition-start-date"
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="end_date">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="competition-end-date">{m['competition.form.label.end']()}</FieldLabel>
                      <Input
                        id="competition-end-date"
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <Field>
                <FieldLabel>{m['competition.form.label.sports']()}</FieldLabel>
                <FieldDescription>
                  {m['competition.form.desc.sports']()}
                </FieldDescription>
                <div className="grid gap-2 md:grid-cols-2">
                  {sports.map((sport) => {
                    const checked = selectedSports.includes(sport.id);
                    return (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() =>
                          setSelectedSports((current) =>
                            checked
                              ? current.filter((id) => id !== sport.id)
                              : [...current, sport.id],
                          )
                        }
                        className={`rounded-xl border p-3 text-left text-sm transition ${
                          checked
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border/70 bg-background text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        {sport.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </FieldGroup>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>{m['competition.form.alert.error']()}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? m['competition.form.submitting']() : m['competition.form.submit']()}
              </Button>
              <Link
                to="/leagues/$leagueId/dashboard/competitions"
                params={{ leagueId: String(leagueId) }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {m['competition.form.cancel']()}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const WeekForm = CompetitionForm;
