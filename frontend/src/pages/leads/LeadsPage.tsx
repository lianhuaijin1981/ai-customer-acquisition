import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Table, Pagination } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { PLATFORM_LABELS, INTENT_LEVEL_LABELS, STATUS_LABELS, formatDate } from '@/utils/helpers'
import type { Lead, LeadStatus, IntentLevel, LeadPlatform } from '@/types'
import { Search, Filter, Plus, Download, RefreshCw, Eye, ChevronDown } from 'lucide-react'

const MOCK_LEADS: Lead[] = Array.from({ length: 35 }, (_, i) => ({
  id: String(i + 1),
  platform: (['weibo', 'xiaohongshu', 'douyin', 'zhihu'] as LeadPlatform[])[i % 4],
  platformUserId: `uid_${1000 + i}`,
  nickname: ['王小明', '李佳佳', '张宇航', '陈思远', '刘晓雨', '赵云龙', '周丽华', '吴建国'][i % 8],
  bio: '热爱生活，关注品质',
  interactionContent: ['评论了热门帖子', '点赞了品牌内容', '搜索了相关关键词', '转发了行业资讯'][i % 4],
  intentScore: 55 + (i * 7) % 40,
  intentLevel: (['high', 'medium', 'low'] as IntentLevel[])[i % 3],
  tags: ['潜在客户', i % 2 === 0 ? '高消费' : '年轻群体'],
  status: (['new', 'processing', 'contacted', 'converted', 'lost'] as LeadStatus[])[i % 5],
  industry: ['互联网', '教育', '快消', '金融', '医疗'][i % 5],
  location: ['北京', '上海', '广州', '深圳', '杭州'][i % 5],
  followerCount: 1000 + i * 500,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

const intentBadge = (level: IntentLevel) => {
  const map = { high: 'success', medium: 'warning', low: 'gray' } as const
  return <Badge variant={map[level]}>{INTENT_LEVEL_LABELS[level]}</Badge>
}

const statusBadge = (status: LeadStatus) => {
  const map: Record<LeadStatus, 'default' | 'success' | 'warning' | 'gray' | 'danger'> = {
    new: 'default', processing: 'warning', contacted: 'info' as never, converted: 'success', lost: 'danger', archived: 'gray',
  }
  return <Badge variant={map[status] || 'gray'}>{STATUS_LABELS[status]}</Badge>
}

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [intentFilter, setIntentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetail, setShowDetail] = useState<Lead | null>(null)
  const [showFilter, setShowFilter] = useState(false)

  const filtered = MOCK_LEADS.filter((l) => {
    if (search && !l.nickname.includes(search) && !l.platformUserId.includes(search)) return false
    if (platformFilter && l.platform !== platformFilter) return false
    if (intentFilter && l.intentLevel !== intentFilter) return false
    if (statusFilter && l.status !== statusFilter) return false
    return true
  })

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const columns = [
    {
      key: 'nickname', title: '用户', width: '180px',
      render: (_: unknown, row: Lead) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {row.nickname[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{row.nickname}</p>
            <p className="text-xs text-gray-400">{row.platformUserId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'platform', title: '平台', width: '90px',
      render: (v: unknown) => <span className="text-sm text-gray-600">{PLATFORM_LABELS[v as string]}</span>,
    },
    {
      key: 'intentScore', title: '意向度', width: '130px', align: 'center' as const,
      render: (v: unknown, row: Lead) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-16">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${v}%`,
                backgroundColor: row.intentLevel === 'high' ? '#10b981' : row.intentLevel === 'medium' ? '#f59e0b' : '#9ca3af'
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-8 text-right">{String(v)}</span>
          {intentBadge(row.intentLevel)}
        </div>
      ),
    },
    { key: 'industry', title: '行业', width: '80px' },
    { key: 'location', title: '城市', width: '70px' },
    {
      key: 'status', title: '状态', width: '90px',
      render: (v: unknown) => statusBadge(v as LeadStatus),
    },
    {
      key: 'createdAt', title: '采集时间', width: '130px',
      render: (v: unknown) => <span className="text-xs text-gray-500">{formatDate(v as string, 'MM-DD HH:mm')}</span>,
    },
    {
      key: 'id', title: '操作', width: '100px', align: 'center' as const,
      render: (_: unknown, row: Lead) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowDetail(row)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm">触达</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">线索管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">共 {filtered.length} 条线索 · 高意向 {filtered.filter(l => l.intentLevel === 'high').length} 条</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>导出</Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>同步</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>新建线索</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                placeholder="搜索用户名/ID"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select
              options={[
                { label: '全部平台', value: '' },
                ...Object.entries(PLATFORM_LABELS).map(([v, l]) => ({ label: l, value: v }))
              ]}
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1) }}
              className="w-32"
            />
            <Select
              options={[
                { label: '全部意向', value: '' },
                ...Object.entries(INTENT_LEVEL_LABELS).map(([v, l]) => ({ label: l, value: v }))
              ]}
              value={intentFilter}
              onChange={(e) => { setIntentFilter(e.target.value); setPage(1) }}
              className="w-32"
            />
            <Select
              options={[
                { label: '全部状态', value: '' },
                { label: '新线索', value: 'new' },
                { label: '跟进中', value: 'processing' },
                { label: '已触达', value: 'contacted' },
                { label: '已转化', value: 'converted' },
                { label: '已流失', value: 'lost' },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-32"
            />
            {(search || platformFilter || intentFilter || statusFilter) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(''); setPlatformFilter(''); setIntentFilter(''); setStatusFilter(''); setPage(1) }}
              >
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table columns={columns} data={paged} rowKey="id" />
        <Pagination
          page={page}
          totalPages={Math.ceil(filtered.length / pageSize)}
          total={filtered.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </Card>

      {/* Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          title="线索详情"
          size="lg"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">用户昵称</p>
              <p className="text-sm font-medium">{showDetail.nickname}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">平台</p>
              <p className="text-sm font-medium">{PLATFORM_LABELS[showDetail.platform]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">意向度评分</p>
              <p className="text-sm font-medium">{showDetail.intentScore} / 100</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">意向等级</p>
              {intentBadge(showDetail.intentLevel)}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">行业</p>
              <p className="text-sm">{showDetail.industry ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">城市</p>
              <p className="text-sm">{showDetail.location ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">互动内容</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{showDetail.interactionContent ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">标签</p>
              <div className="flex flex-wrap gap-1.5">
                {showDetail.tags.map((tag) => (
                  <Badge key={tag} variant="default">{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">采集时间</p>
              <p className="text-sm">{formatDate(showDetail.createdAt, 'YYYY-MM-DD HH:mm')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">当前状态</p>
              {statusBadge(showDetail.status)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
