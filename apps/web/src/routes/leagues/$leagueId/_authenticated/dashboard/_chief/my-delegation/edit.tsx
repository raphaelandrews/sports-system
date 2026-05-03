import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/features/delegations/components/admin-delegation-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { delegationDetailQueryOptions, delegationListQueryOptions } from "@/features/delegations/api/queries";
import { findManagedDelegation } from "@/shared/lib/chief-delegation";
import { queryKeys } from "@/features/keys";
import type { DelegationUpdateInput } from "@/types/delegations";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_chief/my-delegation/edit",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session }, params: { leagueId } }) => {
    const delegations = await queryClient.ensureQueryData(
      delegationListQueryOptions(Number(leagueId)),
    );
    const managed = findManagedDelegation(delegations.data, session!);
    if (managed) {
      void queryClient.prefetchQuery(
        delegationDetailQueryOptions(Number(leagueId), managed.id),
      );
    }
  },
  component: EditMyDelegationPage,
});

function EditMyDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const { data: delegations } = useSuspenseQuery(
    delegationListQueryOptions(Number(leagueId)),
  );
  const delegation = findManagedDelegation(delegations.data, session!);

  if (!delegation) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted-foreground">Você não gerencia nenhuma delegação.</p>
      </div>
    );
  }

  const { data: detail } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(leagueId), delegation.id),
  );

  const mutation = useMutation({
    mutationFn: (payload: DelegationUpdateInput) =>
      unwrap(
        client.PATCH("/leagues/{league_id}/delegations/{delegation_id}", {
          params: {
            path: { league_id: Number(leagueId), delegation_id: delegation.id },
          },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.all(Number(leagueId)),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.detail(Number(leagueId), delegation.id),
        }),
      ]);
      toast.success("Delegação atualizada com sucesso.");
      await navigate({
        to: "/leagues/$leagueId/dashboard/my-delegation",
        params: { leagueId },
      });
    },
  });

  return (
    <AdminDelegationForm
      mode="edit"
      leagueId={Number(leagueId)}
      defaultValues={{
        name: detail.name,
        code: detail.code,
        flag_url: detail.flag_url ?? "",
      }}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value as DelegationUpdateInput);
      }}
    />
  );
}
