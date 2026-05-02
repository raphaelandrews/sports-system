import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface CommandDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function CommandDialog({ open, onClose, children, title }: CommandDialogProps) {
  if (!open) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[20vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-background border-2 border-border rounded-sm p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="p-1 text-sm font-bold mb-2">{title}</div>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
