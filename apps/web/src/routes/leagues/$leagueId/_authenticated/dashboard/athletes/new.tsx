import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import * as m from "@/paraglide/messages";
import { AthleteForm } from "@/features/athletes/components/athlete-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/athletes/new")({
  ssr: false,
  beforeLoad: ({ context, params }) => {
    if (
      !context.session ||
      (context.session.role !== "ADMIN" && context.session.role !== "CHIEF")
    ) {
      throw redirect({ to: "/leagues/$leagueId/dashboard", params: { leagueId: params.leagueId } });
    }
  },
  component: NewAthletePage,
});

function NewAthletePage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
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
      unwrap(
        client.POST("/leagues/{league_id}/athletes", {
          params: { path: { league_id: Number(leagueId) } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all(Number(leagueId)) });
      toast.success(m['athlete.form.submit']());
      await navigate({ to: "/leagues/$leagueId/dashboard/athletes", params: { leagueId } });
    },
  });

  return (
    <AthleteForm
      mode="create"
      roleScope={session!.role === "ADMIN" ? "admin" : "chief"}
      leagueId={Number(leagueId)}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
