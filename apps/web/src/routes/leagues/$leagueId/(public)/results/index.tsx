import { useMemo, useState } from "react";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";
import { medalBoardQueryOptions } from "@/features/results/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import type { MedalBoardEntry } from "@/types/results";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/leagues/$leagueId/(public)/results/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(medalBoardQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(sportListQueryOptions()),
    ]),
  component: ResultsPage,
});

function ResultsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery({
    ...medalBoardQueryOptions(Number(leagueId)),
    refetchInterval: 30_000,
  });
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const lower = searchQuery.toLowerCase();
    return data.filter(
      (entry) =>
        entry.delegation_name.toLowerCase().includes(lower) ||
        entry.delegation_code.toLowerCase().includes(lower),
    );
  }, [data, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Title title={m["results.public.title"]()} />
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{m["results.public.badge.refresh"]()}</Badge>
            </div>
            <CardTitle className="text-3xl">{m["results.public.card.title"]()}</CardTitle>
            <CardDescription className="max-w-2xl">
              m["results.public.section.medalBoard"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickPill label={m["results.public.pill.ranking"]()} value={String(data.length)} />
            <QuickPill
              label={m["results.public.pill.golds"]()}
              value={String(data.reduce((sum, entry) => sum + entry.gold, 0))}
            />
            <QuickPill
              label={m["results.public.pill.total"]()}
              value={String(data.reduce((sum, entry) => sum + entry.total, 0))}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["results.public.card.nav.title"]()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/results/records"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              m["results.records.title"]()
            </Link>
            {sports.data.slice(0, 6).map((sport) => (
              <Link
                key={sport.id}
                to="/leagues/$leagueId/results/sports/$sportId"
                params={{ leagueId, sportId: String(sport.id) }}
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {sport.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <TableLayout
        title={m["results.public.card.title"]()}
        countLabel={m["delegations.public.title"]()}
        visibleCount={pagedData.length}
        totalCount={filteredData.length}
        searchPlaceholder={m["common.table.searchPlaceholder"]()}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPageIndex(0);
        }}
        activeFilterCount={searchQuery ? 1 : 0}
        onClearFilters={() => {
          setSearchQuery("");
          setPageIndex(0);
        }}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
      >
        <MedalBoardTable entries={pagedData} />
      </TableLayout>
    </div>
  );
}

function MedalBoardTable({ entries }: { entries: MedalBoardEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="ps-4 w-14">#</TableHead>
          <TableHead>{m["results.public.table.delegation"]()}</TableHead>
          <TableHead className="text-center">🥇</TableHead>
          <TableHead className="text-center">🥈</TableHead>
          <TableHead className="text-center">🥉</TableHead>
          <TableHead className="pe-4 text-center">{m["competition.detail.table.total"]()}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, index) => (
          <TableRow key={entry.delegation_id}>
            <TableCell className="ps-4 font-medium text-muted-foreground">{index + 1}</TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{entry.delegation_name}</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase tracking-[0.2em]"
                >
                  {entry.delegation_code}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-center font-semibold">{entry.gold}</TableCell>
            <TableCell className="text-center font-semibold">{entry.silver}</TableCell>
            <TableCell className="text-center font-semibold">{entry.bronze}</TableCell>
            <TableCell className="pe-4 text-center font-bold">{entry.total}</TableCell>
          </TableRow>
        ))}
        {entries.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              {m["results.public.empty"]()}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
