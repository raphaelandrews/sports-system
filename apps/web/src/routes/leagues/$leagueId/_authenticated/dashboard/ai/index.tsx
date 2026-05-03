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
import { MarkdownRenderer } from "@/shared/components/ui/markdown-renderer";
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
import { FieldBlock, GeneratorCard, HeroStat, MetricStrip } from "./-components";
import * as m from "@/paraglide/messages";

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
              <Badge variant="secondary">{m['ai.admin.badge.adminOnly']()}</Badge>
            </div>
            <CardTitle className="text-3xl">{m['ai.admin.title']()}</CardTitle>
            <CardDescription className="max-w-2xl">
              {m['ai.admin.description']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <HeroStat
              label={m["delegations.public.title"]() }
              value={String(delegations.data.length)}
              hint={m['ai.admin.stat.basesAvailable']()}
            />
            <HeroStat label={m['nav_athletes']()} value={String(athletes.meta.total)} hint={m['athletes.admin.stat.total']()} />
            <HeroStat
              label={m["nav.admin.enrollments"]() }
              value={String(enrollments.meta.total)}
              hint={m["enrollments.admin.stat.pending"]() }
            />
            <HeroStat
              label={m["nav.results"]() }
              value={String(results.meta.total)}
              hint={m["results.admin.stat.total"]() }
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader>
              <CardTitle>{m['ai.admin.card.preview.title']()}</CardTitle>
              <CardDescription>
                {m['ai.admin.card.preview.desc']()}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {m['ai.admin.narrative.currentLabel']()}
              </div>
              <div className="mt-2 text-sm font-medium">
                {narrative ? formatDate(narrative.narrative_date) : m["league.feed.empty"]()}
              </div>
              <div className="mt-2 line-clamp-6">
                {narrative?.content ? (
                  <MarkdownRenderer content={narrative.content} className="prose-sm" />
                ) : (
                    <p className="text-sm text-muted-foreground">
                      {m['ai.admin.narrative.emptyPrompt']()}
                    </p>
                )}
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                {m['ai.admin.nextEvent.title']()}
              </div>
              <div className="mt-2 text-sm font-medium">
                {selectedEvent
                  ? `#${selectedEvent.id} · ${formatDate(selectedEvent.event_date)} · ${formatTime(selectedEvent.start_time)}`
                  : m["calendar.admin.empty"]()}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <GeneratorCard
            badge={m["delegations.public.title"]() }
            title={m["delegation.form.title.create"]() }
            description={m["delegation.form.desc.create"]() }
            icon={<Flag className="size-4" />}
            controls={
              <FieldBlock label={m["common.actions.add"]() }>
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
                label={m["common.actions.create"]() }
                previewTitle={m["delegation.form.title.create"]() }
                previewDescription={m["common.actions.confirm"]() }
                previewItems={[
                  { label: m["common.actions.submit"](), value: "/delegations/ai-generate" },
                  { label: m["common.actions.add"](), value: delegationCount || "5" },
                  { label: m["common.actions.submit"](), value: `${delegations.data.length} ${m["delegations.public.title"]()}` },
                  {
                    label: m["common.actions.submit"](),
                    value: m["delegation.form.desc.create"](),
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} {m["delegations.public.title"]() }`
                }
                errorMessage={m["common.actions.submit"]() }
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
            badge={m["nav.sports"]() }
            title={m["sports.admin.title"]() }
            description={m["sports.admin.title"]() }
            icon={<Trophy className="size-4" />}
            controls={
              <FieldBlock label={m["common.actions.add"]() }>
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
                label={m["common.actions.create"]() }
                previewTitle={m["sports.admin.title"]() }
                previewDescription={m["sports.admin.title"]() }
                previewItems={[
                  { label: m['ai.preview.label.endpoint'](), value: "/sports/ai-generate" },
                  { label: m['ai.preview.label.quantity'](), value: sportCount || "3" },
                  { label: m['ai.preview.label.currentBase'](), value: m['ai.preview.value.sportsBase']({ count: String(sports.data.length) }) },
                  {
                    label: m['ai.preview.label.impact'](),
                    value: m["modality.form.label.name"](),
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} ${m["nav.sports"]()}`
                }
                errorMessage={m["common.actions.submit"]() }
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
            badge={m['nav_athletes']()}
            title={m["athlete.form.title.create"]() }
            description={m["athlete.form.desc.admin"]() }
            icon={<UserCheck className="size-4" />}
            controls={
              <MetricStrip
                label={m["common.actions.submit"]() }
                value={m['ai.preview.value.athletesRegistered']({ count: String(athletes.meta.total) })}
              />
            }
            footer={
              <AiGenerateButton
                label={m["athlete.form.title.create"]() }
                previewTitle={m["athlete.form.title.create"]() }
                previewDescription={m["athlete.form.desc.admin"]() }
                previewItems={[
                  { label: m['ai.preview.label.endpoint'](), value: "/athletes/ai-generate" },
                  { label: m['ai.preview.label.batch'](), value: `1 ${m['nav_athletes']()}` },
                  { label: m['ai.preview.label.currentBase'](), value: m['ai.preview.value.records']({ count: String(athletes.meta.total) }) },
                  { label: m['ai.preview.label.impact'](), value: m["athlete.form.desc.admin"]() },
                ]}
                successMessage={m["athlete.form.title.create"]() }
                errorMessage={m["common.actions.submit"]() }
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
            badge={m["nav.calendar"]() }
            title={m["calendar.admin.title"]() }
            description={m["calendar.admin.title"]() }
            icon={<CalendarDays className="size-4" />}
            controls={
              <FieldBlock label={m["competitions.public.title"]() }>
                <Select
                  value={selectedCompetitionId}
                  onValueChange={(value) => setSelectedCompetitionId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={m["calendar.admin.selectCompetition"]() } />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions.data.map((competition) => (
                      <SelectItem key={competition.id} value={String(competition.id)}>
                        {m['ai.preview.label.competition']()} {competition.number} · {competition.status} ·{" "}
                        {formatDate(competition.start_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
            }
            footer={
              <AiGenerateButton
                label={m["calendar.admin.title"]() }
                previewTitle={m["calendar.admin.title"]() }
                previewDescription={m["calendar.admin.title"]() }
                previewItems={[
                  { label: m['ai.preview.label.endpoint'](), value: "/events/ai-generate" },
                  {
                    label: m['ai.preview.label.competition'](),
                    value: selectedCompetition
                      ? `#${selectedCompetition.number} · ${selectedCompetition.status}`
                      : m["calendar.admin.selectCompetition"](),
                  },
                  {
                    label: m['ai.preview.label.period'](),
                    value: selectedCompetition
                      ? `${formatDate(selectedCompetition.start_date)} ${m['common.until']()} ${formatDate(selectedCompetition.end_date)}`
                      : m["competition.form.label.end"](),
                  },
                  {
                    label: m['ai.preview.label.impact'](),
                    value: m["calendar.admin.title"](),
                  },
                ]}
                disabled={!selectedCompetition}
                successMessage={(data: { length: number }) =>
                  m['ai.preview.value.eventsGenerated']({ count: String(data.length) })
                }
                errorMessage={m["common.actions.submit"]() }
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
            badge={m["nav.admin.enrollments"]() }
            title={m["enrollments.admin.title"]() }
            description={m["enrollments.admin.title"]() }
            icon={<ClipboardList className="size-4" />}
            controls={
              <MetricStrip label={m["enrollments.admin.stat.pending"]() } value={`${enrollments.meta.total} inscrições`} />
            }
            footer={
              <AiGenerateButton
                label={m["common.actions.create"]() }
                previewTitle={m["enrollments.admin.title"]() }
                previewDescription={m["enrollments.admin.title"]() }
                previewItems={[
                  { label: m['ai.preview.label.endpoint'](), value: "/enrollments/ai-generate" },
                  { label: m['ai.preview.label.currentBase'](), value: m['ai.preview.value.records']({ count: String(enrollments.meta.total) }) },
                  { label: m['ai.preview.label.availableEvents'](), value: m['ai.preview.value.availableEvents']({ count: String(candidateEvents.length) }) },
                  {
                    label: m['ai.preview.label.impact'](),
                    value: m["common.actions.confirm"](),
                  },
                ]}
                successMessage={(data: { length: number }) =>
                  `${data.length} ${m["nav.admin.enrollments"]()}`
                }
                errorMessage={m["common.actions.submit"]() }
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
            badge={m["league.feed.title"]() }
            title={m["league.feed.title"]() }
            description={m["league.feed.title"]() }
            icon={<Bot className="size-4" />}
            controls={
              <FieldBlock label={m["calendar.public.table.date"]() }>
                <Input
                  type="date"
                  value={narrativeDate}
                  onChange={(event) => setNarrativeDate(event.target.value)}
                />
              </FieldBlock>
            }
            footer={
              <AiGenerateButton<NarrativeResponse>
                label={m["league.feed.title"]() }
                previewTitle={m["league.feed.title"]() }
                previewDescription={m["league.feed.title"]() }
                previewItems={[
                  { label: m['ai.preview.label.endpoint'](), value: "/narrative/generate" },
                  {
                    label: m['ai.preview.label.date'](),
                    value: narrativeDate ? formatDate(narrativeDate) : m["calendar.public.table.date"](),
                  },
                  {
                    label: m['league.feed.title']() + ' ' + m['common.current'](),
                    value: narrative
                      ? formatEventDate(narrative.generated_at, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : m["league.feed.empty"](),
                  },
                  {
                    label: m['common.impact'](),
                    value: m["league.feed.title"](),
                  },
                ]}
                successMessage={(data) =>
                  m['ai.preview.success.narrativeGenerated']({ title: m['league.feed.title'](), date: formatDate(data.narrative_date) })
                }
                errorMessage={m["common.actions.submit"]() }
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
              <CardTitle>{m["league.feed.title"]()}</CardTitle>
              <CardDescription>{m["chief.shell.delegationDesc"]()}</CardDescription>
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
                        {m["league.feed.pill.items"]() }
                      </div>
                    </div>
                  ))}
                  {history.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                      {m["league.feed.empty"]() }
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>{m["league.feed.title"]()}</CardTitle>
              <CardDescription>
                {m["league.feed.title"]()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{m["league.feed.title"]() }</Badge>
                  <Badge variant="outline">
                    {narrative ? formatDate(narrative.narrative_date) : m["calendar.admin.empty"]()}
                  </Badge>
                </div>
                <div className="max-h-72 overflow-auto">
                  {narrative?.content ? (
                    <MarkdownRenderer content={narrative.content} className="prose-sm" />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {m["league.feed.empty"]()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}


