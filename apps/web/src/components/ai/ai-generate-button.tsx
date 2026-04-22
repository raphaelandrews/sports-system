import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@sports-system/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@sports-system/ui/components/dialog";

import { ApiError } from "@/lib/api";

export function AiGenerateButton<TData>({
  label,
  previewTitle,
  previewDescription,
  previewItems,
  disabled,
  confirmLabel = "Gerar agora",
  pendingLabel = "Gerando...",
  successMessage,
  errorMessage,
  onGenerate,
  onSuccess,
  variant = "secondary",
}: {
  label: string;
  previewTitle: string;
  previewDescription: string;
  previewItems: { label: string; value: string }[];
  disabled?: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
  successMessage: string | ((data: TData) => string);
  errorMessage: string;
  onGenerate: () => Promise<TData>;
  onSuccess?: (data: TData) => Promise<void> | void;
  variant?: "default" | "secondary" | "outline";
}) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: onGenerate,
    onSuccess: async (data) => {
      await onSuccess?.(data);
      toast.success(typeof successMessage === "function" ? successMessage(data) : successMessage);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : errorMessage);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant={variant} className="w-full justify-start" />
        }
        disabled={disabled}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{previewTitle}</DialogTitle>
          <DialogDescription>{previewDescription}</DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {previewItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="text-sm font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
