import React from "react";
import type { LucideIcon } from "lucide-react";

export function SideCard({
  Icon,
  title,
  children,
}: {
  Icon?: LucideIcon;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        {Icon && (
          <Icon size={16} />
        )}
        {title}
      </h3>
      {children}
    </div>
  );
}