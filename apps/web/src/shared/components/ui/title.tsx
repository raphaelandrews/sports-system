import type { LocalizedString } from "@inlang/paraglide-js";

export function Title({ title, description }: { title: LocalizedString, description?: LocalizedString }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
