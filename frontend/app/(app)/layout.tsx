export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full overflow-hidden">
      {/* Sidebar will go here */}
      <aside className="w-[240px] hidden md:flex flex-col bg-brown border-r border-white/5 h-screen sticky top-0 shrink-0">
        <div className="p-4 border-b border-white/5 font-heading text-xl text-cream font-bold">Lumo</div>
      </aside>
      <main className="flex-1 w-full flex flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
