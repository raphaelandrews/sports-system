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

import type { SportResponse } from "@/types/sports";

interface CompetitionFormProps {
  sports: SportResponse[];
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
          <CardTitle>Nova competicao</CardTitle>
          <CardDescription>
            Defina numero, periodo e esportes foco para preparar a competicao.
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
                    Number(value) <= 0 ? "Informe um numero de competicao valido." : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="competition-number">Numero da competicao</FieldLabel>
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
                      <FieldLabel htmlFor="competition-start-date">Inicio</FieldLabel>
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
                      <FieldLabel htmlFor="competition-end-date">Fim</FieldLabel>
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
                <FieldLabel>Esportes foco</FieldLabel>
                <FieldDescription>
                  Opcional. Marque os esportes com prioridade para esta competicao.
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
                <AlertTitle>Nao foi possivel criar a competicao</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar competicao"}
              </Button>
              <Link
                to="/dashboard/competitions"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Cancelar e voltar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const WeekForm = CompetitionForm;
