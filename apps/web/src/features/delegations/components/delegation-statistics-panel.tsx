import { Badge } from "@sports-system/ui/components/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sports-system/ui/components/tabs";
import { Medal, ShieldCheck, Swords, Trophy, Users } from "lucide-react";

import * as m from "@/paraglide/messages";
import { formatDate, formatEventDate } from "@/shared/lib/date";
import type { DelegationStatisticsResponse } from "@/types/delegations";

function medalLabel(type: string) {
  switch (type.toLowerCase()) {
    case 'gold':
      return m['common.medal.gold']();
    case 'silver':
      return m['common.medal.silver']();
    case 'bronze':
      return m['common.medal.bronze']();
    default:
      return type;
  }
}

export function DelegationStatisticsPanel({
  stats,
  title = m['delegation.stats.defaultTitle'](),
  description = m['delegation.stats.defaultDesc'](),
}: {
  stats: DelegationStatisticsResponse;
  title?: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Users}
          label={m['delegation.stats.label.athletes']()}
          value={String(stats.athlete_count)}
          hint={m['delegation.stats.hint.athletes']({ count: stats.active_athlete_count })}
        />
        <StatCard
          icon={Medal}
          label={m['delegation.stats.label.medals']()}
          value={String(stats.total_medals)}
          hint={`${stats.gold} ${m['delegation.stats.hint.gold']()} · ${stats.silver} ${m['delegation.stats.hint.silver']()} · ${stats.bronze} ${m['delegation.stats.hint.bronze']()}`}
        />
        <StatCard
          icon={Swords}
          label={m['delegation.stats.label.matches']()}
          value={String(stats.total_matches)}
          hint={m['delegation.stats.defaultDesc']()}
        />
        <StatCard
          icon={Trophy}
          label={m['delegation.stats.label.wins']()}
          value={String(stats.total_wins)}
          hint={m['delegation.stats.label.wins']()}
        />
        <StatCard
          icon={ShieldCheck}
          label={m['delegation.stats.label.weeks']()}
          value={String(stats.weekly_performance.length)}
          hint={m['delegation.stats.label.weeks']()}
        />
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="athletes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="athletes">{m['delegation.stats.tab.athletes']()}</TabsTrigger>
              <TabsTrigger value="medals">{m['delegation.stats.tab.medals']()}</TabsTrigger>
              <TabsTrigger value="weeks">{m['delegation.stats.tab.weeks']()}</TabsTrigger>
            </TabsList>

            <TabsContent value="athletes">
              <div className="rounded-xl border bg-card shadow-xs/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-4">{m['delegation.stats.table.athlete']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.status']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.matches']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.medals']()}</TableHead>
                      <TableHead className="pe-4">{m['delegation.stats.table.link']()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.athletes.map((athlete) => (
                      <TableRow key={athlete.athlete_id}>
                        <TableCell className="ps-4">
                          <div className="font-medium">{athlete.athlete_name}</div>
                          <div className="text-xs text-muted-foreground">{athlete.athlete_code}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={athlete.is_current_member ? "secondary" : "outline"}>
                              {athlete.is_current_member ? m['delegation.stats.badge.active']() : m['delegation.stats.badge.historic']()}
                            </Badge>
                            {!athlete.is_active ? (
                              <Badge variant="outline">{m['delegation.stats.badge.inactive']()}</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{athlete.total_matches}</TableCell>
                        <TableCell>
                          {athlete.total_medals}
                          <div className="text-xs text-muted-foreground">
                            {athlete.gold}{m['delegation.stats.abbr.gold']()} · {athlete.silver}{m['delegation.stats.abbr.silver']()} · {athlete.bronze}{m['delegation.stats.abbr.bronze']()}
                          </div>
                        </TableCell>
                        <TableCell className="pe-4 text-sm text-muted-foreground">
                          {athlete.joined_at
                            ? `${m['delegation.stats.cell.since']()} ${formatEventDate(athlete.joined_at, { dateStyle: "medium" })}`
                            : m['delegation.stats.cell.noLink']()}
                          {athlete.left_at
                            ? ` · ${m['delegation.stats.cell.until']()} ${formatEventDate(athlete.left_at, { dateStyle: "medium" })}`
                            : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.athletes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {m['delegation.stats.empty.athletes']()}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="medals">
              <div className="rounded-xl border bg-card shadow-xs/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-4">{m['delegation.stats.table.medals']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.athlete']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.match']()}</TableHead>
                      <TableHead className="pe-4">{m['delegation.stats.table.rank']()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.medals.map((medal) => (
                      <TableRow key={medal.result_id}>
                        <TableCell className="ps-4">
                          <Badge variant="outline">{medalLabel(medal.medal)}</Badge>
                        </TableCell>
                        <TableCell>{medal.athlete_name ?? m['delegation.stats.cell.delegation']()}</TableCell>
                        <TableCell>#{medal.match_id}</TableCell>
                        <TableCell className="pe-4">{medal.rank}º</TableCell>
                      </TableRow>
                    ))}
                    {stats.medals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          {m['delegation.stats.empty.medals']()}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="weeks">
              <div className="rounded-xl border bg-card shadow-xs/5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-4">{m['delegation.stats.table.competition']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.period']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.status']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.matches']()}</TableHead>
                      <TableHead>{m['delegation.stats.table.wins']()}</TableHead>
                      <TableHead className="pe-4">{m['delegation.stats.table.medals']()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.weekly_performance.map((week) => (
                      <TableRow key={week.competition_id}>
                        <TableCell className="ps-4 font-medium">#{week.number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(week.start_date)} - {formatDate(week.end_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{week.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {week.matches_played}
                          <div className="text-xs text-muted-foreground">
                            {week.matches_completed} {m['delegation.stats.cell.completed']()}
                          </div>
                        </TableCell>
                        <TableCell>{week.wins}</TableCell>
                        <TableCell className="pe-4">
                          {week.total_medals}
                          <div className="text-xs text-muted-foreground">
                            {week.gold}{m['delegation.stats.abbr.gold']()} · {week.silver}{m['delegation.stats.abbr.silver']()} · {week.bronze}{m['delegation.stats.abbr.bronze']()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.weekly_performance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {m['delegation.stats.empty.weeks']()}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border border-border/70">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
        <div className="rounded-xl bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
