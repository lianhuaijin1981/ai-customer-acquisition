import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, Send, MessageCircle, UserPlus, TrendingUp, Shield, Activity, AlertTriangle } from 'lucide-react'
import { PLATFORM_LABELS, PLATFORM_COLORS, formatPercent } from '@/utils/helpers'
import {
  useDashboardStats, useDashboardTrend, useDashboardFunnel,
  usePlatformDistribution, useDashboardAlerts, useLeads
} from '@/hooks/useApi'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// Fallback 数据
const FALLBACK_TREND = Array.from({ length: 7 }).map((_, i) => ({
  date: dayjs().subtract(6 - i, 'day').format('MM-DD'),
  leads: 300 + i * 50,
  sent: 180 + i * 30,
  replied: 40 + i * 8,
  converted: 12 + i * 3,
}))

const FALLBACK_PLATFORM = [
  { name: '微博', value: 35, color: PLATFORM_COLORS.weibo },
  { name: '小红书', value: 28, color: PLATFORM_COLORS.xiaohongshu },
  { name: '抖音', value: 22, color: PLATFORM_COLORS.douyin },
  { name: '知乎', value: 15, color: PLATFORM_COLORS.zhihu },
]

const FALLBACK_ALERTS = [
  { id: '1', level: 'warning', message: '系统正在初始化，数据加载中...', createdAt: new Date().toISOString() },
]

export default function DashboardPage() {
  const { data: stats, refetch: refetchStats } = useDashboardStats()
  const { data: trend } = useDashboardTrend(7)
  const { data: funnel } = useDashboardFunnel()
  const { data: platformDist } = usePlatformDistribution()
  const { data: alerts } = useDashboardAlerts()
  const { data: recentLeadsData } = useLeads({ pageSize: 5, page: 1 })

  const trendData = trend?.length ? trend.map((d: any) => ({
    date: d.date?.slice(5) ?? d.date, // MM-DD
    leads: d.leadsCount ?? d.leads ?? 0,
    sent: d.sentCount ?? d.sent ?? 0,
    replied: d.replyCount ?? d.replied ?? 0,
    converted: d.convertCount ?? d.converted ?? 0,
  })) : FALLBACK_TREND

  const platformData = platformDist?.length ? platformDist.map((p: any) => ({
    name: p.platform ?? p.name,
    value: p.count ?? p.value ?? 0,
    color: PLATFORM_COLORS[p.platform?.toLowerCase?.() as keyof typeof PLATFORM_COLORS] ?? '#94a3b8',
  })) : FALLBACK_PLATFORM

  const funnelData = funnel?.length ? funnel : [
    { label: '采集线索', value: stats?.todayLeads ?? 0, rate: null, color: '#3b82f6' },
    { label: '筛选通过', value: stats?.filteredLeads ?? 0, rate: null, color: '#8b5cf6' },
    { label: '已触达', value: stats?.sentToday ?? 0, rate: null, color: '#06b6d4' },
    { label: '有回复', value: stats?.repliedToday ?? 0, rate: null, color: '#10b981' },
    { label: '已加微', value: stats?.addedToday ?? 0, rate: null, color: '#f59e0b' },
  ]

  const alertList = alerts?.length ? alerts : FALLBACK_ALERTS
  const recentLeads = recentLeadsData?.data ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">数据看板</h2>
          <p className="text-sm text-gray-500 mt-0.5">{dayjs().format('今日 YYYY-MM-DD')} · 实时更新</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Activity className="h-4 w-4" />}
          onClick={() => refetchStats()}
        >
          刷新数据
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="今日新增线索"
          value={stats?.todayLeads ?? 0}
          change={stats?.todayLeadsChange ?? 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          description="目标 800 条/日"
        />
        <StatCard
          title="今日触达数"
          value={stats?.sentToday ?? 0}
          change={stats?.sentChange ?? 0}
          icon={<Send className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          description="日上限 5000 条"
        />
        <StatCard
          title="私信回复率"
          value={typeof stats?.replyRate === 'number' ? stats.replyRate.toFixed(1) : '0.0'}
          suffix="%"
          change={stats?.replyRateChange ?? 0}
          icon={<MessageCircle className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          description="目标 ≥20%"
        />
        <StatCard
          title="加微转化率"
          value={typeof stats?.addWechatRate === 'number' ? stats.addWechatRate.toFixed(1) : '0.0'}
          suffix="%"
          change={stats?.addWechatRateChange ?? 0}
          icon={<UserPlus className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
          description="目标 ≥30%"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>获客趋势（近7日）</CardTitle>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>线索</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>触达</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>回复</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>转化</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} fill="url(#colorLeads)" name="线索" />
                <Area type="monotone" dataKey="sent" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorSent)" name="触达" />
                <Area type="monotone" dataKey="replied" stroke="#10b981" strokeWidth={2} fill="transparent" name="回复" />
                <Area type="monotone" dataKey="converted" stroke="#f59e0b" strokeWidth={2} fill="transparent" name="转化" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>线索来源分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                >
                  {platformData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>} />
                <Tooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {platformData.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }}></span>
                    {p.name}
                  </span>
                  <span className="font-medium text-gray-900">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最新线索</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {}}>查看全部</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {recentLeads.length > 0 ? recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(lead.nickname ?? '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.nickname}</p>
                  <p className="text-xs text-gray-400">
                    {PLATFORM_LABELS[lead.platform as keyof typeof PLATFORM_LABELS] ?? lead.platform} · {lead.createdAt ? dayjs(lead.createdAt).fromNow() : '刚刚'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    意向 {lead.intentScore ?? 0}分
                  </span>
                  <Badge variant={lead.status === 'new' ? 'default' : 'warning'}>
                    {lead.status === 'new' ? '新线索' : lead.status === 'processing' ? '跟进中' : '已触达'}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">暂无线索数据</div>
            )}
          </div>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                风控预警
              </CardTitle>
              <Badge variant="warning">{alertList.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {alertList.map((event: any) => (
              <div key={event.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                    event.level === 'critical' || event.level === 'danger' ? 'bg-red-500' :
                    event.level === 'high' || event.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-xs text-gray-700 leading-relaxed">{event.description ?? event.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.createdAt ? dayjs(event.createdAt).fromNow() : (event.time ?? '')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-100">
            <Button variant="outline" size="sm" className="w-full" leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}>
              查看全部预警
            </Button>
          </div>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            获客漏斗（今日）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            {funnelData.map((item: any, i: number) => (
              <div key={item.label} className="relative">
                {i < 4 && (
                  <div className="absolute top-8 right-0 translate-x-1/2 z-10 text-gray-300 text-lg">→</div>
                )}
                <div
                  className="mx-auto rounded-xl flex flex-col items-center justify-center p-4"
                  style={{ backgroundColor: item.color + '15', border: `1px solid ${item.color}30` }}
                >
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  {item.rate !== null && item.rate !== undefined && (
                    <p className="text-xs font-medium mt-1" style={{ color: item.color }}>{formatPercent(item.rate)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
