export function SideInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden w-85 shrink-0 px-6 pt-6 lg:block">
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}