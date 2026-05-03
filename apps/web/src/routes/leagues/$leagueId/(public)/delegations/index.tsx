import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import * as m from "@/paraglide/messages";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { TableLayout } from "@/shared/components/ui/table-layout";
import { Title } from "@/shared/components/ui/title";

export const Route = createFileRoute("/leagues/$leagueId/(public)/delegations/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
  component: DelegationsPage,
});

function DelegationsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const delegations = data.data;

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return delegations;
    const lower = searchQuery.toLowerCase();
    return delegations.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower),
    );
  }, [delegations, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return (
    <>
      <Title title={m['delegations.public.title']()} />

      <TableLayout
        title={m['delegations.public.card.title']()}
        countLabel="delegações"
        visibleCount={pagedData.length}
        totalCount={filteredData.length}
        searchPlaceholder={m['common.table.searchPlaceholder']()}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4 w-32">{m['delegations.public.table.code']()}</TableHead>
              <TableHead className="pe-4">{m['delegations.public.table.name']()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-muted-foreground"
                >
                  {m['delegations.public.empty']()}
                </TableCell>
              </TableRow>
            )}
            {pagedData.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="ps-4">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {d.code}
                  </Badge>
                </TableCell>
                <TableCell className="pe-4">
                  <Link
                    to="/leagues/$leagueId/delegations/$delegationId"
                    params={{ leagueId, delegationId: String(d.id) }}
                    className="flex items-center gap-2 underline-offset-4 hover:underline"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={d.flag_url ?? ""} alt={d.name} />
                      <AvatarFallback className="text-xs">
                        {d.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{d.name}</span>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableLayout>
    </>
  );
}
