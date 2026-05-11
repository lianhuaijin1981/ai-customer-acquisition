import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { PLATFORM_LABELS, RISK_LEVEL_COLORS, formatDate, getRelativeTime } from '@/utils/helpers'
import type { RiskEvent, RiskLevel, RiskEventType } from '@/types'
import { Shield, AlertTriangle, CheckCircle, Bell, Settings, Ban } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_EVENTS: RiskEvent[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  type: (['account_suspended', 'send_limit', 'ip_blocked', 'content_filtered', 'login_failed'] as RiskEventType[])[i % 5],
  level: (['low', 'medium', 'high', 'critical'] as RiskLevel[])[i % 4],
  accountId: `acc_${i + 1}`,
  platform: ['weibo', 'xiaohongshu', 'douyin', 'zhihu'][i % 4] as never,
  description: [
    '账号「微博_003」连续 3 次发送失败，已自动暂停触达操作',
    '账号「小红书_007」今日触达量达到上限（200条），已停止发送',
    '检测到 IP 地址被限制，已切换至备用 IP 池',
    '话术模板包含敏感关键词「代理」，已被过滤',
    '账号「抖音_012」登录失败，Cookie 可能已过期',
  ][i % 5],
  isResolved: i % 3 === 0,
  resolvedAt: i % 3 === 0 ? new Date(Date.now() - i * 1800000).toISOString() : undefined,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}))

const TYPE_LABELS: Record<RiskEventType, string> = {
  account_suspended: '账号封禁',
  send_limit: '发送超限',
  ip_blocked: 'IP 封禁',
  content_filtered: '内容过滤',
  login_failed: '登录失败',
}

const levelBadge = (level: RiskLevel) => {
  const map: Record<RiskLevel, 'danger' | 'warning' | 'default' | 'gray'> = {
    critical: 'danger', high: 'danger', medium: 'warning', low: 'default',
  }
  const labels: Record<RiskLevel, string> = {
    critical: '严重', high: '高风险', medium: '中风险', low: '低风险',
  }
  return <Badge variant={map[level]}>{labels[level]}</Badge>
}

export default function RiskPage() {
  const [showRule, setShowRule] = useState(false)
  const unresolved = MOCK_EVENTS.filter(e => !e.isResolved)
  const critical = MOCK_EVENTS.filter(e => (e.level === 'critical' || e.level === 'high') && !e.isResolved)

  const columns = [
    {
      key: 'type', title: '事件类型', width: '120px',
      render: (v: unknown) => <span className="text-sm text-gray-700">{TYPE_LABELS[v as RiskEventType]}</span>,
    },
    {
      key: 'level', title: '风险等级', width: '100px',
      render: (v: unknown) => levelBadge(v as RiskLevel),
    },
    {
      key: 'platform', title: '平台', width: '80px',
      render: (v: unknown) => <span className="text-sm text-gray-500">{PLATFORM_LABELS[v as string] ?? '-'}</span>,
    },
    {
      key: 'description', title: '事件描述',
      render: (v: unknown) => <p className="text-sm text-gray-700">{String(v)}</p>,
    },
    {
      key: 'isResolved', title: '状态', width: '90px',
      render: (v: unknown) => v
        ? <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />已处理</Badge>
        : <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />待处理</Badge>,
    },
    {
      key: 'createdAt', title: '发生时间', width: '110px',
      render: (v: unknown) => <span className="text-xs text-gray-400">{getRelativeTime(v as string)}</span>,
    },
    {
      key: 'id', title: '操作', width: '100px', align: 'center' as const,
      render: (_: unknown, row: RiskEvent) => !row.isResolved ? (
        <Button
          variant="outline" size="sm"
          onClick={() => toast.success('已标记为处理完成')}
        >
          标记处理
        </Button>
      ) : <span className="text-xs text-gray-400">{formatDate(row.resolvedAt!, 'MM-DD HH:mm')}</span>,
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">风控管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {unresolved.length} 条待处理预警 · {critical.length} 条高风险事件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Settings className="h-4 w-4" />} onClick={() => setShowRule(true)}>
            风控规则配置
          </Button>
          <Button variant="danger" size="sm" leftIcon={<Ban className="h-4 w-4" />}>
            一键暂停全部
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待处理预警', value: unresolved.length, color: 'bg-red-50', text: 'text-red-600', icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
          { label: '今日触发次数', value: 28, color: 'bg-amber-50', text: 'text-amber-600', icon: <Bell className="h-5 w-5 text-amber-500" /> },
          { label: '已处理事件', value: MOCK_EVENTS.filter(e => e.isResolved).length, color: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
          { label: '账号健康度', value: '92%', color: 'bg-blue-50', text: 'text-blue-600', icon: <Shield className="h-5 w-5 text-blue-500" /> },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 border border-gray-100 ${item.color}`}>
            <div className="flex items-center gap-3 mb-2">
              {item.icon}
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Critical Alerts */}
      {critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-semibold text-red-700">紧急预警（需立即处理）</h3>
          </div>
          <div className="space-y-2">
            {critical.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2">
                  {levelBadge(event.level)}
                  <span className="text-sm text-gray-700">{event.description}</span>
                </div>
                <Button variant="danger" size="sm" onClick={() => toast.success('已处理')}>立即处理</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Table */}
      <Card>
        <CardHeader>
          <CardTitle>风险事件记录</CardTitle>
        </CardHeader>
        <Table columns={columns} data={MOCK_EVENTS} rowKey="id" />
      </Card>

      {/* Risk Rule Modal */}
      <Modal
        open={showRule}
        onClose={() => setShowRule(false)}
        title="风控规则配置"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRule(false)}>取消</Button>
            <Button onClick={() => { toast.success('规则已保存！'); setShowRule(false) }}>保存规则</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="单账号日触达上限" type="number" defaultValue="200" />
            <Input label="加好友日限额" type="number" defaultValue="200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="发送最小间隔（秒）" type="number" defaultValue="30" />
            <Input label="连续失败告警阈值" type="number" defaultValue="3" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">敏感关键词（换行分隔）</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={'代理\n分销\n微信号\n手机号\n赚钱\n兼职'}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">自动内容过滤</p>
              <p className="text-xs text-gray-500">触达前自动检测话术是否包含敏感词</p>
            </div>
            <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow"></div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
