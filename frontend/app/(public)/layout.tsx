export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      {/* Top Navbar will go here */}
      <main className="flex-1 w-full flex flex-col">{children}</main>
    </div>
  )
}
