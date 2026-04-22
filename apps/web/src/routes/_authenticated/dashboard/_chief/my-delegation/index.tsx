import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { buttonVariants } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";
import { CalendarDays, ShieldCheck, UserPlus, Users } from "lucide-react";

import {
  ChiefDelegationShell,
  ChiefDelegationUnavailable,
} from "@/components/delegations/chief-delegation-shell";
import { findManagedDelegation, isTransferWindowOpen } from "@/lib/chief-delegation";
import { formatDate, formatEventDate } from "@/lib/date";
import {
  delegationDetailQueryOptions,
  delegationInvitesQueryOptions,
  delegationListQueryOptions,
} from "@/queries/delegations";
import { weekListQueryOptions } from "@/queries/weeks";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_chief/my-delegation/",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session } }) => {
    const delegations = await queryClient.ensureQueryData(delegationListQueryOptions());
    const managed = findManagedDelegation(delegations.data, session);

    void queryClient.prefetchQuery(weekListQueryOptions())

    if (!managed) {
      return { delegationId: null };
    }

    void queryClient.prefetchQuery(delegationDetailQueryOptions(managed.id))
    void queryClient.prefetchQuery(delegationInvitesQueryOptions(managed.id))

    return { delegationId: managed.id };
  },
  component: MyDelegationOverviewPage,
});

function MyDelegationOverviewPage() {
  const { session } = Route.useRouteContext();
  const { delegationId } = Route.useLoaderData();
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions());
  const { data: weeks } = useSuspenseQuery(weekListQueryOptions());
  const delegation = findManagedDelegation(delegations.data, session);

  if (!delegation || !delegationId) {
    return (
      <ChiefDelegationShell
        title="Minha delegacao"
        description="Visao do chefe sobre estrutura atual, convites e janela operacional."
        delegation={delegation}
      >
        <ChiefDelegationUnavailable />
      </ChiefDelegationShell>
    );
  }

  const { data: detail } = useSuspenseQuery(delegationDetailQueryOptions(delegationId));
  const { data: invites } = useSuspenseQuery(delegationInvitesQueryOptions(delegationId));

  const activeWeek =
    weeks.data.find((week) => week.status === "ACTIVE") ??
    weeks.data.find((week) => week.status === "LOCKED") ??
    weeks.data.find((week) => week.status === "SCHEDULED") ??
    null;

  const activeMembers = detail.members.filter((member) => !member.left_at);
  const transferOpen = isTransferWindowOpen();

  return (
    <ChiefDelegationShell
      title="Minha delegacao"
      description="Resumo operacional do chefe para acompanhar composicao atual, convites em aberto e estado da semana."
      delegation={delegation}
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          icon={Users}
          label="Membros ativos"
          value={String(activeMembers.length)}
          hint="Equipe com vinculo vigente"
        />
        <OverviewStat
          icon={UserPlus}
          label="Convites pendentes"
          value={String(invites.length)}
          hint="Aguardando resposta"
        />
        <OverviewStat
          icon={ShieldCheck}
          label="Janela de transferencia"
          value={transferOpen ? "Aberta" : "Fechada"}
          hint="Regras em America/Sao_Paulo"
        />
        <OverviewStat
          icon={CalendarDays}
          label="Semana atual"
          value={activeWeek ? `#${activeWeek.week_number}` : "—"}
          hint={activeWeek ? activeWeek.status : "Sem semana ativa"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Equipe atual</CardTitle>
            <CardDescription>
              Recorte rapido dos membros com vinculo ativo nesta delegacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMembers.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-border/70 bg-muted/25 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{member.user_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Usuario #{member.user_id}
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Desde {formatEventDate(member.joined_at, { dateStyle: "medium" })}
                </div>
              </div>
            ))}
            {activeMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                Nenhum membro ativo ainda.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Proximos passos</CardTitle>
            <CardDescription>
              Atalhos mais usados pelo chefe durante a preparacao da delegacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/dashboard/my-delegation/members"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              Ver membros e convites
            </Link>
            <Link
              to="/dashboard/my-delegation/invite"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              Enviar novo convite
            </Link>
            <Link
              to="/dashboard/my-delegation/transfers"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              Abrir painel de transferencias
            </Link>
            <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
              Criada em {formatEventDate(delegation.created_at, { dateStyle: "long" })}.
            </div>
            {activeWeek ? (
              <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
                Semana #{activeWeek.week_number}: {formatDate(activeWeek.start_date)} ate{" "}
                {formatDate(activeWeek.end_date)}.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </ChiefDelegationShell>
  );
}

function OverviewStat({
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
