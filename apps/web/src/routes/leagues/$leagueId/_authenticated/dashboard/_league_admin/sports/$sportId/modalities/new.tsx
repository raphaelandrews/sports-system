import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ModalityForm } from "@/features/sports/components/modality-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import { sportDetailQueryOptions } from "@/features/sports/api/queries";
import type { Gender } from "@/types/sports";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/sports/$sportId/modalities/new",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { sportId } }) => {
    void queryClient.prefetchQuery(sportDetailQueryOptions(Number(sportId)));
  },
  component: NewModalityPage,
});

function NewModalityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sportId, leagueId } = Route.useParams();
  const sportNumber = Number(sportId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(sportNumber));

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      gender: Gender;
      category?: string;
      rules_json: Record<string, unknown>;
    }) =>
      unwrap(
        client.POST("/sports/{sport_id}/modalities", {
          params: { path: { sport_id: sportNumber } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sports.detail(sportNumber),
      });
      toast.success("Modalidade criada com sucesso.");
      await navigate({
        to: "/leagues/$leagueId/dashboard/sports/$sportId",
        params: { leagueId, sportId: String(sportNumber) },
      });
    },
  });

  return (
    <ModalityForm
      mode="create"
      leagueId={Number(leagueId)}
      sportId={sportNumber}
      sportName={sport.name}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
