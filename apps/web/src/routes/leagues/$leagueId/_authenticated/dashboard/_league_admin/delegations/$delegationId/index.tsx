import { Badge } from "@sports-system/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, CalendarDays, Flag, History, Pencil, Users } from "lucide-react";
import { useMemo } from "react";

import { formatEventDate } from "@/shared/lib/date";
import {
  delegationDetailQueryOptions,
  delegationHistoryQueryOptions,
} from "@/features/delegations/api/queries";
import { allEventsQueryOptions, eventDetailQueryOptions } from "@/features/events/api/queries";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/delegations/$delegationId/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId, delegationId } }) => {
    const id = Number(delegationId);
    void queryClient.prefetchQuery(delegationDetailQueryOptions(Number(leagueId), id));
    void queryClient.prefetchQuery(delegationHistoryQueryOptions(Number(leagueId), id));
    void queryClient.prefetchQuery(allEventsQueryOptions(Number(leagueId), { per_page: 24 }));
  },
  component: DelegationDetailPage,
});

function DelegationDetailPage() {
  const { delegationId, leagueId } = Route.useParams();
  const delegationNumber = Number(delegationId);

  const { data: delegation } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(leagueId), delegationNumber),
  );
  const { data: history } = useSuspenseQuery(
    delegationHistoryQueryOptions(Number(leagueId), delegationNumber),
  );
  const { data: events } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 24 }),
  );

  const activeMembers = delegation.members.filter((member) => !member.left_at);
  const formerMembers = delegation.members.filter((member) => member.left_at);

  const recentEventQueries = useQueries({
    queries: events.data.map((event) => eventDetailQueryOptions(Number(leagueId), event.id)),
  });

  const recentMatches = useMemo(() => {
    return recentEventQueries
      .flatMap((query, index) => {
        const event = events.data[index];
        const detail = query.data;
        if (!event || !detail) return [];

        return detail.matches
          .filter(
            (match) =>
              match.team_a_delegation_id === delegationNumber ||
              match.team_b_delegation_id === delegationNumber,
          )
          .map((match) => ({
            id: match.id,
            eventId: event.id,
            when: `${event.event_date}T${event.start_time}`,
            phase: event.phase,
            status: match.status,
            score: `${match.score_a ?? "-"} x ${match.score_b ?? "-"}`,
            side: match.team_a_delegation_id === delegationNumber ? m['result.form.label.delegationA']() : m['result.form.label.delegationB'](),
            won: match.winner_delegation_id === delegationNumber,
          }));
      })
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, 8);
  }, [delegationNumber, events.data, recentEventQueries]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono uppercase">
                {delegation.code}
              </Badge>
              <Badge variant={delegation.is_active ? "secondary" : "outline"}>
                {delegation.is_active ? m["common.status.active"]() : m["common.status.inactive"]() }
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-xl">
                <AvatarImage src={delegation.flag_url ?? ""} alt={delegation.name} />
                <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                  {delegation.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{delegation.name}</CardTitle>
            </div>
            <CardDescription className="max-w-2xl">
              m["delegation.detail.card.summary.title"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <DetailStat icon={Users} label={m["delegation.detail.section.members"]() } value={String(activeMembers.length)} />
            <DetailStat
              icon={History}
              label={m["delegation.detail.campaign.title"]() }
              value={String(history.length)}
            />
            <DetailStat
              icon={CalendarDays}
              label={m["competition.detail.stat.matches"]() }
              value={String(recentMatches.length)}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["results.admin.card.actions.title"]()}</CardTitle>
            <CardDescription>
              m["common.actions.edit"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              to="/leagues/$leagueId/dashboard/delegations/$delegationId/edit"
              params={{ leagueId, delegationId: String(delegation.id) }}
              className={buttonVariants({ variant: "default" })}
            >
              <Pencil className="size-4" />
              {m["common.actions.edit"]() }
            </Link>
            <Link
              to="/leagues/$leagueId/delegations/$delegationId"
              params={{ leagueId, delegationId: String(delegation.id) }}
              className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
            >
              <ArrowUpRight className="size-4" />
              {m["common.actions.view"]() }
            </Link>
            <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
              {m["common.actions.create"]() } {formatEventDate(delegation.created_at, { dateStyle: "long" })}.
              {delegation.chief_id
                ? ` Current chief: User #${delegation.chief_id}.`
                : ` ${m['result.form.delegation.none']()}`}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["delegation.detail.section.members"]()}</CardTitle>
            <CardDescription>
              m["delegation.detail.campaign.desc"]()
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m["delegation.detail.table.name"]() }</TableHead>
                  <TableHead>{m["delegation.detail.table.role"]() }</TableHead>
                  <TableHead>{m["athlete.detail.table.entry"]() }</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user_name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      {formatEventDate(member.joined_at, { dateStyle: "medium" })}
                    </TableCell>
                  </TableRow>
                ))}
                {activeMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      m["delegation.detail.empty.members"]()
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["delegation.detail.campaign.title"]()}</CardTitle>
            <CardDescription>
              m["delegation.detail.campaign.desc"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{item.user_name}</div>
                    <Badge variant="outline">{item.role}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {formatEventDate(item.joined_at, { dateStyle: "medium" })}
                    {" — "}
                    {item.left_at
                      ? formatEventDate(item.left_at, { dateStyle: "medium" })
                      : m['common.status.active']()}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                {m['delegation.detail.empty.former']()}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["competition.detail.stat.matches"]()}</CardTitle>
            <CardDescription>
              m["competition.detail.campaign.desc"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/25 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Flag className="size-4 text-muted-foreground" />
                      <span className="font-medium">m["competition.detail.table.match"]() #{match.id}</span>
                      <Badge variant="outline">{match.phase}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Evento #{match.eventId} • {formatEventDate(match.when)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{match.side}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold">{match.score}</span>
                    <Badge variant={match.won ? "secondary" : "outline"}>
                      {match.status === "COMPLETED"
                        ? match.won
                          ? m['common.status.approved']()
                          : m['common.status.completed']()
                        : m['common.status.scheduled']()}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                m["calendar.competition.empty.matches"]()
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["delegation.detail.empty.former"]()}</CardTitle>
            <CardDescription>
              m["delegation.detail.campaign.desc"]()
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m["delegation.detail.table.name"]() }</TableHead>
                  <TableHead>{m["athlete.detail.table.exit"]() }</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formerMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user_name}</TableCell>
                    <TableCell>
                      {member.left_at
                        ? formatEventDate(member.left_at, { dateStyle: "medium" })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {formerMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      m["delegation.detail.empty.former"]()
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
