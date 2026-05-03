import type { LocalizedString } from "@inlang/paraglide-js";

export function SideCard({ title, children }: { title: LocalizedString, children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
