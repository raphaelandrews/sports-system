import { useMemo } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ModalityForm } from "@/components/sports/modality-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { sportDetailQueryOptions } from "@/queries/sports";
import type { Gender } from "@/types/sports";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_admin/sports/$sportId/modalities/$modalityId/edit",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(sportDetailQueryOptions(Number(params.sportId))),
  component: EditModalityPage,
});

function EditModalityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sportId, modalityId } = Route.useParams();
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
      apiFetch(`/modalities/${modalityNumber}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sports.detail(sportNumber),
      });
      toast.success("Modalidade atualizada com sucesso.");
      await navigate({
        to: "/dashboard/sports/$sportId",
        params: { sportId: String(sportNumber) },
      });
    },
  });

  return (
    <ModalityForm
      mode="edit"
      sportId={sportNumber}
      sportName={sport.name}
      defaultValues={modality}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={mutation.mutateAsync}
    />
  );
}
