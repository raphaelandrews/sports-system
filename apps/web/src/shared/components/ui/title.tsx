import type { ReactNode } from "react";

interface TitlesProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

export function Title({ title, subtitle }: TitlesProps) {
  return (
    <section className="text-start space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-muted-foreground">{subtitle}</p>
      ) : null}
    </section>
  );
}
