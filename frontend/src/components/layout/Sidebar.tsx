import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard, Users, Send, UserCheck, BarChart3,
  Shield, Settings, ChevronLeft, ChevronRight, Zap, MessageSquare,
  MessagesSquare, FlaskConical, Download
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '数据看板' },
  { to: '/leads', icon: Users, label: '线索管理' },
  { to: '/outreach', icon: Send, label: '触达运营' },
  { to: '/outreach/templates', icon: MessageSquare, label: '话术模板' },
  { to: '/abtest', icon: FlaskConical, label: 'A/B 测试' },
  { to: '/crm', icon: UserCheck, label: '私域承接' },
  { to: '/wework', icon: MessagesSquare, label: '企微 SCRM' },
  { to: '/analytics', icon: BarChart3, label: '数据分析' },
  { to: '/export', icon: Download, label: '数据导出' },
  { to: '/risk', icon: Shield, label: '风控管理' },
  { to: '/accounts', icon: Zap, label: '账号管理' },
  { to: '/settings', icon: Settings, label: '系统设置' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside className={cn(
      'fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col transition-all duration-200',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0',
        sidebarCollapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">AI 获客平台</p>
            <p className="text-xs text-gray-400">智能营销系统</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => cn(
              'flex items-center rounded-lg transition-all duration-150 group',
              sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : (
            <span className="flex items-center gap-2 text-sm">
              <ChevronLeft className="w-4 h-4" />
              收起菜单
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
