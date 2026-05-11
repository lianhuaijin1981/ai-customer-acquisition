import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, Pagination } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { PLATFORM_LABELS, formatDate, getRelativeTime } from '@/utils/helpers'
import type { Customer, CustomerStatus, CustomerTier, LeadPlatform } from '@/types'
import { UserCheck, Tag, MessageSquare, Star, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 28 }, (_, i) => ({
  id: String(i + 1),
  leadId: String(i + 1),
  wechatId: i % 5 !== 0 ? `wx_${1000 + i}` : undefined,
  name: ['王小明', '李佳佳', '张宇航', '陈思远', '刘晓雨', '赵云龙', '周丽华', '吴建国'][i % 8],
  sourcePlatform: (['weibo', 'xiaohongshu', 'douyin', 'zhihu'] as LeadPlatform[])[i % 4],
  status: (['pending', 'added', 'active', 'inactive'] as CustomerStatus[])[i % 4],
  tier: (['A', 'B', 'C', 'D'] as CustomerTier[])[i % 4],
  intentScore: 55 + (i * 7) % 40,
  tags: ['来源微博', i % 2 === 0 ? '高意向' : '中意向', i % 3 === 0 ? '企业主' : '个人用户'],
  assignedSales: i % 3 !== 0 ? ['张销售', '李销售', '王销售'][i % 3] : undefined,
  addedAt: i % 5 !== 0 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
  lastInteractAt: new Date(Date.now() - i * 3600000).toISOString(),
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

const tierColors: Record<CustomerTier, string> = {
  A: 'bg-red-100 text-red-700',
  B: 'bg-orange-100 text-orange-700',
  C: 'bg-blue-100 text-blue-700',
  D: 'bg-gray-100 text-gray-600',
}

const statusColors: Record<CustomerStatus, 'default' | 'success' | 'warning' | 'gray' | 'danger'> = {
  pending: 'warning',
  added: 'default',
  active: 'success',
  inactive: 'gray',
  churned: 'danger',
}

export default function CrmPage() {
  const [page, setPage] = useState(1)
  const [showDetail, setShowDetail] = useState<Customer | null>(null)
  const pageSize = 10
  const paged = MOCK_CUSTOMERS.slice((page - 1) * pageSize, page * pageSize)

  const tierStats = (['A', 'B', 'C', 'D'] as CustomerTier[]).map(tier => ({
    tier,
    count: MOCK_CUSTOMERS.filter(c => c.tier === tier).length,
  }))

  const columns = [
    {
      key: 'name', title: '客户', width: '160px',
      render: (v: unknown, row: Customer) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {row.name[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-400">{row.wechatId ?? '待加微'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tier', title: '层级', width: '70px', align: 'center' as const,
      render: (v: unknown) => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${tierColors[v as CustomerTier]}`}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'status', title: '状态', width: '90px',
      render: (v: unknown) => <Badge variant={statusColors[v as CustomerStatus]}>
        {{ pending: '待加微', added: '已添加', active: '活跃', inactive: '沉默', churned: '已流失' }[v as string]}
      </Badge>,
    },
    {
      key: 'intentScore', title: '意向度', width: '80px', align: 'center' as const,
      render: (v: unknown) => <span className="text-sm font-medium text-gray-700">{String(v)}分</span>,
    },
    {
      key: 'sourcePlatform', title: '来源', width: '80px',
      render: (v: unknown) => <span className="text-sm text-gray-500">{PLATFORM_LABELS[v as string]}</span>,
    },
    {
      key: 'tags', title: '标签', width: '200px',
      render: (v: unknown) => (
        <div className="flex flex-wrap gap-1">
          {(v as string[]).slice(0, 2).map((tag) => (
            <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'assignedSales', title: '负责销售', width: '90px',
      render: (v: unknown) => <span className="text-sm text-gray-600">{String(v) || '未分配'}</span>,
    },
    {
      key: 'lastInteractAt', title: '最近互动', width: '100px',
      render: (v: unknown) => <span className="text-xs text-gray-400">{getRelativeTime(v as string)}</span>,
    },
    {
      key: 'id', title: '操作', width: '100px', align: 'center' as const,
      render: (_: unknown, row: Customer) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowDetail(row)}>详情</Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">私域承接 · SCRM</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {MOCK_CUSTOMERS.length} 位客户 · 活跃 {MOCK_CUSTOMERS.filter(c => c.status === 'active').length} 位
          </p>
        </div>
        <Button size="sm" leftIcon={<TrendingUp className="h-4 w-4" />}>
          智能分层
        </Button>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-4 gap-4">
        {tierStats.map(({ tier, count }) => (
          <div key={tier} className={`rounded-xl p-4 border border-gray-100 ${tierColors[tier].split(' ')[0]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{tier} 类客户</span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${tierColors[tier]}`}>{tier}</span>
            </div>
            <p className={`text-2xl font-bold ${tierColors[tier].split(' ')[1]}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">
              {tier === 'A' ? '高意向，优先跟进' : tier === 'B' ? '中高意向，重点培育' : tier === 'C' ? '中意向，定期触达' : '低意向，自动培育'}
            </p>
          </div>
        ))}
      </div>

      {/* Customer Table */}
      <Card>
        <Table columns={columns} data={paged} rowKey="id" />
        <Pagination
          page={page}
          totalPages={Math.ceil(MOCK_CUSTOMERS.length / pageSize)}
          total={MOCK_CUSTOMERS.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </Card>

      {/* Customer Detail Modal */}
      {showDetail && (
        <Modal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          title="客户详情"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowDetail(null)}>关闭</Button>
              <Button onClick={() => toast.success('已分配销售！')}>分配销售</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-white flex items-center justify-center text-xl font-bold">
                {showDetail.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{showDetail.name}</h3>
                <p className="text-sm text-gray-500">{showDetail.wechatId ?? '未加微'} · {PLATFORM_LABELS[showDetail.sourcePlatform]}</p>
              </div>
              <div className="ml-auto">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${tierColors[showDetail.tier]}`}>
                  {showDetail.tier}类
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{showDetail.intentScore}</p>
                <p className="text-xs text-gray-500">意向度评分</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Badge variant={statusColors[showDetail.status]}>
                  {{ pending: '待加微', added: '已添加', active: '活跃', inactive: '沉默', churned: '已流失' }[showDetail.status]}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">当前状态</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-gray-900">{showDetail.assignedSales ?? '未分配'}</p>
                <p className="text-xs text-gray-500">负责销售</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Tag className="h-4 w-4" />客户标签
              </p>
              <div className="flex flex-wrap gap-1.5">
                {showDetail.tags.map((tag) => (
                  <Badge key={tag} variant="default">{tag}</Badge>
                ))}
                <button className="px-2 py-0.5 text-xs border border-dashed border-gray-300 rounded-full text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  + 添加标签
                </button>
              </div>
            </div>
            <Textarea label="跟进备注" placeholder="记录跟进情况..." rows={3} />
          </div>
        </Modal>
      )}
    </div>
  )
}
