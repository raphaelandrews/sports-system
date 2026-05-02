import { useCallback, useEffect, useState } from "react";
import { Github, Mail } from "lucide-react";

import { buildApiUrl } from "@/shared/lib/url";
import { CommandDialog } from "./command-dialog";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    action: () => {
      window.location.href = "/login";
    },
  },
  {
    id: "github",
    label: "GitHub",
    icon: Github,
    action: () => {
      window.location.href = buildApiUrl("/auth/oauth/github/start");
    },
  },
  {
    id: "google",
    label: "Google",
    icon: () => (
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
      </svg>
    ),
    action: () => {
      window.location.href = buildApiUrl("/auth/oauth/google/start");
    },
  },
];

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev >= PROVIDERS.length - 1 ? 0 : prev + 1
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? PROVIDERS.length - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          PROVIDERS[selectedIndex]?.action();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [open, selectedIndex, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CommandDialog open={open} onClose={onClose} title="Escolha o método de login">
      <div className="max-h-[50vh] overflow-y-auto py-1">
        {PROVIDERS.map((provider, index) => {
          const isSelected = index === selectedIndex;
          const Icon = provider.icon;

          return (
            <button
              key={provider.id}
              data-login-index={index}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition text-left ${
                isSelected
                  ? "bg-success text-cream"
                  : "text-muted hover:bg-muted/10"
              }`}
              onClick={() => {
                provider.action();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Icon className="size-4 shrink-0" />
              <span>{provider.label}</span>
            </button>
          );
        })}
      </div>
    </CommandDialog>
  );
}
