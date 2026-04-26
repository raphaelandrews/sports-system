import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/features/delegations/components/admin-delegation-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { DelegationCreateInput } from "@/types/delegations";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/delegations/new",
)({
  ssr: false,
  component: NewDelegationPage,
});

function NewDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { leagueId } = Route.useParams();

  const mutation = useMutation({
    mutationFn: (payload: DelegationCreateInput) =>
      unwrap(
        client.POST("/leagues/{league_id}/delegations", {
          params: { path: { league_id: Number(leagueId) } },
          body: payload,
        }),
      ),
    onSuccess: async (delegation) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(Number(leagueId)),
      });
      toast.success("Delegação criada com sucesso.");
      await navigate({
        to: "/leagues/$leagueId/delegations/$delegationId",
        params: { leagueId, delegationId: String(delegation.id) },
      });
    },
  });

  return (
    <AdminDelegationForm
      mode="create"
      leagueId={Number(leagueId)}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value as DelegationCreateInput);
      }}
    />
  );
}
