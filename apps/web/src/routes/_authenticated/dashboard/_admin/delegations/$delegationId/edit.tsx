import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/components/delegations/admin-delegation-form";
import { apiFetch, ApiError } from "@/lib/api";
import { delegationDetailQueryOptions } from "@/queries/delegations";
import { queryKeys } from "@/queries/keys";
import type { DelegationResponse, DelegationUpdateInput } from "@/types/delegations";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_admin/delegations/$delegationId/edit",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(delegationDetailQueryOptions(Number(params.delegationId)))
  },
  component: EditDelegationPage,
});

function EditDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { delegationId } = Route.useParams();
  const delegationNumber = Number(delegationId);
  const { data } = useSuspenseQuery(delegationDetailQueryOptions(delegationNumber));

  const mutation = useMutation({
    mutationFn: (payload: DelegationUpdateInput) =>
      apiFetch<DelegationResponse>(`/delegations/${delegationNumber}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.delegations.detail(delegationNumber),
        }),
      ]);
      toast.success("Delegação atualizada com sucesso.");
      await navigate({
        to: "/dashboard/delegations/$delegationId",
        params: { delegationId: String(delegationNumber) },
      });
    },
  });

  return (
    <AdminDelegationForm
      mode="edit"
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
