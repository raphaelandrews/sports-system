import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { Search, UserPlus } from "lucide-react";

import {
  ChiefDelegationShell,
  ChiefDelegationUnavailable,
} from "@/features/delegations/components/chief-delegation-shell";
import { findManagedDelegation } from "@/shared/lib/chief-delegation";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import {
  delegationInvitesQueryOptions,
  delegationListQueryOptions,
} from "@/features/delegations/api/queries";
import { queryKeys } from "@/features/keys";
import { userSearchQueryOptions } from "@/features/users/api/queries";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_chief/my-delegation/invite",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session }, params: { leagueId } }) => {
    const delegations = await queryClient.ensureQueryData(
      delegationListQueryOptions(Number(leagueId)),
    );
    const managed = findManagedDelegation(delegations.data, session!);

    if (!managed) {
      return { delegationId: null };
    }

    void queryClient.prefetchQuery(delegationInvitesQueryOptions(Number(leagueId), managed.id));
    return { delegationId: managed.id };
  },
  component: InviteUserPage,
});

function InviteUserPage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { delegationId } = Route.useLoaderData();
  const { leagueId } = Route.useParams();
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const delegation = findManagedDelegation(delegations.data, session!);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  const inviteMutation = useMutation({
    mutationFn: async (targetUserId: number) =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations/{delegation_id}/invite", {
          params: { path: { league_id: Number(leagueId), delegation_id: delegationId! } },
          body: { user_id: targetUserId },
        }),
      ),
    onSuccess: async () => {
      if (!delegationId) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.invites(Number(leagueId), delegationId),
      });
      toast.success(m["notification.title.invite"]());
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : m["common.actions.submit"]());
    },
  });

  if (!delegation || !delegationId) {
    return (
      <ChiefDelegationShell
        title={m["chief.shell.nav.invite"]() }
        description={m["chief.shell.nav.invite"]() }
        leagueId={leagueId}
        delegation={delegation}
      >
        <ChiefDelegationUnavailable />
      </ChiefDelegationShell>
    );
  }

  const { data: invites } = useSuspenseQuery(
    delegationInvitesQueryOptions(Number(leagueId), delegationId),
  );
  const { data: searchResults = [], isFetching } = useQuery({
    ...userSearchQueryOptions(deferredSearch.trim()),
  });

  const pendingInviteIds = useMemo(
    () => new Set(invites.map((invite) => invite.user_id)),
    [invites],
  );

  const availableUsers = useMemo(
    () => searchResults.filter((user) => !pendingInviteIds.has(user.id)),
    [pendingInviteIds, searchResults],
  );

  return (
    <ChiefDelegationShell
      title={m["chief.shell.nav.invite"]() }
      description={m["search.dialogDescription"]() }
      leagueId={leagueId}
      delegation={delegation}
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["search.buttonLabel"]()}</CardTitle>
            <CardDescription>
              m["search.dialogDescription"]()
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <Search className="size-4" />
              <AlertTitle>{m["search.buttonLabel"]()}</AlertTitle>
              <AlertDescription>
                m["search.inputPlaceholder"]()
              </AlertDescription>
            </Alert>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-search">{m["search.dialogDescription"]() }</FieldLabel>
                <Input
                  id="invite-search"
                  placeholder={m["search.inputPlaceholder"]() }
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              {searchValue.trim().length < 2 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  m["search.inputPlaceholder"]()
                </div>
              ) : isFetching ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  m["search.loading"]()
                </div>
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{user.id}</Badge>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      disabled={inviteMutation.isPending}
                      onClick={() => inviteMutation.mutate(user.id)}
                    >
                      <UserPlus className="size-4" />
                      {inviteMutation.isPending ? m["common.actions.submit"]() : m["notification.title.invite"]()}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  m["search.noResults"]()
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m["notification.title.invite"]()}</CardTitle>
            <CardDescription>
              {m['chief.shell.delegationDesc']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {invites.length > 0 ? (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border border-border/70 bg-muted/25 p-4"
                  >
                    <div className="font-medium">m["nav.user.account"]() #{invite.user_id}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Enviado em {formatEventDate(invite.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  m["notification.empty"]()
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </ChiefDelegationShell>
  );
}
