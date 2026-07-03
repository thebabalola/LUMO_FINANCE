import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-400">Lumo</h1>
        <p className="text-xs text-dark-400 mt-1">AI Financial Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <Link
          href="/dashboard"
          className="block px-4 py-2 rounded-lg bg-primary-600 text-white font-medium transition-smooth"
        >
          Dashboard
        </Link>
        <Link
          href="/transactions"
          className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-700 transition-smooth"
        >
          Transactions
        </Link>
        <Link
          href="/analytics"
          className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-700 transition-smooth"
        >
          Analytics
        </Link>
        <Link
          href="/settings"
          className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-700 transition-smooth"
        >
          Settings
        </Link>
      </nav>

      {/* User section */}
      <div className="pt-6 border-t border-dark-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-500" />
          <div>
            <p className="text-sm font-medium text-dark-50">User</p>
            <p className="text-xs text-dark-400">Account</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
