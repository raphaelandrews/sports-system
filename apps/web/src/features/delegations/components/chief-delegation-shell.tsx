import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { cn } from "@sports-system/ui/lib/utils";
import { ArrowRight, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { getTransferWindowMessage, isTransferWindowOpen } from "@/shared/lib/chief-delegation";
import type { DelegationSummary } from "@/types/delegations";

interface ChiefDelegationShellProps {
  title: string;
  description: string;
  leagueId: string;
  delegation: DelegationSummary | null;
  children: ReactNode;
}

export function ChiefDelegationShell({
  title,
  description,
  leagueId,
  delegation,
  children,
}: ChiefDelegationShellProps) {
  const transferOpen = isTransferWindowOpen();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Fase 6</Badge>
              <Badge variant={transferOpen ? "secondary" : "outline"}>
                {transferOpen ? "Janela aberta" : "Janela fechada"}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="max-w-2xl">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {delegation ? (
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-semibold">{delegation.name}</div>
                  <Badge variant="outline" className="font-mono uppercase">
                    {delegation.code}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Base ativa para membros, convites e transferencias.
                </p>
              </div>
            ) : (
              <Alert>
                <ShieldAlert className="size-4" />
                <AlertTitle>Nenhuma delegacao vinculada</AlertTitle>
                <AlertDescription>
                  Seu usuario ainda nao aparece como chefe de uma delegacao ativa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Navegacao rapida</CardTitle>
            <CardDescription>
              Fluxo do chefe para membros, convites e janela de transferencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/dashboard/my-delegation"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              Visao geral
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/leagues/$leagueId/dashboard/my-delegation/members"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              Membros e convites
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/leagues/$leagueId/dashboard/my-delegation/invite"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              Convidar usuario
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/leagues/$leagueId/dashboard/my-delegation/transfers"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              Transferencias
              <ArrowRight className="size-4" />
            </Link>
            <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
              {getTransferWindowMessage()}
            </div>
          </CardContent>
        </Card>
      </section>

      {children}
    </div>
  );
}

export function ChiefDelegationUnavailable() {
  return (
    <Card className="border border-dashed border-border/80">
      <CardContent className="flex flex-col items-start gap-3 py-8 text-sm text-muted-foreground">
        <p>Nada para gerenciar ainda. Vincule um chefe a uma delegacao para liberar esta area.</p>
        <Link to="/request-chief/status" className={buttonVariants({ variant: "outline" })}>
          Ver status da solicitacao
        </Link>
      </CardContent>
    </Card>
  );
}

export function ChiefActionButton({
  disabled,
  pending,
  idleLabel,
  busyLabel,
  onClick,
  variant = "default",
}: {
  disabled?: boolean;
  pending?: boolean;
  idleLabel: string;
  busyLabel: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
}) {
  return (
    <Button type="button" variant={variant} disabled={disabled || pending} onClick={onClick}>
      {pending ? busyLabel : idleLabel}
    </Button>
  );
}
