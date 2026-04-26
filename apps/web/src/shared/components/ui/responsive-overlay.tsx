import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sports-system/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@sports-system/ui/components/sheet";
import { cn } from "@sports-system/ui/lib/utils";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export function ResponsiveOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={cn("w-full sm:max-w-xl", contentClassName)} side="bottom">
          <SheetHeader className="border-b">
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="overflow-y-auto p-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-3xl p-0", contentClassName)}>
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
