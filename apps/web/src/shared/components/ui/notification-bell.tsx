import { Bell } from "lucide-react";
import { Button } from "@sports-system/ui/components/button";
import { Badge } from "@sports-system/ui/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@sports-system/ui/components/popover";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { queryKeys } from "@/features/keys";
import { client, unwrap } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import type { InvitePayload, NotificationResponse, NotificationType } from "@/types/notifications";

function notifTitle(type: NotificationType): string {
  switch (type) {
    case "INVITE":
      return "Convite de delegação";
    case "REQUEST_REVIEWED":
      return "Solicitação revisada";
    case "MATCH_REMINDER":
      return "Lembrete de partida";
    case "RESULT":
      return "Resultado disponível";
    case "TRANSFER":
      return "Transferência";
  }
}

function notifDescription(notif: NotificationResponse): string {
  const p = notif.payload;
  switch (notif.notification_type) {
    case "INVITE":
      return `Você foi convidado para ${p.delegation_name as string}`;
    case "REQUEST_REVIEWED":
      return p.status === "APPROVED"
        ? `Solicitação aprovada — delegação ${p.delegation_name as string} criada`
        : `Solicitação de ${p.delegation_name as string} foi rejeitada`;
    case "MATCH_REMINDER":
      return `Partida ${p.event_name as string} em 24h`;
    case "RESULT":
      return `Resultado de ${p.event_name as string} disponível`;
    case "TRANSFER":
      return p.status === "ACCEPTED"
        ? `Transferência para ${p.delegation_name as string} aceita`
        : `Transferência para ${p.delegation_name as string} recusada`;
    default:
      return "";
  }
}

interface NotificationItemProps {
  notif: NotificationResponse;
  onMarkRead: (id: number) => void;
}

function NotificationItem({ notif, onMarkRead }: NotificationItemProps) {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (inviteId: number) =>
      unwrap(
        client.POST("/invites/{invite_id}/accept", { params: { path: { invite_id: inviteId } } }),
      ),
    onSuccess: () => {
      onMarkRead(notif.id);
      void queryClient.invalidateQueries({
        queryKey: ["delegations"],
      });
    },
  });

  const refuseMutation = useMutation({
    mutationFn: (inviteId: number) =>
      unwrap(
        client.POST("/invites/{invite_id}/refuse", { params: { path: { invite_id: inviteId } } }),
      ),
    onSuccess: () => onMarkRead(notif.id),
  });

  const isInvite = notif.notification_type === "INVITE";
  const invitePayload = notif.payload as unknown as InvitePayload;

  return (
    <div
      className={`px-4 py-3 border-b last:border-0 transition-colors ${!notif.read ? "bg-muted/40" : ""
        }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none">{notifTitle(notif.notification_type)}</p>
          <p className="text-xs text-muted-foreground mt-1">{notifDescription(notif)}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {formatEventDate(notif.created_at)}
          </p>
        </div>
        {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
      </div>
      {isInvite && !notif.read && (
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => acceptMutation.mutate(invitePayload.invite_id)}
            disabled={acceptMutation.isPending || refuseMutation.isPending}
          >
            Aceitar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => refuseMutation.mutate(invitePayload.invite_id)}
            disabled={acceptMutation.isPending || refuseMutation.isPending}
          >
            Recusar
          </Button>
        </div>
      )}
    </div>
  );
}

interface NotificationBellProps {
  userId: number;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const queryClient = useQueryClient();
  const { data } = useQuery(notificationsQueryOptions(userId));

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (notifId: number) =>
      unwrap(
        client.PATCH("/users/notifications/{notification_id}/read", {
          params: { path: { notification_id: notifId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId),
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => unwrap(client.PATCH("/users/notifications/read-all")),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(userId),
      });
    },
  });

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-muted">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] pointer-events-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notificações</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
          ) : (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
