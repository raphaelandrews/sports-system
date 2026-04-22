import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ModalityForm } from "@/components/sports/modality-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { sportDetailQueryOptions } from "@/queries/sports";
import type { Gender } from "@/types/sports";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_admin/sports/$sportId/modalities/new",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(sportDetailQueryOptions(Number(params.sportId))),
  component: NewModalityPage,
});

function NewModalityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sportId } = Route.useParams();
  const sportNumber = Number(sportId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(sportNumber));

  const mutation = useMutation({
    mutationFn: (payload: {
      name: string;
      gender: Gender;
      category?: string;
      rules_json: Record<string, unknown>;
    }) =>
      apiFetch(`/sports/${sportNumber}/modalities`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sports.detail(sportNumber),
      });
      toast.success("Modalidade criada com sucesso.");
      await navigate({
        to: "/dashboard/sports/$sportId",
        params: { sportId: String(sportNumber) },
      });
    },
  });

  return (
    <ModalityForm
      mode="create"
      sportId={sportNumber}
      sportName={sport.name}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={mutation.mutateAsync}
    />
  );
}
