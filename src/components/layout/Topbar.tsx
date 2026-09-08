import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notificationsApi } from '../../api'
import { useQuery } from '@tanstack/react-query'

interface TopbarProps {
  onMenuClick?: () => void
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data: summary } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: async () => notificationsApi.getNotificationSummary(),
  })

  const unreadCount = summary?.unread || 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const role = user?.role || 'admin'
    const target = role === 'customer' ? `/customer/products` : `/${role}/customers`
    navigate(`${target}?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-100">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 h-16">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden -ml-1 p-2 rounded-lg text-gray-700 hover:text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl min-w-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={user?.role === 'customer' ? 'Search products…' : 'Search customers…'}
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-gray-200 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            aria-label="Notifications"
            className="relative p-2 sm:p-2.5 rounded-full text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-600 text-white text-[10px] font-semibold grid place-items-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-900">{user?.Name}</p>
              <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full gradient-brand text-white grid place-items-center text-sm font-semibold shadow-sm">
              {user?.Name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>

          <div className="md:hidden h-9 w-9 rounded-full gradient-brand text-white grid place-items-center text-sm font-semibold shadow-sm shrink-0">
            {user?.Name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  )
}
