import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AthleteForm } from "@/components/athletes/athlete-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";

export const Route = createFileRoute("/_authenticated/dashboard/athletes/new")({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (context.session.role !== "ADMIN" && context.session.role !== "CHIEF") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NewAthletePage,
});

function NewAthletePage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      code: string;
      gender?: "M" | "F";
      birthdate?: string;
      user_id?: number;
    }) =>
      apiFetch("/athletes", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all() });
      toast.success("Atleta cadastrado com sucesso.");
      await navigate({ to: "/dashboard/athletes" });
    },
  });

  return (
    <AthleteForm
      mode="create"
      roleScope={session.role === "ADMIN" ? "admin" : "chief"}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
