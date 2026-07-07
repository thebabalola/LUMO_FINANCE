'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, LayoutList, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const SidebarContent = ({ isMobile = false }) => (
    <div className={clsx(
      "flex flex-col h-full bg-brown shrink-0 border-r border-white/5 relative z-50 transition-all duration-300",
      isCollapsed && !isMobile ? "w-[80px]" : "w-[240px]"
    )}>
      
      {/* Collapse Toggle Button (Desktop only) */}
      {!isMobile && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-brown border border-white/10 rounded-full p-1 text-cream/50 hover:text-cream hover:bg-white/5 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      <div className={clsx("p-6 border-b border-white/5 flex items-center", isCollapsed && !isMobile ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className={clsx("flex items-center gap-2", isCollapsed && !isMobile && "justify-center")}>
          <img src="/lumoFi-logo.png" alt="Lumo Logo" className="w-8 h-8 object-contain shrink-0" />
          {(!isCollapsed || isMobile) && <span className="font-heading text-xl text-cream font-bold">Lumo</span>}
        </Link>
        {isMobile && mobileMenuOpen && (
          <button className="md:hidden text-cream" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed && !isMobile ? item.name : undefined}
              className={clsx(
                'flex items-center gap-3 py-3 rounded-xl transition-all duration-200 font-medium',
                isCollapsed && !isMobile ? 'justify-center px-0' : 'px-4',
                isActive 
                  ? 'bg-white/10 text-ember border-l-4 border-ember' 
                  : 'text-cream/70 hover:bg-white/5 hover:text-cream border-l-4 border-transparent'
              )}
            >
              {mounted && <item.icon size={20} className={clsx("shrink-0", isActive ? 'text-ember' : 'text-cream/70')} />}
              {(!isCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={clsx("p-4 border-t border-white/5 flex flex-col gap-4", isCollapsed && !isMobile && "items-center")}>
        <div className={clsx("flex items-center gap-3", isCollapsed && !isMobile && "justify-center")}>
          <img 
            src="/people_3d.png" 
            alt="Avatar" 
            className="w-10 h-10 rounded-full bg-white/10 object-cover shrink-0 border border-white/10 shadow-lg shadow-black/20"
          />
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-cream truncate">Babalola</p>
              <p className="text-xs text-cream/50 truncate">t.babalolajoseph@gmail.com</p>
            </div>
          )}
        </div>
        
        {/* Toggle Pill under Avatar */}
        {(!isCollapsed || isMobile) ? (
          <ThemeToggle variant="pill" />
        ) : (
          <ThemeToggle variant="icon" />
        )}
        
        <button 
          title={isCollapsed && !isMobile ? "Sign Out" : undefined}
          className={clsx(
            "flex items-center gap-3 py-2 text-sm text-danger hover:bg-white/5 rounded-lg transition-colors",
            isCollapsed && !isMobile ? "justify-center px-0 w-10 h-10" : "w-full px-4"
          )}
        >
          {mounted && <LogOut size={16} className="shrink-0" />}
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
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
          <ThemeToggle variant="icon" />
          <button className="text-cream" onClick={() => setMobileMenuOpen(true)}>
            {mounted && <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0">
        <SidebarContent isMobile={false} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarContent isMobile={true} />
        </div>
      )}
    </>
  )
}
