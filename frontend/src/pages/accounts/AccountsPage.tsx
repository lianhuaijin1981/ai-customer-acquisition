import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, Pagination } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { PLATFORM_LABELS, STATUS_LABELS, formatDate } from '@/utils/helpers'
import type { Account, AccountStatus, AccountPlatform } from '@/types'
import { Plus, RefreshCw, Zap, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_ACCOUNTS: Account[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  platform: (['weibo', 'xiaohongshu', 'douyin', 'zhihu'] as AccountPlatform[])[i % 4],
  username: `${['微博', '小红书', '抖音', '知乎'][i % 4]}_${String(i + 1).padStart(3, '0')}`,
  groupId: `group_${Math.floor(i / 4) + 1}`,
  status: (['active', 'warning', 'suspended', 'inactive'] as AccountStatus[])[i % 4],
  dailyLimit: [200, 150, 180, 120][i % 4],
  todaySent: Math.floor(Math.random() * 180),
  ipPool: `ip_pool_${(i % 3) + 1}`,
  riskScore: 10 + (i * 7) % 80,
  lastActiveAt: new Date(Date.now() - i * 1800000).toISOString(),
  createdAt: new Date(Date.now() - i * 86400000 * 10).toISOString(),
}))

const statusBadge = (s: AccountStatus) => {
  const map: Record<AccountStatus, 'success' | 'warning' | 'danger' | 'gray'> = {
    active: 'success', warning: 'warning', suspended: 'danger', inactive: 'gray',
  }
  const icons: Record<AccountStatus, React.ReactNode> = {
    active: <CheckCircle className="h-3 w-3" />,
    warning: <AlertCircle className="h-3 w-3" />,
    suspended: <ShieldAlert className="h-3 w-3" />,
    inactive: null,
  }
  return <Badge variant={map[s]} className="flex items-center gap-1">{icons[s]}{STATUS_LABELS[s]}</Badge>
}

export default function AccountsPage() {
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const pageSize = 10
  const paged = MOCK_ACCOUNTS.slice((page - 1) * pageSize, page * pageSize)

  const activeCount = MOCK_ACCOUNTS.filter(a => a.status === 'active').length
  const todayTotal = MOCK_ACCOUNTS.reduce((a, c) => a + c.todaySent, 0)

  const columns = [
    {
      key: 'username', title: '账号', width: '160px',
      render: (v: unknown, row: Account) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {PLATFORM_LABELS[row.platform]?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{String(v)}</p>
            <p className="text-xs text-gray-400">{PLATFORM_LABELS[row.platform]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', title: '状态', width: '100px',
      render: (v: unknown) => statusBadge(v as AccountStatus),
    },
    {
      key: 'todaySent', title: '今日发送', width: '150px',
      render: (v: unknown, row: Account) => {
        const pct = Math.round((row.todaySent / row.dailyLimit) * 100)
        return (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{row.todaySent} / {row.dailyLimit}</span>
              <span className={pct >= 90 ? 'text-red-500 font-medium' : ''}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div
                className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      key: 'riskScore', title: '风险评分', width: '100px', align: 'center' as const,
      render: (v: unknown) => {
        const score = Number(v)
        return (
          <span className={`text-sm font-medium ${score >= 70 ? 'text-red-600' : score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {score}
          </span>
        )
      },
    },
    {
      key: 'ipPool', title: 'IP 池', width: '100px',
      render: (v: unknown) => <span className="text-sm text-gray-500">{String(v)}</span>,
    },
    {
      key: 'lastActiveAt', title: '最后活跃', width: '110px',
      render: (v: unknown) => <span className="text-xs text-gray-400">{formatDate(v as string, 'MM-DD HH:mm')}</span>,
    },
    {
      key: 'id', title: '操作', width: '120px', align: 'center' as const,
      render: (_: unknown, row: Account) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant={row.status === 'active' ? 'secondary' : 'success'}
            size="sm"
            onClick={() => toast.success(row.status === 'active' ? '账号已暂停' : '账号已启用')}
          >
            {row.status === 'active' ? '暂停' : '启用'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Cookie 已刷新')}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">账号管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {MOCK_ACCOUNTS.length} 个账号 · {activeCount} 个活跃 · 今日已发 {todayTotal} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
            批量刷新 Cookie
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
            添加账号
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '活跃账号', value: activeCount, color: 'text-emerald-600 bg-emerald-50' },
          { label: '预警账号', value: MOCK_ACCOUNTS.filter(a => a.status === 'warning').length, color: 'text-amber-600 bg-amber-50' },
          { label: '封禁账号', value: MOCK_ACCOUNTS.filter(a => a.status === 'suspended').length, color: 'text-red-600 bg-red-50' },
          { label: '今日发送总量', value: todayTotal, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 border border-gray-100 ${color.split(' ')[1]}`}>
            <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <Table columns={columns} data={paged} rowKey="id" />
        <Pagination
          page={page}
          totalPages={Math.ceil(MOCK_ACCOUNTS.length / pageSize)}
          total={MOCK_ACCOUNTS.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="添加平台账号"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={() => { toast.success('账号已添加！'); setShowAdd(false) }}>添加账号</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="平台"
            options={Object.entries(PLATFORM_LABELS).filter(([v]) => v !== 'other').map(([v, l]) => ({ label: l, value: v }))}
            placeholder="请选择平台"
          />
          <Input label="账号用户名" placeholder="请输入账号用户名" />
          <Input label="Cookie" placeholder="请粘贴登录 Cookie" />
          <Select
            label="IP 池分组"
            options={[
              { label: 'IP 池 1（北京）', value: 'ip_pool_1' },
              { label: 'IP 池 2（上海）', value: 'ip_pool_2' },
              { label: 'IP 池 3（广州）', value: 'ip_pool_3' },
            ]}
          />
          <Input label="日触达上限" type="number" placeholder="200" />
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
            ⚠️ 请确保账号 Cookie 有效，系统将定期检测账号状态，异常时自动暂停并预警。
          </div>
        </div>
      </Modal>
    </div>
  )
}
