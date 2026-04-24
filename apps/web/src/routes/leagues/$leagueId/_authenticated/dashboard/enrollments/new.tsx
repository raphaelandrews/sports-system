import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import { findManagedDelegation } from "@/lib/chief-delegation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/date";
import { resolveRosterSize } from "@/lib/sports";
import { athleteListQueryOptions } from "@/queries/athletes";
import { competitionListQueryOptions } from "@/queries/competitions";
import { delegationListQueryOptions } from "@/queries/delegations";
import { enrollmentListQueryOptions } from "@/queries/enrollments";
import { allEventsQueryOptions } from "@/queries/events";
import { queryKeys } from "@/queries/keys";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/queries/sports";
import type { CompetitionResponse } from "@/types/competitions";
import type { EnrollmentCreate } from "@/types/enrollments";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/enrollments/new")(
  {
    ssr: false,
    beforeLoad: ({ context, params }) => {
      if (
        !context.session ||
        (context.session.role !== "CHIEF" && context.session.role !== "ADMIN")
      ) {
        throw redirect({
          to: "/leagues/$leagueId/dashboard",
          params: { leagueId: params.leagueId },
        });
      }
    },
    loader: ({ context: { queryClient }, params: { leagueId } }) => {
      void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
      void queryClient.prefetchQuery(allEventsQueryOptions(Number(leagueId), { per_page: 200 }));
      void queryClient.prefetchQuery(athleteListQueryOptions(Number(leagueId), { per_page: 500 }));
      void queryClient.prefetchQuery(delegationListQueryOptions(Number(leagueId)));
      void queryClient.prefetchQuery(
        enrollmentListQueryOptions(Number(leagueId), { per_page: 200 }),
      );
      void queryClient.prefetchQuery(sportListQueryOptions());
    },
    component: NewEnrollmentPage,
  },
);

function NewEnrollmentPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = session!.role === "ADMIN";

  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: athletesData } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId), { per_page: 500 }),
  );
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const { data: enrollmentsData } = useSuspenseQuery(
    enrollmentListQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });

  const managedDelegation = findManagedDelegation(delegationsData.data, session!);
  const defaultCompetition =
    competitionsData.data.find((competition) => !isEnrollmentLocked(competition)) ??
    competitionsData.data[0] ??
    null;
  const [weekId, setWeekId] = useState<string>(
    defaultCompetition ? String(defaultCompetition.id) : "",
  );
  const [sportId, setSportId] = useState<string>("ALL");
  const [eventId, setEventId] = useState<string>("");
  const [athleteId, setAthleteId] = useState<string>("");
  const [delegationId, setDelegationId] = useState<string>(
    managedDelegation ? String(managedDelegation.id) : "",
  );
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const competitionById = useMemo(
    () => new Map(competitionsData.data.map((competition) => [competition.id, competition])),
    [competitionsData.data],
  );
  const athleteById = useMemo(
    () => new Map(athletesData.data.map((athlete) => [athlete.id, athlete])),
    [athletesData.data],
  );
  const modalityById = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, modality] as const),
        ),
      ),
    [sportDetails],
  );
  const sportByModalityId = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, detail.data] as const),
        ),
      ),
    [sportDetails],
  );

  const selectableEvents = useMemo(() => {
    return eventsData.data
      .filter((event) => (weekId ? event.competition_id === Number(weekId) : true))
      .filter((event) => {
        if (sportId === "ALL") {
          return true;
        }
        const sport = sportByModalityId.get(event.modality_id);
        return sport?.id === Number(sportId);
      })
      .sort((a, b) =>
        `${a.event_date}T${a.start_time}`.localeCompare(`${b.event_date}T${b.start_time}`),
      );
  }, [eventsData.data, sportByModalityId, sportId, weekId]);

  const selectedEvent = selectableEvents.find((event) => event.id === Number(eventId)) ?? null;
  const selectedCompetition = selectedEvent
    ? (competitionById.get(selectedEvent.competition_id) ?? null)
    : (competitionById.get(Number(weekId)) ?? null);
  const selectedModality = selectedEvent
    ? (modalityById.get(selectedEvent.modality_id) ?? null)
    : null;
  const selectedSport = selectedEvent
    ? (sportByModalityId.get(selectedEvent.modality_id) ?? null)
    : null;
  const selectedAthlete = athleteById.get(Number(athleteId)) ?? null;

  const localValidation = useMemo(() => {
    if (!selectedCompetition || !selectedEvent || !selectedModality || !delegationId) {
      return null;
    }

    if (isEnrollmentLocked(selectedCompetition)) {
      return {
        type: "error" as const,
        message: "Competição travada. Inscrições bloqueadas para esta agenda.",
      };
    }

    if (!selectedAthlete) {
      return {
        type: "info" as const,
        message: "Selecione um atleta para validar regras da modalidade.",
      };
    }

    const rules = selectedModality.rules_json;
    const delegationNumber = Number(delegationId);
    const activeEventEnrollments = enrollmentsData.data.filter(
      (item) =>
        item.event_id === selectedEvent.id &&
        item.delegation_id === delegationNumber &&
        (item.status === "PENDING" || item.status === "APPROVED"),
    );

    if (
      enrollmentsData.data.some(
        (item) =>
          item.event_id === selectedEvent.id &&
          item.athlete_id === selectedAthlete.id &&
          item.status !== "REJECTED",
      )
    ) {
      return {
        type: "error" as const,
        message: "Atleta já inscrito neste evento.",
      };
    }

    const maxAthletes = resolveRosterSize(
      selectedSport?.player_count,
      rules,
      selectedSport?.rules_json,
    );
    if (maxAthletes != null && activeEventEnrollments.length >= maxAthletes) {
      return {
        type: "error" as const,
        message: `Limite de atletas por delegação atingido (${maxAthletes}).`,
      };
    }

    const requiredGender = typeof rules.gender === "string" ? rules.gender : null;
    if (requiredGender && requiredGender !== "MIXED") {
      if (!selectedAthlete.gender) {
        return {
          type: "error" as const,
          message: "Modalidade exige gênero definido no cadastro do atleta.",
        };
      }

      if (selectedAthlete.gender !== requiredGender) {
        return {
          type: "error" as const,
          message: `Modalidade exige gênero ${requiredGender}.`,
        };
      }
    }

    if (rules.schedule_conflict_check) {
      const conflicting = enrollmentsData.data.find((item) => {
        if (item.athlete_id !== selectedAthlete.id || item.status === "REJECTED") {
          return false;
        }

        const otherEvent = eventsData.data.find((event) => event.id === item.event_id);
        return (
          otherEvent != null &&
          otherEvent.id !== selectedEvent.id &&
          otherEvent.event_date === selectedEvent.event_date &&
          otherEvent.start_time === selectedEvent.start_time
        );
      });

      if (conflicting) {
        return {
          type: "error" as const,
          message: "Atleta já possui inscrição em outro evento no mesmo horário.",
        };
      }
    }

    return {
      type: "success" as const,
      message: "Validação local sem conflitos conhecidos. Backend fará a checagem final.",
    };
  }, [
    delegationId,
    enrollmentsData.data,
    eventsData.data,
    selectedAthlete,
    selectedEvent,
    selectedModality,
    selectedCompetition,
  ]);

  const mutation = useMutation({
    mutationFn: async (payload: EnrollmentCreate) =>
      apiFetch("/enrollments", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.enrollments.all(Number(leagueId)),
      });
      toast.success("Inscrição criada com sucesso.");
      await navigate({ to: "/leagues/$leagueId/dashboard/enrollments", params: { leagueId } });
    },
    onError: (error) => {
      setLocalMessage(error instanceof ApiError ? error.message : "Falha ao criar inscrição.");
    },
  });

  const submitBlocked =
    !selectedEvent ||
    !selectedAthlete ||
    !delegationId ||
    isEnrollmentLocked(selectedCompetition) ||
    localValidation?.type === "error";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.18))]">
        <CardHeader>
          <CardTitle>Nova inscrição</CardTitle>
          <CardDescription>
            Selecione competição, esporte, evento e atleta. Regras locais são validadas antes do
            envio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setLocalMessage(null);

              if (!selectedEvent || !selectedAthlete || !delegationId || submitBlocked) {
                return;
              }

              void mutation.mutateAsync({
                athlete_id: selectedAthlete.id,
                event_id: selectedEvent.id,
                delegation_id: Number(delegationId),
              });
            }}
          >
            <FieldGroup>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel>Competição</FieldLabel>
                  <Select value={weekId} onValueChange={(value) => setWeekId(value ?? "")}>
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
                  <FieldLabel>Esporte</FieldLabel>
                  <Select value={sportId} onValueChange={(value) => setSportId(value ?? "ALL")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {sportsData.data.map((sport) => (
                        <SelectItem key={sport.id} value={String(sport.id)}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Evento</FieldLabel>
                  <Select
                    value={eventId}
                    onValueChange={(value) => {
                      setEventId(value ?? "");
                      setAthleteId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableEvents.map((event) => {
                        const modality = modalityById.get(event.modality_id);
                        const sport = sportByModalityId.get(event.modality_id);
                        const competition = competitionById.get(event.competition_id);
                        const locked = competition ? isEnrollmentLocked(competition) : false;

                        return (
                          <SelectItem key={event.id} value={String(event.id)}>
                            {modality?.name ?? `Evento #${event.id}`} · {sport?.name ?? "Esporte"} ·{" "}
                            {formatDate(event.event_date)} · {formatTime(event.start_time)}
                            {locked ? " · bloqueado" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Eventos em competições travadas ficam visualmente bloqueados no envio.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Delegação</FieldLabel>
                  <Select
                    value={delegationId}
                    onValueChange={(value) => setDelegationId(value ?? "")}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a delegação" />
                    </SelectTrigger>
                    <SelectContent>
                      {delegationsData.data.map((delegation) => (
                        <SelectItem key={delegation.id} value={String(delegation.id)}>
                          {delegation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel>Atleta</FieldLabel>
                <Select value={athleteId} onValueChange={(value) => setAthleteId(value ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletesData.data.map((athlete) => (
                      <SelectItem key={athlete.id} value={String(athlete.id)}>
                        {athlete.name} · {athlete.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border border-border/70">
                <CardHeader>
                  <CardTitle className="text-base">Resumo da seleção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <SummaryRow
                    label="Competição"
                    value={
                      selectedCompetition
                        ? `#${selectedCompetition.number} · ${selectedCompetition.status}`
                        : "—"
                    }
                  />
                  <SummaryRow label="Esporte" value={selectedSport?.name ?? "—"} />
                  <SummaryRow label="Modalidade" value={selectedModality?.name ?? "—"} />
                  <SummaryRow
                    label="Evento"
                    value={
                      selectedEvent
                        ? `${formatDate(selectedEvent.event_date)} · ${formatTime(selectedEvent.start_time)}`
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Atleta"
                    value={
                      selectedAthlete ? `${selectedAthlete.name} · ${selectedAthlete.code}` : "—"
                    }
                  />
                </CardContent>
              </Card>

              <Card className="border border-border/70">
                <CardHeader>
                  <CardTitle className="text-base">Validação em tempo real</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCompetition && isEnrollmentLocked(selectedCompetition) ? (
                    <Alert variant="destructive">
                      <ShieldAlert className="size-4" />
                      <AlertTitle>Competição travada</AlertTitle>
                      <AlertDescription>
                        Inscrições bloqueadas quando a competição está LOCKED, ACTIVE ou COMPLETED.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {localValidation ? (
                    <Alert variant={localValidation.type === "error" ? "destructive" : "default"}>
                      <AlertTitle>
                        {localValidation.type === "success"
                          ? "Pré-validação ok"
                          : "Ajuste necessário"}
                      </AlertTitle>
                      <AlertDescription>{localValidation.message}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                      Selecione evento e atleta para avaliar regras da modalidade.
                    </div>
                  )}

                  {localMessage ? (
                    <Alert variant="destructive">
                      <AlertTitle>Falha no envio</AlertTitle>
                      <AlertDescription>{localMessage}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={mutation.isPending || submitBlocked}>
                {mutation.isPending ? "Enviando..." : "Criar inscrição"}
              </Button>
              <Link
                to="/leagues/$leagueId/dashboard/enrollments"
                params={{ leagueId }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Voltar para lista
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/25 px-3 py-2">
      <span>{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function isEnrollmentLocked(competition: CompetitionResponse | null) {
  return (
    competition?.status === "LOCKED" ||
    competition?.status === "ACTIVE" ||
    competition?.status === "COMPLETED"
  );
}
