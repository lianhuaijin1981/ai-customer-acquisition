import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, Pagination } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { PLATFORM_LABELS, STATUS_LABELS, formatDate } from '@/utils/helpers'
import type { OutreachTask, TaskStatus, LeadPlatform } from '@/types'
import { Plus, Play, Pause, Eye, BarChart3, Zap, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_TASKS: OutreachTask[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `${['互联网行业', '教育培训', '快消品牌', '金融理财'][i % 4]}获客任务 ${i + 1}`,
  platform: (['weibo', 'xiaohongshu', 'douyin', 'zhihu'] as LeadPlatform[])[i % 4],
  accountIds: [`acc_${i + 1}`, `acc_${i + 2}`],
  templateId: `tpl_${i % 3 + 1}`,
  leadFilter: { intentLevel: 'high', industry: '互联网' },
  dailyLimit: 200,
  status: (['running', 'paused', 'completed', 'pending'] as TaskStatus[])[i % 4],
  totalTarget: 500 + i * 100,
  totalSent: 200 + i * 50,
  totalReplied: 40 + i * 10,
  totalConverted: 8 + i * 2,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

const statusBadge = (s: TaskStatus) => {
  const cfg: Record<TaskStatus, { variant: 'success' | 'warning' | 'gray' | 'default' | 'danger', icon: React.ReactNode }> = {
    running: { variant: 'success', icon: <Zap className="h-3 w-3" /> },
    paused: { variant: 'warning', icon: <Pause className="h-3 w-3" /> },
    completed: { variant: 'gray', icon: <CheckCircle className="h-3 w-3" /> },
    pending: { variant: 'default', icon: <Clock className="h-3 w-3" /> },
    failed: { variant: 'danger', icon: null },
  }
  const c = cfg[s]
  return <Badge variant={c.variant} className="flex items-center gap-1">{c.icon}{STATUS_LABELS[s]}</Badge>
}

export default function OutreachPage() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const pageSize = 8
  const paged = MOCK_TASKS.slice((page - 1) * pageSize, page * pageSize)

  const handleToggleTask = (task: OutreachTask) => {
    if (task.status === 'running') {
      toast.success(`任务「${task.name}」已暂停`)
    } else {
      toast.success(`任务「${task.name}」已启动`)
    }
  }

  const columns = [
    {
      key: 'name', title: '任务名称', width: '200px',
      render: (v: unknown, row: OutreachTask) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{String(v)}</p>
          <p className="text-xs text-gray-400">{PLATFORM_LABELS[row.platform]}</p>
        </div>
      ),
    },
    {
      key: 'status', title: '状态', width: '100px',
      render: (v: unknown) => statusBadge(v as TaskStatus),
    },
    {
      key: 'totalSent', title: '触达进度', width: '180px',
      render: (v: unknown, row: OutreachTask) => {
        const pct = Math.round((row.totalSent / row.totalTarget) * 100)
        return (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{row.totalSent} / {row.totalTarget}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full">
              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      },
    },
    {
      key: 'totalReplied', title: '回复数', width: '80px', align: 'center' as const,
      render: (v: unknown, row: OutreachTask) => (
        <div className="text-center">
          <p className="text-sm font-medium text-emerald-600">{String(v)}</p>
          <p className="text-xs text-gray-400">{Math.round((row.totalReplied / Math.max(row.totalSent, 1)) * 100)}%</p>
        </div>
      ),
    },
    {
      key: 'totalConverted', title: '转化数', width: '80px', align: 'center' as const,
      render: (v: unknown) => <span className="text-sm font-medium text-amber-600">{String(v)}</span>,
    },
    {
      key: 'dailyLimit', title: '日限额', width: '80px', align: 'center' as const,
      render: (v: unknown) => <span className="text-sm text-gray-600">{String(v)}/天</span>,
    },
    {
      key: 'createdAt', title: '创建时间', width: '110px',
      render: (v: unknown) => <span className="text-xs text-gray-500">{formatDate(v as string, 'MM-DD HH:mm')}</span>,
    },
    {
      key: 'id', title: '操作', width: '120px', align: 'center' as const,
      render: (_: unknown, row: OutreachTask) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
          <Button
            variant={row.status === 'running' ? 'secondary' : 'success'}
            size="sm"
            onClick={() => handleToggleTask(row)}
          >
            {row.status === 'running' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">触达运营</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {MOCK_TASKS.filter(t => t.status === 'running').length} 个任务运行中 ·
            今日已发 {MOCK_TASKS.reduce((a, t) => a + t.totalSent, 0)} 条
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          新建触达任务
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '运行中任务', value: MOCK_TASKS.filter(t => t.status === 'running').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: '今日总触达', value: MOCK_TASKS.reduce((a, t) => a + t.totalSent, 0), color: 'text-blue-600 bg-blue-50' },
          { label: '累计回复', value: MOCK_TASKS.reduce((a, t) => a + t.totalReplied, 0), color: 'text-purple-600 bg-purple-50' },
          { label: '累计转化', value: MOCK_TASKS.reduce((a, t) => a + t.totalConverted, 0), color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color.split(' ')[1]} border border-gray-100`}>
            <p className="text-2xl font-bold mb-1" style={{ color: item.color.split(' ')[0].replace('text-', '') }}>
              <span className={item.color.split(' ')[0]}>{item.value.toLocaleString()}</span>
            </p>
            <p className="text-xs text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <Table columns={columns} data={paged} rowKey="id" />
        <Pagination
          page={page}
          totalPages={Math.ceil(MOCK_TASKS.length / pageSize)}
          total={MOCK_TASKS.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建触达任务"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={() => { toast.success('任务已创建！'); setShowCreate(false) }}>创建任务</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="任务名称" placeholder="请输入任务名称" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="目标平台"
              options={Object.entries(PLATFORM_LABELS).map(([v, l]) => ({ label: l, value: v }))}
              placeholder="请选择平台"
            />
            <Input label="日触达上限" type="number" placeholder="200" />
          </div>
          <Select
            label="话术模板"
            options={[
              { label: '互联网行业首次触达模板', value: 'tpl_1' },
              { label: '教育培训加微信模板', value: 'tpl_2' },
              { label: '通用跟进话术模板', value: 'tpl_3' },
            ]}
            placeholder="请选择话术模板"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="线索意向筛选"
              options={[
                { label: '高意向', value: 'high' },
                { label: '中意向', value: 'medium' },
                { label: '全部', value: '' },
              ]}
            />
            <Input label="关联账号数量" type="number" placeholder="2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="开始时间" type="datetime-local" />
            <Input label="结束时间" type="datetime-local" />
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <span>系统将自动控制触达频率，超过账号安全阈值时自动暂停，确保账号安全。</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
