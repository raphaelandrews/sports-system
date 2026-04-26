import * as React from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import { apiFetch, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/features/sports/api/queries";
import type { EventCreate, EventPhase } from "@/types/events";
import type { ModalityResponse } from "@/types/sports";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/calendar/events/new",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: NewCalendarEventPage,
});

const phaseOptions: { value: EventPhase; label: string }[] = [
  { value: "GROUPS", label: "Grupos" },
  { value: "QUARTER", label: "Quartas" },
  { value: "SEMI", label: "Semifinal" },
  { value: "FINAL", label: "Final" },
  { value: "BRONZE", label: "Bronze" },
];

function NewCalendarEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { leagueId } = Route.useParams();
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });

  const modalities = sportDetails.flatMap((detail) => detail.data.modalities);
  const sportsByModalityId = new Map(
    sportDetails.flatMap((detail) =>
      detail.data.modalities.map((modality) => [modality.id, detail.data.name] as const),
    ),
  );

  const defaultCompetition = competitionsData.data[0];
  const defaultModality = modalities[0];

  const [form, setForm] = React.useState({
    competition_id: defaultCompetition ? String(defaultCompetition.id) : "",
    modality_id: defaultModality ? String(defaultModality.id) : "",
    event_date: defaultCompetition?.start_date ?? "",
    start_time: "09:00:00",
    venue: "",
    phase: "GROUPS" as EventPhase,
  });

  const mutation = useMutation({
    mutationFn: (payload: EventCreate) =>
      apiFetch("/events", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all(Number(leagueId)) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all(Number(leagueId)) }),
      ]);
      toast.success("Evento criado com sucesso.");
      await navigate({ to: "/leagues/$leagueId/calendar", params: { leagueId } });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao criar evento.");
    },
  });

  const selectedModality = modalities.find((modality) => modality.id === Number(form.modality_id));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
        <CardHeader>
          <CardTitle>Novo evento de calendario</CardTitle>
          <CardDescription>
            Cadastro manual de evento por competição, modalidade, data e fase competitiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void mutation.mutateAsync({
                competition_id: Number(form.competition_id),
                modality_id: Number(form.modality_id),
                event_date: form.event_date,
                start_time: normalizeTime(form.start_time),
                venue: form.venue || undefined,
                phase: form.phase,
              });
            }}
          >
            <FieldGroup>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>Competição</FieldLabel>
                  <Select
                    value={form.competition_id}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, competition_id: value ?? "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a competição" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitionsData.data.map((competition) => (
                        <SelectItem key={competition.id} value={String(competition.id)}>
                          Competição {competition.number} · {competition.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Modalidade</FieldLabel>
                  <Select
                    value={form.modality_id}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, modality_id: value ?? "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalities.map((modality) => (
                        <SelectItem key={modality.id} value={String(modality.id)}>
                          {sportsByModalityId.get(modality.id)} · {formatModality(modality)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModality ? (
                    <FieldDescription>
                      Categoria: {selectedModality.category ?? "aberta"}.
                    </FieldDescription>
                  ) : null}
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="event-date">Data</FieldLabel>
                  <Input
                    id="event-date"
                    type="date"
                    value={form.event_date}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, event_date: event.target.value }))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="event-time">Horario</FieldLabel>
                  <Input
                    id="event-time"
                    type="time"
                    step={60}
                    value={toInputTime(form.start_time)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, start_time: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel>Fase</FieldLabel>
                  <Select
                    value={form.phase}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, phase: value as EventPhase }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phaseOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="event-venue">Local</FieldLabel>
                  <Input
                    id="event-venue"
                    placeholder="Ginásio central, tatame 2..."
                    value={form.venue}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, venue: event.target.value }))
                    }
                  />
                </Field>
              </div>
            </FieldGroup>

            {mutation.error ? (
              <Alert variant="destructive">
                <AlertTitle>Falha ao salvar evento</AlertTitle>
                <AlertDescription>
                  {mutation.error instanceof ApiError ? mutation.error.message : "Erro inesperado."}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Criando..." : "Criar evento"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  navigate({ to: "/leagues/$leagueId/calendar", params: { leagueId } })
                }
              >
                Voltar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeTime(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function toInputTime(time: string) {
  return time.slice(0, 5);
}

function formatModality(modality: ModalityResponse) {
  return modality.category ? `${modality.name} · ${modality.category}` : modality.name;
}
