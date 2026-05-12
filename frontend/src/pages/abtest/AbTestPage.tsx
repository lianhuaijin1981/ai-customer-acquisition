import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { abTestApi } from '@/services/api'
import toast from 'react-hot-toast'
import { FlaskConical, Play, Pause, CheckCircle, Plus, Trash2, BarChart3, TrendingUp, ArrowUpRight } from 'lucide-react'

// ========== 状态标签 ==========
const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  running: { label: '运行中', color: 'bg-green-100 text-green-700' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
}

// ========== 创建/编辑弹窗 ==========
function CreateTestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', splitRatio: 0.5, targetCount: 200,
    variantA: { content: '' }, variantB: { content: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => abTestApi.create(data),
    onSuccess: () => { toast.success('A/B 测试已创建'); onCreated(); onClose() },
    onError: () => toast.error('创建失败'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">创建 A/B 话术测试</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">测试名称 *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：新客首触话术 v1 vs v2"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">目标发送量</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.targetCount}
                onChange={e => setForm(f => ({ ...f, targetCount: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">测试描述</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="可选备注"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">流量分配：A 组 {Math.round(form.splitRatio * 100)}% / B 组 {Math.round((1 - form.splitRatio) * 100)}%</label>
            <input
              type="range" min={0.1} max={0.9} step={0.05}
              className="w-full accent-blue-600"
              value={form.splitRatio}
              onChange={e => setForm(f => ({ ...f, splitRatio: Number(e.target.value) }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-600 mb-1 block">🅐 版本 A</label>
              <textarea
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                placeholder="输入话术 A 的内容..."
                value={form.variantA.content}
                onChange={e => setForm(f => ({ ...f, variantA: { ...f.variantA, content: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-orange-600 mb-1 block">🅑 版本 B</label>
              <textarea
                className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={5}
                placeholder="输入话术 B 的内容..."
                value={form.variantB.content}
                onChange={e => setForm(f => ({ ...f, variantB: { ...f.variantB, content: e.target.value } }))}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">取消</button>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.name || !form.variantA.content || !form.variantB.content}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? '创建中...' : '创建测试'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== 分析详情弹窗 ==========
function AnalysisModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['abtest', 'analysis', testId],
    queryFn: () => abTestApi.getAnalysis(testId),
  })

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center">加载分析数据中...</div>
    </div>
  )

  const a = analysis?.variantA
  const b = analysis?.variantB

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">效果分析：{analysis?.test?.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* 胜出版本 */}
        {analysis?.winner && (
          <div className={`rounded-xl p-4 mb-5 ${analysis.winner === 'A' ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold">当前领先版本：{analysis.winner === 'A' ? '🅐 版本 A' : '🅑 版本 B'}</span>
              {analysis.lift !== '0%' && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <ArrowUpRight className="w-4 h-4" /> 回复率领先 {analysis.lift}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analysis.recommendation}</p>
          </div>
        )}

        {/* 对比数据 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { v: a, label: '🅐 版本 A', color: 'border-blue-300 bg-blue-50/30' },
            { v: b, label: '🅑 版本 B', color: 'border-orange-300 bg-orange-50/30' },
          ].map(({ v, label, color }) => (
            <div key={label} className={`border-2 rounded-xl p-4 ${color}`}>
              <p className="font-semibold mb-3">{label}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">发送量</span>
                  <span className="font-medium">{v?.sentCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">回复量</span>
                  <span className="font-medium">{v?.replyCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">回复率</span>
                  <span className="font-bold text-lg">{((v?.replyRate || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">转化量</span>
                  <span className="font-medium">{v?.convertCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">转化率</span>
                  <span className="font-bold">{((v?.convertRate || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">话术内容</p>
                <p className="text-sm text-gray-700 line-clamp-3">{v?.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 进度 */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>测试进度</span>
            <span>{analysis?.totalSent} / {analysis?.test?.targetCount} 已发送（{analysis?.progress}%）</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${analysis?.progress || 0}%` }} />
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">关闭</button>
      </div>
    </div>
  )
}

// ========== 主页面 ==========
export default function AbTestPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  const { data: statsData } = useQuery({ queryKey: ['abtest', 'stats'], queryFn: abTestApi.getStats })
  const { data: testsRes } = useQuery({ queryKey: ['abtest', 'list'], queryFn: () => abTestApi.getList({ pageSize: 50 }) })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => abTestApi.updateStatus(id, status),
    onSuccess: () => { toast.success('状态已更新'); qc.invalidateQueries({ queryKey: ['abtest'] }) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => abTestApi.delete(id),
    onSuccess: () => { toast.success('已删除'); qc.invalidateQueries({ queryKey: ['abtest'] }) },
  })

  const tests = testsRes?.data || []

  return (
    <div className="space-y-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B 话术测试</h1>
          <p className="text-sm text-gray-500 mt-1">对比两版话术效果，数据驱动最优选择</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> 新建测试
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '测试总数', value: statsData?.total, icon: FlaskConical, color: 'bg-purple-500' },
          { label: '运行中', value: statsData?.running, icon: Play, color: 'bg-green-500' },
          { label: '已完成', value: statsData?.completed, icon: CheckCircle, color: 'bg-blue-500' },
          { label: '草稿', value: statsData?.draft, icon: Pause, color: 'bg-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value ?? '--'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 测试列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-gray-800">测试列表</h2>
          <span className="ml-auto text-sm text-gray-400">{tests.length} 个测试</span>
        </div>
        <div className="divide-y divide-gray-100">
          {tests.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FlaskConical className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-medium">还没有 A/B 测试</p>
              <p className="text-sm mt-1">点击右上角"新建测试"开始优化您的话术</p>
            </div>
          )}
          {tests.map((test: any) => {
            const variants = test.variants || []
            const varA = variants.find((v: any) => v.variant === 'A')
            const varB = variants.find((v: any) => v.variant === 'B')
            const sc = statusConfig[test.status] || statusConfig.draft

            return (
              <div key={test.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{test.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                    </div>
                    {test.description && <p className="text-sm text-gray-500 mb-2 truncate">{test.description}</p>}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>流量：A {Math.round(test.splitRatio * 100)}% / B {Math.round((1 - test.splitRatio) * 100)}%</span>
                      <span>目标：{test.targetCount} 发送</span>
                    </div>
                    {/* 变体预览 */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {[{ v: varA, label: '🅐 A', color: 'border-blue-200 bg-blue-50' }, { v: varB, label: '🅑 B', color: 'border-orange-200 bg-orange-50' }].map(({ v, label, color }) => (
                        <div key={label} className={`rounded-lg p-2 border text-xs ${color}`}>
                          <span className="font-medium">{label}</span>
                          <span className="text-gray-500 ml-2">回复率 {((v?.replyRate || 0) * 100).toFixed(1)}%</span>
                          <p className="mt-1 text-gray-700 line-clamp-2">{v?.content || '暂无内容'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setAnalysisId(test.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
                    >
                      <BarChart3 className="w-3 h-3" /> 分析
                    </button>
                    {test.status === 'draft' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: test.id, status: 'running' })}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Play className="w-3 h-3" /> 启动
                      </button>
                    )}
                    {test.status === 'running' && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ id: test.id, status: 'paused' })}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50"
                        >
                          <Pause className="w-3 h-3" /> 暂停
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ id: test.id, status: 'completed' })}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          <CheckCircle className="w-3 h-3" /> 完成
                        </button>
                      </>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: test.id, status: 'running' })}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Play className="w-3 h-3" /> 继续
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('确认删除此测试？')) deleteMutation.mutate(test.id) }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showCreate && <CreateTestModal onClose={() => setShowCreate(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['abtest'] })} />}
      {analysisId && <AnalysisModal testId={analysisId} onClose={() => setAnalysisId(null)} />}
    </div>
  )
}
