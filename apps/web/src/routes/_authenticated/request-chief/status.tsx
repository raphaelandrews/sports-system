import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { ApiError } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import { chiefRequestQueryOptions } from "@/features/notifications/api/queries";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/_authenticated/request-chief/status")({
  component: RequestChiefStatusPage,
});

function RequestChiefStatusPage() {
  const { data: request, isLoading, error } = useQuery(chiefRequestQueryOptions());

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-10">
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Carregando...
        </div>
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Status da solicitação</h1>
        <p className="text-muted-foreground text-sm">
          Você ainda não enviou uma solicitação de chefe de delegação.
        </p>
        <Link to="/request-chief">
          <Button>{m["common.actions.submit"]()}</Button>
        </Link>
      </div>
    );
  }

  if (!request) return null;

  const statusConfig = {
    PENDING: {
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      label: m["common.status.pending"](),
      variant: "secondary" as const,
      message: m["chief.shell.alert.desc"](),
    },
    APPROVED: {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      label: m["common.status.approved"](),
      variant: "default" as const,
      message: `Parabéns! Sua solicitação foi aprovada. A delegação "${request.delegation_name}" foi criada e você já é o chefe.`,
    },
    REJECTED: {
      icon: <XCircle className="h-8 w-8 text-destructive" />,
      label: m["common.status.rejected"](),
      variant: "destructive" as const,
      message: m["chief.shell.unavailable"](),
    },
  };

  const config = statusConfig[request.status];

  return (
    <div className="container mx-auto max-w-lg px-4 py-10">
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-semibold">Status da solicitação</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe o andamento da sua solicitação de chefe de delegação.
        </p>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          {config.icon}
          <div>
            <p className="font-medium text-lg">{request.delegation_name}</p>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{config.message}</p>

        {request.message && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Sua mensagem:</p>
            <p className="text-sm">{request.message}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Enviada em {formatEventDate(request.created_at)}
        </p>
      </div>

      {request.status === "REJECTED" && (
        <div className="mt-4">
          <Link to="/request-chief">
            <Button variant="outline">{m["common.actions.submit"]()}</Button>
          </Link>
        </div>
      )}

      <div className="mt-4">
        <Link to="/leagues">
          <Button variant="ghost" className="text-muted-foreground">{m["nav.workspace.personal"]()}</Button>
        </Link>
      </div>
    </div>
  );
}
