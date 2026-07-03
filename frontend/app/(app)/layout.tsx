import { Sidebar } from '@/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto bg-brown pb-16 md:pb-0">
        {children}
      </main>
    </div>
  )
}

