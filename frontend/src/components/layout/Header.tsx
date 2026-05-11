import { useLocation, Link } from 'react-router-dom'
import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { cn } from '@/utils/helpers'

const breadcrumbs: Record<string, string> = {
  '/dashboard': '数据看板',
  '/leads': '线索管理',
  '/outreach': '触达运营',
  '/outreach/templates': '话术模板',
  '/crm': '私域承接',
  '/analytics': '数据分析',
  '/risk': '风控管理',
  '/accounts': '账号管理',
  '/settings': '系统设置',
}

export function Header() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications] = useState(3)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
      {/* Breadcrumb */}
      <div>
        <h1 className="text-base font-semibold text-gray-900">
          {breadcrumbs[location.pathname] ?? 'AI 获客平台'}
        </h1>
        <p className="text-xs text-gray-400">
          首页 / {breadcrumbs[location.pathname] ?? '未知页面'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索线索、话术..."
            className="w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notification */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              {user?.username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.username ?? '管理员'}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="h-4 w-4" />
                系统设置
              </Link>
              <button
                onClick={() => { logout(); setShowUserMenu(false) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
