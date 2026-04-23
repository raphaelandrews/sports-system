import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { WeekForm } from "@/components/weeks/week-form";
import { apiFetch, ApiError } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import { sportListQueryOptions } from "@/queries/sports";

export const Route = createFileRoute("/_authenticated/dashboard/_admin/weeks/new")({
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
      week_number: number;
      start_date: string;
      end_date: string;
      sport_focus: number[];
    }) =>
      apiFetch("/weeks", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.weeks.all() });
      toast.success("Semana criada com sucesso.");
      await navigate({ to: "/dashboard/weeks" });
    },
  });

  return (
    <WeekForm
      sports={sports.data}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error instanceof ApiError ? mutation.error.message : null}
      onSubmit={async (value) => {
        await mutation.mutateAsync(value);
      }}
    />
  );
}
