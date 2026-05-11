import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, Pagination } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { STATUS_LABELS, formatDate } from '@/utils/helpers'
import type { Template, TemplateStatus, TemplateScene } from '@/types'
import { Plus, Edit, Copy, BarChart2, Wand2, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const MOCK_TEMPLATES: Template[] = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  name: ['互联网首次触达', '教育培训加微', '快消品介绍', '金融理财邀约', '通用跟进', '高意向促单'][i % 6],
  industry: ['互联网', '教育', '快消', '金融', '通用'][i % 5],
  scene: (['first_contact', 'follow_up', 'add_wechat', 'nurture'] as TemplateScene[])[i % 4],
  content: `您好，看到您分享的内容，感觉和我们的产品很匹配。我们专注于${['互联网', '教育', '快消', '金融'][i % 4]}领域，最近有个限时资料想分享给您，方便加个微信吗？`,
  variables: ['nickname', 'platform', 'industry'],
  version: Math.floor(i / 3) + 1,
  status: (['active', 'inactive', 'testing'] as TemplateStatus[])[i % 3],
  useCount: 50 + i * 30,
  replyRate: 15 + (i * 3) % 20,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

const SCENE_LABELS: Record<TemplateScene, string> = {
  first_contact: '首次触达',
  follow_up: '跟进话术',
  add_wechat: '引导加微',
  nurture: '长期培育',
}

const statusBadge = (s: TemplateStatus) => {
  const map = { active: 'success', inactive: 'gray', testing: 'warning' } as const
  const labels = { active: '启用', inactive: '停用', testing: '测试中' }
  return <Badge variant={map[s]}>{labels[s]}</Badge>
}

export default function TemplatesPage() {
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [showAiGen, setShowAiGen] = useState(false)
  const [aiGenLoading, setAiGenLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const pageSize = 8
  const paged = MOCK_TEMPLATES.slice((page - 1) * pageSize, page * pageSize)

  const handleAiGenerate = async () => {
    setAiGenLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setGeneratedContent('您好，看到您在小红书分享的内容，非常专业！我们有一份关于行业增长的干货资料想和您交流，能加个微信方便发给您吗？（平台不好传文件，微信更方便）')
    setAiGenLoading(false)
  }

  const columns = [
    {
      key: 'name', title: '模板名称', width: '180px',
      render: (v: unknown, row: Template) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{String(v)}</p>
          <p className="text-xs text-gray-400">v{row.version} · {row.industry}</p>
        </div>
      ),
    },
    {
      key: 'scene', title: '使用场景', width: '100px',
      render: (v: unknown) => <Badge variant="purple">{SCENE_LABELS[v as TemplateScene]}</Badge>,
    },
    {
      key: 'status', title: '状态', width: '90px',
      render: (v: unknown) => statusBadge(v as TemplateStatus),
    },
    {
      key: 'content', title: '话术预览', width: '260px',
      render: (v: unknown) => (
        <p className="text-xs text-gray-500 truncate max-w-64">{String(v)}</p>
      ),
    },
    {
      key: 'useCount', title: '使用次数', width: '90px', align: 'center' as const,
      render: (v: unknown) => <span className="text-sm font-medium text-gray-700">{String(v)}</span>,
    },
    {
      key: 'replyRate', title: '回复率', width: '90px', align: 'center' as const,
      render: (v: unknown) => <span className={`text-sm font-medium ${Number(v) >= 20 ? 'text-emerald-600' : 'text-gray-600'}`}>{String(v)}%</span>,
    },
    {
      key: 'id', title: '操作', width: '120px', align: 'center' as const,
      render: (_: unknown) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm"><Copy className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm"><BarChart2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">话术模板库</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            共 {MOCK_TEMPLATES.length} 个模板 · 启用 {MOCK_TEMPLATES.filter(t => t.status === 'active').length} 个
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Wand2 className="h-4 w-4" />} onClick={() => setShowAiGen(true)}>
            AI 生成话术
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            新建模板
          </Button>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={paged} rowKey="id" />
        <Pagination
          page={page}
          totalPages={Math.ceil(MOCK_TEMPLATES.length / pageSize)}
          total={MOCK_TEMPLATES.length}
          pageSize={pageSize}
          onChange={setPage}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建话术模板"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={() => { toast.success('模板已创建！'); setShowCreate(false) }}>保存模板</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="模板名称" placeholder="请输入模板名称" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="行业分类"
              options={[
                { label: '互联网', value: 'internet' },
                { label: '教育', value: 'edu' },
                { label: '快消', value: 'fmcg' },
                { label: '金融', value: 'finance' },
                { label: '通用', value: 'general' },
              ]}
            />
            <Select
              label="使用场景"
              options={Object.entries(SCENE_LABELS).map(([v, l]) => ({ label: l, value: v }))}
            />
          </div>
          <Textarea
            label="话术内容"
            placeholder="请输入话术内容，支持变量 {nickname}、{platform}、{industry}"
            rows={5}
          />
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>合规提示：</strong>话术不得包含手机号、微信号等联系方式，引导加微需使用合规理由（如 "平台不方便传文件"）。
          </div>
        </div>
      </Modal>

      {/* AI Generate Modal */}
      <Modal
        open={showAiGen}
        onClose={() => { setShowAiGen(false); setGeneratedContent('') }}
        title="AI 智能生成话术"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowAiGen(false); setGeneratedContent('') }}>取消</Button>
            {generatedContent && (
              <Button onClick={() => { toast.success('话术已保存到模板库！'); setShowAiGen(false); setGeneratedContent('') }}>
                保存为模板
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="目标行业"
              options={[
                { label: '互联网科技', value: 'internet' },
                { label: '教育培训', value: 'edu' },
                { label: '快消零售', value: 'fmcg' },
                { label: '金融理财', value: 'finance' },
              ]}
            />
            <Select
              label="触达场景"
              options={Object.entries(SCENE_LABELS).map(([v, l]) => ({ label: l, value: v }))}
            />
          </div>
          <Textarea
            label="产品/服务描述"
            placeholder="简要描述您的产品或服务特点，AI 将据此生成个性化话术..."
            rows={3}
          />
          <Button className="w-full" leftIcon={<Wand2 className="h-4 w-4" />} loading={aiGenLoading} onClick={handleAiGenerate}>
            {aiGenLoading ? '生成中...' : '生成话术'}
          </Button>
          {generatedContent && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">生成结果：</p>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-gray-700 leading-relaxed">
                {generatedContent}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                已通过合规检测，无敏感词
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
