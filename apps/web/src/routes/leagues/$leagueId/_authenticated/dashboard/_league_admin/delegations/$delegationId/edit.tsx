import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/features/delegations/components/admin-delegation-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { delegationDetailQueryOptions } from "@/features/delegations/api/queries";
import { queryKeys } from "@/features/keys";
import type { DelegationUpdateInput } from "@/types/delegations";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/delegations/$delegationId/edit",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId, delegationId } }) => {
    void queryClient.prefetchQuery(
      delegationDetailQueryOptions(Number(leagueId), Number(delegationId)),
    );
  },
  component: EditDelegationPage,
});

function EditDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { delegationId, leagueId } = Route.useParams();
  const delegationNumber = Number(delegationId);
  const { data } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(leagueId), delegationNumber),
  );

  const mutation = useMutation({
    mutationFn: (payload: DelegationUpdateInput) =>
      unwrap(
        client.PATCH("/leagues/{league_id}/delegations/{delegation_id}", {
          params: { path: { league_id: Number(leagueId), delegation_id: delegationNumber } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.all(Number(leagueId)),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.detail(Number(leagueId), delegationNumber),
        }),
      ]);
      toast.success(m["common.actions.update"]());
      await navigate({
        to: "/leagues/$leagueId/delegations/$delegationId",
        params: { leagueId, delegationId: String(delegationNumber) },
      });
    },
  });

  return (
    <AdminDelegationForm
      mode="edit"
      leagueId={Number(leagueId)}
      defaultValues={{
        name: data.name,
        code: data.code,
        flag_url: data.flag_url ?? "",
      }}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value as DelegationUpdateInput);
      }}
    />
  );
}
