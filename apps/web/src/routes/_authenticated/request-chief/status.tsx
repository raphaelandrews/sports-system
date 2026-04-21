import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { ApiError } from "@/lib/api";
import { formatEventDate } from "@/lib/date";
import { chiefRequestQueryOptions } from "@/queries/notifications";

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
          <Button>Enviar solicitação</Button>
        </Link>
      </div>
    );
  }

  if (!request) return null;

  const statusConfig = {
    PENDING: {
      icon: <Clock className="h-8 w-8 text-yellow-500" />,
      label: "Em análise",
      variant: "secondary" as const,
      message:
        "Sua solicitação foi recebida e está aguardando revisão do administrador.",
    },
    APPROVED: {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      label: "Aprovada",
      variant: "default" as const,
      message: `Parabéns! Sua solicitação foi aprovada. A delegação "${request.delegation_name}" foi criada e você já é o chefe.`,
    },
    REJECTED: {
      icon: <XCircle className="h-8 w-8 text-destructive" />,
      label: "Rejeitada",
      variant: "destructive" as const,
      message:
        "Sua solicitação foi rejeitada. Você pode enviar uma nova solicitação.",
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
            <p className="text-xs text-muted-foreground mb-1">
              Sua mensagem:
            </p>
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
            <Button variant="outline">Enviar nova solicitação</Button>
          </Link>
        </div>
      )}

      <div className="mt-4">
        <Link to="/dashboard">
          <Button variant="ghost" className="text-muted-foreground">
            Voltar ao dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
