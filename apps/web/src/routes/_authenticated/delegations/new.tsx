import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AdminDelegationForm } from "@/features/delegations/components/admin-delegation-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";

export const Route = createFileRoute("/_authenticated/delegations/new")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: NewDelegationPage,
});

function NewDelegationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { name: string; code?: string; flag_url?: string }) =>
      unwrap(
        (client as any).POST("/delegations/independent", {
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delegations", "my"] });
      toast.success("Delegação criada com sucesso.");
      await navigate({ to: "/my-delegations" });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao criar delegação.");
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Nova delegação</h1>
      <AdminDelegationForm
        mode="create"
        leagueId={0}
        isSubmitting={mutation.isPending}
        errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
        onSubmit={async (value) => {
          await mutation.mutateAsync(value as { name: string; code?: string; flag_url?: string });
        }}
      />
    </div>
  );
}
