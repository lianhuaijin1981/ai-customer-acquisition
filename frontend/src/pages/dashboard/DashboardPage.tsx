import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts'
import { Users, Send, MessageCircle, UserPlus, TrendingUp, Shield, Activity, AlertTriangle } from 'lucide-react'
import { PLATFORM_LABELS, PLATFORM_COLORS, formatPercent } from '@/utils/helpers'

const trendData = [
  { date: '05-06', leads: 320, sent: 180, replied: 42, converted: 12 },
  { date: '05-07', leads: 450, sent: 260, replied: 65, converted: 18 },
  { date: '05-08', leads: 380, sent: 220, replied: 52, converted: 15 },
  { date: '05-09', leads: 520, sent: 310, replied: 78, converted: 22 },
  { date: '05-10', leads: 610, sent: 380, replied: 96, converted: 28 },
  { date: '05-11', leads: 540, sent: 330, replied: 88, converted: 24 },
  { date: '05-12', leads: 680, sent: 410, replied: 105, converted: 32 },
]

const platformData = [
  { name: '微博', value: 35, color: PLATFORM_COLORS.weibo },
  { name: '小红书', value: 28, color: PLATFORM_COLORS.xiaohongshu },
  { name: '抖音', value: 22, color: PLATFORM_COLORS.douyin },
  { name: '知乎', value: 15, color: PLATFORM_COLORS.zhihu },
]

const recentLeads = [
  { id: '1', nickname: '王小明', platform: 'weibo', intentScore: 88, status: 'new', time: '5分钟前' },
  { id: '2', nickname: '李佳佳', platform: 'xiaohongshu', intentScore: 76, status: 'processing', time: '12分钟前' },
  { id: '3', nickname: '张宇航', platform: 'douyin', intentScore: 92, status: 'new', time: '18分钟前' },
  { id: '4', nickname: '陈思远', platform: 'zhihu', intentScore: 64, status: 'contacted', time: '25分钟前' },
  { id: '5', nickname: '刘晓雨', platform: 'weibo', intentScore: 81, status: 'new', time: '33分钟前' },
]

const riskEvents = [
  { id: '1', level: 'warning', message: '账号「微博_003」今日触达量接近上限（85%）', time: '10分钟前' },
  { id: '2', level: 'danger', message: '账号「小红书_007」发送失败 3 次，已暂停', time: '45分钟前' },
  { id: '3', level: 'info', message: '自动归档昨日过期线索 128 条', time: '2小时前' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">数据看板</h2>
          <p className="text-sm text-gray-500 mt-0.5">今日 2026-05-12 · 实时更新</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Activity className="h-4 w-4" />}>
          刷新数据
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="今日新增线索"
          value={680}
          change={12.5}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          description="目标 800 条/日"
        />
        <StatCard
          title="今日触达数"
          value={410}
          change={8.2}
          icon={<Send className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          description="日上限 5000 条"
        />
        <StatCard
          title="私信回复率"
          value="25.6"
          suffix="%"
          change={3.1}
          icon={<MessageCircle className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          description="目标 ≥20%"
        />
        <StatCard
          title="加微转化率"
          value="31.2"
          suffix="%"
          change={-1.4}
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
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 12, color: '#6b7280' }}>{value}</span>} />
                <Tooltip formatter={(value) => [`${value}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {platformData.map((p) => (
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
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {lead.nickname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.nickname}</p>
                  <p className="text-xs text-gray-400">{PLATFORM_LABELS[lead.platform]} · {lead.time}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    意向 {lead.intentScore}分
                  </span>
                  <Badge variant={lead.status === 'new' ? 'default' : 'warning'}>
                    {lead.status === 'new' ? '新线索' : lead.status === 'processing' ? '跟进中' : '已触达'}
                  </Badge>
                </div>
              </div>
            ))}
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
              <Badge variant="warning">{riskEvents.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {riskEvents.map((event) => (
              <div key={event.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                    event.level === 'danger' ? 'bg-red-500' : event.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-xs text-gray-700 leading-relaxed">{event.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{event.time}</p>
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
            {[
              { label: '采集线索', value: 680, rate: null, color: '#3b82f6' },
              { label: '筛选通过', value: 521, rate: 76.6, color: '#8b5cf6' },
              { label: '已触达', value: 410, rate: 78.7, color: '#06b6d4' },
              { label: '有回复', value: 105, rate: 25.6, color: '#10b981' },
              { label: '已加微', value: 32, rate: 30.5, color: '#f59e0b' },
            ].map((item, i) => (
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
                  {item.rate !== null && (
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
