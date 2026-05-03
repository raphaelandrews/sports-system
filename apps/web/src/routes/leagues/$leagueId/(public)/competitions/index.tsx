import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { Checkbox } from "@sports-system/ui/components/checkbox";
import { Label } from "@sports-system/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@sports-system/ui/components/popover";
import { Separator } from "@sports-system/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import {
  CircleIcon,
  CircleDotIcon,
  CircleDashedIcon,
  CheckIcon,
  FunnelIcon,
} from "lucide-react";

import * as m from "@/paraglide/messages";
import { formatDate } from "@/shared/lib/date";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { CompetitionStatus } from "@/types/competitions";
import { TableLayout } from "@/shared/components/ui/table-layout";

export const Route = createFileRoute("/leagues/$leagueId/(public)/competitions/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
  component: CompetitionsPage,
});

const STATUS_META: Record<
  CompetitionStatus,
  { label: string; icon: typeof CheckIcon; cls: string }
> = {
  DRAFT: { label: m['common.status.draft'](), icon: CircleIcon, cls: "text-muted-foreground" },
  SCHEDULED: { label: m['common.status.scheduled'](), icon: CircleDotIcon, cls: "text-sky-500" },
  LOCKED: { label: m['common.status.locked'](), icon: CircleDashedIcon, cls: "text-amber-500" },
  ACTIVE: { label: m['common.status.active'](), icon: CircleDotIcon, cls: "text-emerald-500" },
  COMPLETED: { label: m['common.status.completed'](), icon: CheckIcon, cls: "text-violet-500" },
};

function CompetitionsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = data.data;

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<CompetitionStatus[]>(
    [],
  );

  const filteredData = useMemo(() => {
    let data = [...competitions];

    if (selectedStatuses.length > 0) {
      data = data.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const haystack = [
          String(item.number),
          formatDate(item.start_date),
          formatDate(item.end_date),
          STATUS_META[item.status].label,
          String(item.sport_focus.length),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    }

    return data.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );
  }, [competitions, selectedStatuses, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  const statusCounts = useMemo(() => {
    return competitions.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [competitions]);

  const toggleStatus = (status: CompetitionStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((v) => v !== status)
        : [...prev, status],
    );
    setPageIndex(0);
  };

  const activeFilterCount = selectedStatuses.length;

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSearchQuery("");
    setPageIndex(0);
  };

  return (
    <TableLayout
      title={m['competitions.public.title']()}
      countLabel="competições"
      visibleCount={pagedData.length}
      totalCount={filteredData.length}
      searchPlaceholder={m['common.table.searchPlaceholder']()}
      searchQuery={searchQuery}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setPageIndex(0);
      }}
      activeFilterCount={activeFilterCount}
      onClearFilters={handleClearFilters}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={setPageIndex}
      onPageSizeChange={setPageSize}
      filterActions={
        <FacetButton
          label={m['competitions.public.filter.status']()}
          icon={<FunnelIcon className="size-3.5" />}
          count={selectedStatuses.length}
          chips={selectedStatuses.map((s) => STATUS_META[s].label)}
        >
          <div className="flex flex-col p-1">
            {(
              [
                "DRAFT",
                "SCHEDULED",
                "LOCKED",
                "ACTIVE",
                "COMPLETED",
              ] as CompetitionStatus[]
            ).map((status) => {
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              return (
                <Label
                  key={status}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatus(status)}
                  />
                  <Icon className={"size-3.5 " + meta.cls} />
                  <span className="flex-1">{meta.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {statusCounts[status] ?? 0}
                  </span>
                </Label>
              );
            })}
          </div>
        </FacetButton>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="ps-4 w-40">{m['competitions.public.table.competition']()}</TableHead>
            <TableHead className="w-32">{m['competitions.public.table.period']()}</TableHead>
            <TableHead className="w-36">{m['competitions.public.table.status']()}</TableHead>
            <TableHead className="w-24">{m['competitions.public.table.sports']()}</TableHead>
            <TableHead className="pe-4 w-40 text-right">{m['competitions.public.table.actions']()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                {m['competitions.public.empty']()}
              </TableCell>
            </TableRow>
          )}
          {pagedData.map((competition) => {
            const meta = STATUS_META[competition.status];
            return (
              <TableRow key={competition.id}>
                <TableCell className="ps-4">
                  <span className="inline-flex items-center gap-2 font-mono text-muted-foreground text-xs">
                    <span className="font-medium text-foreground text-sm">
                      {m['competition.admin.badge.competition']({ 'competition.number': competition.number })}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatDate(competition.start_date)} –{" "}
                    {formatDate(competition.end_date)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      "font-mono text-[10px] " +
                      (competition.status === "DRAFT"
                        ? "border-muted-foreground/30 text-muted-foreground"
                        : competition.status === "SCHEDULED"
                          ? "border-sky-500/30 text-sky-700 dark:text-sky-400"
                          : competition.status === "LOCKED"
                            ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                            : competition.status === "ACTIVE"
                              ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                              : "border-violet-500/30 text-violet-700 dark:text-violet-400")
                    }
                  >
                    {meta.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] tabular-nums">
                    {competition.sport_focus.length}
                  </span>
                </TableCell>
                <TableCell className="pe-4 text-right">
                  <Link
                    to="/leagues/$leagueId/competitions/$competitionId"
                    params={{
                      leagueId,
                      competitionId: String(competition.id),
                    }}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {m['common.actions.view']()}
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableLayout>
  );
}

function FacetButton({
  label,
  icon,
  count,
  chips,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  chips?: string[];
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={
              count && count > 0
                ? "border-foreground/20 bg-foreground/5"
                : "border-dashed"
            }
          >
            {icon}
            {label}
            {count && count > 0 ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-3" />
                {chips && chips.length <= 2 ? (
                  chips.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      {c}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px]"
                  >
                    {count}
                  </Badge>
                )}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-60 p-0" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}
