import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bot, CalendarDays, ClipboardList, Flag, Trophy, UserCheck } from "lucide-react";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Input } from "@sports-system/ui/components/input";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import { AiGenerateButton } from "@/features/narratives/components/ai-generate-button";
import { client, unwrap } from "@/shared/lib/api";
import { formatDate, formatEventDate, formatTime } from "@/shared/lib/date";
import {
  aiGenerationHistoryQueryOptions,
  narrativeTodayQueryOptions,
} from "@/features/narratives/api/queries";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { enrollmentListQueryOptions } from "@/features/enrollments/api/queries";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { resultListQueryOptions } from "@/features/results/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import type { NarrativeResponse } from "@/types/reports";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/ai/")({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(aiGenerationHistoryQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(narrativeTodayQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(sportListQueryOptions()),
      queryClient.ensureQueryData(athleteListQueryOptions(Number(leagueId), { per_page: 1 })),
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(allEventsQueryOptions(Number(leagueId), { per_page: 200 })),
      queryClient.ensureQueryData(enrollmentListQueryOptions(Number(leagueId), { per_page: 1 })),
      queryClient.ensureQueryData(resultListQueryOptions(Number(leagueId), { per_page: 1 })),
    ]),
  component: AiControlRoomPage,
});

function AiControlRoomPage() {
  const queryClient = useQueryClient();
  const { leagueId } = Route.useParams();
  const { data: history } = useSuspenseQuery(aiGenerationHistoryQueryOptions(Number(leagueId)));
  const { data: narrative } = useSuspenseQuery(narrativeTodayQueryOptions(Number(leagueId)));
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const { data: athletes } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId), { per_page: 1 }),
  );
  const { data: competitions } = useSuspenseQuery(competitionListQueryOptions(Number(leagueId)));
  const { data: events } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: enrollments } = useSuspenseQuery(
    enrollmentListQueryOptions(Number(leagueId), { per_page: 1 }),
  );
  const { data: results } = useSuspenseQuery(
    resultListQueryOptions(Number(leagueId), { per_page: 1 }),
  );

  const activeCompetition =
    competitions.data.find(
      (competition) => competition.status === "DRAFT" || competition.status === "SCHEDULED",
    ) ??
    competitions.data[0] ??
    null;
  const candidateEvents = [...events.data].sort((a, b) =>
    `${a.event_date}T${a.start_time}`.localeCompare(`${b.event_date}T${b.start_time}`),
  );
  const defaultEvent = candidateEvents[0] ?? null;

  const [delegationCount, setDelegationCount] = useState("5");
  const [sportCount, setSportCount] = useState("3");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(
    activeCompetition ? String(activeCompetition.id) : "",
  );
  const [selectedEventId] = useState(
    defaultEvent ? String(defaultEvent.id) : "",
  );
  const [narrativeDate, setNarrativeDate] = useState(
    narrative?.narrative_date ?? new Date().toISOString().slice(0, 10),
  );

  const selectedCompetition =
    competitions.data.find((competition) => String(competition.id) === selectedCompetitionId) ??
    null;
  const selectedEvent =
    candidateEvents.find((event) => String(event.id) === selectedEventId) ?? null;

  const invalidateAiSurface = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.history(Number(leagueId)) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.ai.narrative(Number(leagueId), "today"),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.ai.narrative(Number(leagueId), narrativeDate),
      }),
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Fase 13</Badge>
              <Badge variant="secondary">Admin only</Badge>
            </div>
            <CardTitle className="text-3xl">Sala de controle da IA</CardTitle>
            <CardDescription className="max-w-2xl">
              Dispare gerações por categoria, valide o preview antes de confirmar e acompanhe o
              histórico consolidado da automação.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <HeroStat
              label="Delegações"
              value={String(delegations.data.length)}
              hint="bases disponíveis"
            />
            <HeroStat label="Atletas" value={String(athletes.meta.total)} hint="cadastros atuais" />
            <HeroStat
              label="Inscrições"
              value={String(enrollments.meta.total)}
              hint="pipeline ativo"
            />
            <HeroStat
              label="Resultados"
              value={String(results.meta.total)}
              hint="registros emitidos"
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader>
            <CardTitle>Preview vivo</CardTitle>
            <CardDescription>
              Última narrativa disponível e o próximo alvo selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Narrativa atual
              </div>
              <div className="mt-2 text-sm font-medium">
                {narrative ? formatDate(narrative.narrative_date) : "Nenhuma narrativa gerada"}
              </div>
              <div className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-muted-foreground">
                {narrative?.content ??
                  "Use o card de narrativa para gerar o primeiro texto editorial do dia."}
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Próximo evento para resultados
              </div>
              <div className="mt-2 text-sm font-medium">
                {selectedEvent
                  ? `#${selectedEvent.id} · ${formatDate(selectedEvent.event_date)} · ${formatTime(selectedEvent.start_time)}`
                  : "Nenhum evento disponível"}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <GeneratorCard
            badge="Delegações"
            title="Popular delegações"
            description="Cria identidades de delegação para acelerar a fase inicial."
            icon={<Flag className="size-4" />}
            controls={
              <FieldBlock label="Quantidade">
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={delegationCount}
                  onChange={(event) => setDelegationCount(event.target.value)}
                />
              </FieldBlock>
            }
            footer={
              <AiGenerateButton
                label="Gerar delegações"
                previewTitle="Preview da geração de delegações"
                previewDescription="Confirme a quantidade e o alvo antes de enviar para a automação."
                previewItems={[
                  { label: "Endpoint", value: "/delegations/ai-generate" },
                  { label: "Quantidade", value: delegationCount || "5" },
                  { label: "Base atual", value: `${delegations.data.length} delegações` },
                  {
                    label: "Impacto",
                    value: "Novas delegações ficarão disponíveis no dashboard e no ranking",
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} delegações geradas com IA.`
                }
                errorMessage="Falha ao gerar delegações."
                onGenerate={() =>
                  unwrap(
                    client.POST("/leagues/{league_id}/delegations/ai-generate", {
                      params: {
                        path: { league_id: Number(leagueId) },
                        query: { count: Number(delegationCount || "5") },
                      },
                    }),
                  )
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.delegations.all(Number(leagueId)),
                    }),
                    invalidateAiSurface(),
                  ]);
                }}
              />
            }
          />

          <GeneratorCard
            badge="Esportes"
            title="Montar grade esportiva"
            description="Cria esportes-base para abrir modalidades e calendário."
            icon={<Trophy className="size-4" />}
            controls={
              <FieldBlock label="Quantidade">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={sportCount}
                  onChange={(event) => setSportCount(event.target.value)}
                />
              </FieldBlock>
            }
            footer={
              <AiGenerateButton
                label="Gerar esportes"
                previewTitle="Preview da geração de esportes"
                previewDescription="A automação criará esportes e abrirá caminho para modalidades e brackets."
                previewItems={[
                  { label: "Endpoint", value: "/sports/ai-generate" },
                  { label: "Quantidade", value: sportCount || "3" },
                  { label: "Base atual", value: `${sports.data.length} esportes` },
                  {
                    label: "Impacto",
                    value: "Novas modalidades poderão ser vinculadas nas próximas fases",
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} esportes gerados com IA.`
                }
                errorMessage="Falha ao gerar esportes."
                onGenerate={() =>
                  unwrap(
                    client.POST("/sports/ai-generate", {
                      params: { query: { count: Number(sportCount || "3") } },
                    }),
                  )
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: queryKeys.sports.all() }),
                    invalidateAiSurface(),
                  ]);
                }}
              />
            }
          />

          <GeneratorCard
            badge="Atletas"
            title="Criar atleta assistido"
            description="Gera um atleta por vez para completar a base competitiva."
            icon={<UserCheck className="size-4" />}
            controls={
              <MetricStrip
                label="Base atual"
                value={`${athletes.meta.total} atletas cadastrados`}
              />
            }
            footer={
              <AiGenerateButton
                label="Gerar atleta"
                previewTitle="Preview da geração de atleta"
                previewDescription="Uma nova ficha de atleta será criada e disponibilizada para vínculos futuros."
                previewItems={[
                  { label: "Endpoint", value: "/athletes/ai-generate" },
                  { label: "Lote", value: "1 atleta" },
                  { label: "Base atual", value: `${athletes.meta.total} registros` },
                  { label: "Impacto", value: "Novo atleta aparecerá na listagem administrativa" },
                ]}
                successMessage="Atleta gerado com IA."
                errorMessage="Falha ao gerar atleta."
                onGenerate={() =>
                  unwrap(
                    client.POST("/leagues/{league_id}/athletes/ai-generate", {
                      params: { path: { league_id: Number(leagueId) } },
                    }),
                  )
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.athletes.all(Number(leagueId)),
                    }),
                    invalidateAiSurface(),
                  ]);
                }}
              />
            }
          />

          <GeneratorCard
            badge="Calendário"
            title="Gerar agenda da competição"
            description="Usa a competição escolhida para montar os eventos oficiais."
            icon={<CalendarDays className="size-4" />}
            controls={
              <FieldBlock label="Competição alvo">
                <Select
                  value={selectedCompetitionId}
                  onValueChange={(value) => setSelectedCompetitionId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma competição" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.data.map((competition) => (
                      <SelectItem key={competition.id} value={String(competition.id)}>
                        Competição {competition.number} · {competition.status} ·{" "}
                        {formatDate(competition.start_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
            }
            footer={
              <AiGenerateButton
                label="Gerar calendário"
                previewTitle="Preview da geração de calendário"
                previewDescription="A IA criará eventos para a competição escolhida."
                previewItems={[
                  { label: "Endpoint", value: "/events/ai-generate" },
                  {
                    label: "Competição",
                    value: selectedCompetition
                      ? `#${selectedCompetition.number} · ${selectedCompetition.status}`
                      : "Selecione uma competição",
                  },
                  {
                    label: "Período",
                    value: selectedCompetition
                      ? `${formatDate(selectedCompetition.start_date)} até ${formatDate(selectedCompetition.end_date)}`
                      : "Sem período",
                  },
                  {
                    label: "Impacto",
                    value: "Novos eventos aparecerão no calendário admin e público",
                  },
                ]}
                disabled={!selectedCompetition}
                successMessage={(data: { length: number }) =>
                  `${data.length} eventos gerados com IA.`
                }
                errorMessage="Falha ao gerar calendário."
                onGenerate={() =>
                  unwrap(
                    client.POST("/leagues/{league_id}/events/ai-generate", {
                      params: {
                        path: { league_id: Number(leagueId) },
                        query: { competition_id: Number(selectedCompetitionId) },
                      },
                    }),
                  )
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.events.all(Number(leagueId)),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.competitions.all(Number(leagueId)),
                    }),
                    invalidateAiSurface(),
                  ]);
                }}
              />
            }
          />

          <GeneratorCard
            badge="Inscrições"
            title="Distribuir inscrições"
            description="Preenche as inscrições iniciais a partir da base atual."
            icon={<ClipboardList className="size-4" />}
            controls={
              <MetricStrip label="Fila atual" value={`${enrollments.meta.total} inscrições`} />
            }
            footer={
              <AiGenerateButton
                label="Gerar inscrições"
                previewTitle="Preview da geração de inscrições"
                previewDescription="A automação tentará inscrever atletas respeitando as regras do backend."
                previewItems={[
                  { label: "Endpoint", value: "/enrollments/ai-generate" },
                  { label: "Base atual", value: `${enrollments.meta.total} inscrições` },
                  { label: "Eventos disponíveis", value: `${candidateEvents.length} eventos` },
                  {
                    label: "Impacto",
                    value: "O backend seguirá a validação oficial antes de persistir",
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} inscrições geradas com IA.`
                }
                errorMessage="Falha ao gerar inscrições."
                onGenerate={() =>
                  unwrap(
                    client.POST("/leagues/{league_id}/enrollments/ai-generate", {
                      params: { path: { league_id: Number(leagueId) } },
                    }),
                  )
                }
                onSuccess={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.enrollments.all(Number(leagueId)),
                    }),
                    invalidateAiSurface(),
                  ]);
                }}
              />
            }
          />

          <GeneratorCard
            badge="Narrativa"
            title="Produzir narrativa editorial"
            description="Gera o texto do dia com base nas partidas concluídas."
            icon={<Bot className="size-4" />}
            controls={
              <FieldBlock label="Data da narrativa">
                <Input
                  type="date"
                  value={narrativeDate}
                  onChange={(event) => setNarrativeDate(event.target.value)}
                />
              </FieldBlock>
            }
            footer={
              <AiGenerateButton<NarrativeResponse>
                label="Gerar narrativa"
                previewTitle="Preview da geração de narrativa"
                previewDescription="A narrativa usa contexto esportivo do dia e substitui a versão já existente da mesma data."
                previewItems={[
                  { label: "Endpoint", value: "/narrative/generate" },
                  {
                    label: "Data",
                    value: narrativeDate ? formatDate(narrativeDate) : "Selecione uma data",
                  },
                  {
                    label: "Narrativa atual",
                    value: narrative
                      ? formatEventDate(narrative.generated_at, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Nenhuma geração anterior",
                  },
                  {
                    label: "Impacto",
                    value: "Atualiza o texto editorial consumido no painel de narrativa",
                  },
                ]}
                successMessage={(data) =>
                  `Narrativa gerada para ${formatDate(data.narrative_date)}.`
                }
                errorMessage="Falha ao gerar narrativa."
                onGenerate={() =>
                  unwrap(
                    client.POST("/leagues/{league_id}/narrative/generate", {
                      params: {
                        path: { league_id: Number(leagueId) },
                        query: { target_date: narrativeDate },
                      },
                    }),
                  )
                }
                onSuccess={async () => {
                  await invalidateAiSurface();
                }}
              />
            }
          />
        </div>

        <div className="space-y-4">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>Histórico recente</CardTitle>
              <CardDescription>Últimas execuções registradas pelo backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-3xl border border-border/70 bg-muted/15 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="outline">{entry.generation_type}</Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatEventDate(entry.created_at, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                      <div className="mt-3 text-lg font-semibold">{entry.count}</div>
                      <div className="text-sm text-muted-foreground">
                        item(ns) gerados nessa execução
                      </div>
                    </div>
                  ))}
                  {history.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                      Nenhuma geração registrada ainda.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>Preview detalhado</CardTitle>
              <CardDescription>
                Conteúdo mais recente da narrativa do dia para conferência rápida.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Narrativa</Badge>
                  <Badge variant="outline">
                    {narrative ? formatDate(narrative.narrative_date) : "Sem data"}
                  </Badge>
                </div>
                <div className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {narrative?.content ?? "Quando uma narrativa for gerada, o texto aparecerá aqui."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function GeneratorCard({
  badge,
  title,
  description,
  icon,
  controls,
  footer,
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  controls: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.12))]">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">{badge}</Badge>
          <div className="rounded-full border border-border/70 bg-background/80 p-2 text-muted-foreground">
            {icon}
          </div>
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {controls}
        {footer}
      </CardContent>
    </Card>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function MetricStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}
