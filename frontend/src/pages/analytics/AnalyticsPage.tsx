import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { formatPercent } from '@/utils/helpers'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts'
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

const weeklyData = [
  { date: '05-06', replyRate: 18, addWechatRate: 26, convertRate: 8.2, cost: 42 },
  { date: '05-07', replyRate: 22, addWechatRate: 30, convertRate: 9.8, cost: 38 },
  { date: '05-08', replyRate: 19, addWechatRate: 28, convertRate: 8.8, cost: 40 },
  { date: '05-09', replyRate: 25, addWechatRate: 33, convertRate: 11.2, cost: 35 },
  { date: '05-10', replyRate: 28, addWechatRate: 35, convertRate: 12.5, cost: 32 },
  { date: '05-11', replyRate: 24, addWechatRate: 31, convertRate: 10.8, cost: 36 },
  { date: '05-12', replyRate: 26, addWechatRate: 32, convertRate: 11.5, cost: 34 },
]

const platformComparison = [
  { platform: '微博', leads: 238, replyRate: 22, addWechatRate: 30, cost: 38 },
  { platform: '小红书', leads: 190, replyRate: 28, addWechatRate: 35, cost: 32 },
  { platform: '抖音', leads: 150, replyRate: 18, addWechatRate: 24, cost: 45 },
  { platform: '知乎', leads: 102, replyRate: 32, addWechatRate: 38, cost: 28 },
]

const industryData = [
  { name: '互联网', value: 32, color: '#3b82f6' },
  { name: '教育', value: 25, color: '#8b5cf6' },
  { name: '快消', value: 20, color: '#06b6d4' },
  { name: '金融', value: 15, color: '#10b981' },
  { name: '其他', value: 8, color: '#9ca3af' },
]

const metrics = [
  { label: '平均回复率', value: 23.1, target: 20, unit: '%', up: true, delta: 3.1 },
  { label: '加微转化率', value: 30.8, target: 30, unit: '%', up: true, delta: 0.8 },
  { label: '单线索成本', value: 36, target: 50, unit: '元', up: false, delta: -28 },
  { label: 'ROI', value: 320, target: 200, unit: '%', up: true, delta: 60 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">数据分析</h2>
          <p className="text-sm text-gray-500 mt-0.5">全链路获客数据洞察 · 支持 A/B 测试</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { label: '近7天', value: '7d' },
              { label: '近30天', value: '30d' },
              { label: '近90天', value: '90d' },
            ]}
            className="w-28"
          />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>刷新</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>导出报告</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{m.label}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${m.up ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.delta > 0 ? '+' : ''}{m.delta}{m.unit === '元' ? '元' : '%'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{m.value}<span className="text-sm font-normal text-gray-400 ml-1">{m.unit}</span></p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>目标: {m.target}{m.unit}</span>
                <span>{Math.round((m.value / m.target) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div
                  className={`h-1.5 rounded-full ${m.value >= m.target ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, Math.round((m.value / m.target) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Trends */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>转化率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`${v}%`]} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="replyRate" stroke="#3b82f6" strokeWidth={2} dot={false} name="回复率" />
                <Line type="monotone" dataKey="addWechatRate" stroke="#10b981" strokeWidth={2} dot={false} name="加微率" />
                <Line type="monotone" dataKey="convertRate" stroke="#f59e0b" strokeWidth={2} dot={false} name="转化率" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>单线索成本趋势（元）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="元" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`¥${v}`, '单线索成本']} />
                <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} fill="url(#costGrad)" name="成本" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>平台效果对比</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconType="square" iconSize={8} />
                <Bar dataKey="replyRate" fill="#3b82f6" name="回复率%" radius={[3, 3, 0, 0]} />
                <Bar dataKey="addWechatRate" fill="#10b981" name="加微率%" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>行业线索分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={industryData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                  {industryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '占比']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {industryData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                    {d.name}
                  </span>
                  <span className="font-medium text-gray-900">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            AI 优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: '提升知乎回复率', desc: '知乎平台回复率最高（32%），建议将知乎账号日触达配额提高至 400 条，预计每日多转化 15 个线索。', priority: 'high' },
              { title: '优化抖音话术', desc: '抖音平台回复率最低（18%），建议 A/B 测试 3 套话术，当前「互动内容引导」模板在抖音效果较差。', priority: 'medium' },
              { title: '提高高意向筛选精度', desc: '当前意向得分 ≥75 的线索加微率高达 42%，建议将筛选阈值从 60 分提高至 70 分，减少无效触达成本。', priority: 'medium' },
            ].map((s) => (
              <div key={s.title} className={`rounded-xl p-4 border ${s.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {s.priority === 'high' ? '高优先级' : '中优先级'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">采纳建议</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
