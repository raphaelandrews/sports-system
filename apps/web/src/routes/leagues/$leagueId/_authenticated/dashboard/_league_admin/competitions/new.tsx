import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { CompetitionForm } from "@/features/competitions/components/competition-form";
import { apiFetch, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import { sportListQueryOptions } from "@/features/sports/api/queries";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/competitions/new",
)({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: NewWeekPage,
});

function NewWeekPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const { leagueId } = Route.useParams();

  const mutation = useMutation({
    mutationFn: (payload: {
      number: number;
      start_date: string;
      end_date: string;
      sport_focus: number[];
    }) =>
      apiFetch("/competitions", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.all(Number(leagueId)),
      });
      toast.success("Competicao criada com sucesso.");
      await navigate({ to: "/leagues/$leagueId/dashboard/competitions", params: { leagueId } });
    },
  });

  return (
    <CompetitionForm
      sports={sports.data}
      leagueId={Number(leagueId)}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
