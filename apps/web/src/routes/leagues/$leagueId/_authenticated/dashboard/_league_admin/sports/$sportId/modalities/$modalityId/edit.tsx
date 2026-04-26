import { useMemo } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ModalityForm } from "@/features/sports/components/modality-form";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import { sportDetailQueryOptions } from "@/features/sports/api/queries";
import type { Gender } from "@/types/sports";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/sports/$sportId/modalities/$modalityId/edit",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { sportId } }) => {
    void queryClient.prefetchQuery(sportDetailQueryOptions(Number(sportId)));
  },
  component: EditModalityPage,
});

function EditModalityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sportId, modalityId, leagueId } = Route.useParams();
  const sportNumber = Number(sportId);
  const modalityNumber = Number(modalityId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(sportNumber));

  const modality = useMemo(
    () => sport.modalities.find((item) => item.id === modalityNumber),
    [modalityNumber, sport.modalities],
  );

  if (!modality) {
    throw notFound();
  }

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      gender: Gender;
      category?: string;
      rules_json: Record<string, unknown>;
    }) =>
      unwrap(
        client.PATCH("/modalities/{modality_id}", {
          params: { path: { modality_id: modalityNumber } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sports.detail(sportNumber),
      });
      toast.success("Modalidade atualizada com sucesso.");
      await navigate({
        to: "/leagues/$leagueId/dashboard/sports/$sportId",
        params: { leagueId, sportId: String(sportNumber) },
      });
    },
  });

  return (
    <ModalityForm
      mode="edit"
      leagueId={Number(leagueId)}
      sportId={sportNumber}
      sportName={sport.name}
      defaultValues={modality}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
