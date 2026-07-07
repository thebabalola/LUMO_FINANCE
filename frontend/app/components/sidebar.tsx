'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, LayoutList, Settings, LogOut, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { ThemeToggle } from './ui/theme-toggle'

const navItems = [
  { name: 'Chat', href: '/dashboard', icon: MessageSquare },
  { name: 'Transactions', href: '/transactions', icon: LayoutList },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-brown w-[240px] shrink-0 border-r border-white/5 relative z-50">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/lumoFi-logo.png" alt="Lumo Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading text-xl text-cream font-bold">Lumo</span>
        </Link>
        {mobileMenuOpen && (
          <button className="md:hidden text-cream" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                isActive 
                  ? 'bg-white/10 text-ember border-l-4 border-ember' 
                  : 'text-cream/70 hover:bg-white/5 hover:text-cream border-l-4 border-transparent'
              )}
            >
              {mounted && <item.icon size={20} className={isActive ? 'text-ember' : 'text-cream/70'} />}
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Babalola" 
            alt="Avatar" 
            className="w-10 h-10 rounded-full bg-white/10"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-cream truncate">Babalola</p>
            <p className="text-xs text-cream/50 truncate">t.babalolajoseph@gmail.com</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <ThemeToggle />
        </div>
        <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-white/5 rounded-lg transition-colors">
          {mounted && <LogOut size={16} />}
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brown border-b border-white/5 w-full shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="/lumoFi-logo.png" alt="Lumo Logo" className="w-8 h-8 object-contain" />
          <span className="font-heading text-xl text-cream font-bold">Lumo</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="text-cream" onClick={() => setMobileMenuOpen(true)}>
            {mounted && <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarContent />
        </div>
      )}
    </>
  )
}
