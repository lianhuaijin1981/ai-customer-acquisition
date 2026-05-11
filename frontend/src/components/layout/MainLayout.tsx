import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/helpers'

export function MainLayout() {
  const { sidebarCollapsed } = useUIStore()
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className={cn(
        'flex flex-col flex-1 min-w-0 transition-all duration-200',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
