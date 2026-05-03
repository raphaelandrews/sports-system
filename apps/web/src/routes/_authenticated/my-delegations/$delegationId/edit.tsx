import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/features/delegations/components/admin-delegation-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { myDelegationsQueryOptions } from "@/features/delegations/api/queries";
import { queryKeys } from "@/features/keys";
import type { DelegationUpdateInput } from "@/types/delegations";

export const Route = createFileRoute(
  "/_authenticated/my-delegations/$delegationId/edit",
)({
  ssr: false,
  component: EditMyDelegationPage,
});

function EditMyDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { delegationId } = Route.useParams();
  const numericDelegationId = Number(delegationId);

  const { data: delegations } = useSuspenseQuery(myDelegationsQueryOptions());
  const delegation = delegations.find((d) => d.id === numericDelegationId);

  if (!delegation) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted-foreground">Delegação não encontrada.</p>
      </div>
    );
  }

  const mutation = useMutation({
    mutationFn: (payload: DelegationUpdateInput) =>
      unwrap(
        client.PATCH("/delegations/{delegation_id}", {
          params: { path: { delegation_id: numericDelegationId } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.my(),
      });
      toast.success("Delegação atualizada com sucesso.");
      await navigate({ to: "/my-delegations" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao atualizar delegação.");
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Editar delegação</h1>
      <AdminDelegationForm
        mode="edit"
        leagueId={0}
        defaultValues={{
          name: delegation.name,
          code: delegation.code,
          flag_url: delegation.flag_url ?? "",
        }}
        isSubmitting={mutation.isPending}
        errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
        onSubmit={async (value) => {
          await mutation.mutateAsync(value as DelegationUpdateInput);
        }}
      />
    </div>
  );
}
