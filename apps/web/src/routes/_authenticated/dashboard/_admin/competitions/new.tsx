import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { CompetitionForm } from "@/components/competitions/competition-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { sportListQueryOptions } from "@/queries/sports";

export const Route = createFileRoute("/_authenticated/dashboard/_admin/competitions/new")({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(sportListQueryOptions())
  },
  component: NewWeekPage,
});

function NewWeekPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all() });
      toast.success("Competicao criada com sucesso.");
      await navigate({ to: "/dashboard/competitions" });
    },
  });

  return (
    <CompetitionForm
      sports={sports.data}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
