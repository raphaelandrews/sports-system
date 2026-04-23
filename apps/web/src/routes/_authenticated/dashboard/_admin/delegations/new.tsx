import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/components/delegations/admin-delegation-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { DelegationCreateInput, DelegationResponse } from "@/types/delegations";

export const Route = createFileRoute("/_authenticated/dashboard/_admin/delegations/new")({
  ssr: false,
  component: NewDelegationPage,
});

function NewDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: DelegationCreateInput) =>
      apiFetch<DelegationResponse>("/delegations", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (delegation) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.all(),
      });
      toast.success("Delegação criada com sucesso.");
      await navigate({
        to: "/dashboard/delegations/$delegationId",
        params: { delegationId: String(delegation.id) },
      });
    },
  });

  return (
    <AdminDelegationForm
      mode="create"
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value as DelegationCreateInput);
      }}
    />
  );
}
