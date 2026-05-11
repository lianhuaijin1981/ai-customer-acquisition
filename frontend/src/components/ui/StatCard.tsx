import { cn } from '@/utils/helpers'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  iconBg?: string
  description?: string
  suffix?: string
}

export function StatCard({ title, value, change, icon, iconBg = 'bg-blue-100', description, suffix }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1',
            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}>
            {isPositive ? '↑' : '↓'}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
        </p>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
  )
}
