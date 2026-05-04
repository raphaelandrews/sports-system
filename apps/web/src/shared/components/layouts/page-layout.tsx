export function PageLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 pt-3 pb-24 lg:gap-4 lg:border-r lg:border-input lg:px-10 lg:pt-6 lg:pb-12">
          {children}
        </div>
        <div className="hidden w-85 shrink-0 px-6 pt-6 lg:block">
          <div className="flex flex-col gap-4">{sidebar}</div>
        </div>
      </div>
    </div>
  );
}
