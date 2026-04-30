"use client";

import * as React from "react";
import { cn } from "@sports-system/ui/lib/utils";

export function DataGridScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-auto", className)}>
      {children}
    </div>
  );
}
