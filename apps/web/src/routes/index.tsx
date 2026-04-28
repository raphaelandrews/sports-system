import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { buttonVariants } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const { session } = Route.useRouteContext();

  const latestLeagues = [...leagues]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 9);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Sports</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Crie, participe e acompanhe ligas esportivas
        </p>
        {session && (
          <div className="pt-2">
            <Link to="/leagues/new" className={cn(buttonVariants())}>
              Criar sua liga
            </Link>
          </div>
        )}
      </section>

      {latestLeagues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ligas</h2>
            <Link
              to="/leagues"
              className="font-medium text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestLeagues.map((league) => (
              <LeagueInfoCard
                key={league.id}
                icon={CalendarDays}
                label={league.name}
                value={league.member_count}
                valueLabel="membros"
                to="/leagues/$leagueId"
                params={{ leagueId: String(league.id) }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

type LeagueInfoCardBaseProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  description?: string;
  valueLabel?: string;
  cta?: string;
};

type LeagueInfoCardProps =
  | (LeagueInfoCardBaseProps & {
      to: "/leagues/$leagueId";
      params: { leagueId: string };
    })
  | (LeagueInfoCardBaseProps & {
      to?: undefined;
      params?: undefined;
    });

function LeagueInfoCard({ icon: Icon, label, value, to, params }: LeagueInfoCardProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl bg-surface-1 px-3.5 py-3 transition-colors hover:bg-surface-2">
      <div className="flex shrink-0 items-center justify-center text-muted-foreground">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold tabular-nums leading-tight">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{value} membros</p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} params={params} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
