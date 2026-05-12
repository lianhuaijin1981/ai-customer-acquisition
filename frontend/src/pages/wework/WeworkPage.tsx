import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weworkApi } from '@/services/api'
import toast from 'react-hot-toast'
import {
  MessageSquare, UserPlus, Settings, CheckCircle, XCircle,
  Send, Users, BarChart3, Plus, Trash2, RefreshCw, Download
} from 'lucide-react'
import { exportApi } from '@/services/api'

// ========== 统计卡片 ==========
function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '--'}</p>
      </div>
    </div>
  )
}

// ========== 配置弹窗 ==========
function AddConfigModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ corpId: '', corpName: '', agentId: '', secret: '' })
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => weworkApi.createConfig(data),
    onSuccess: () => { toast.success('配置已添加'); onCreated(); onClose() },
    onError: () => toast.error('添加失败'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">新增企业微信配置</h3>
        <div className="space-y-3">
          {[
            { key: 'corpId', label: '企业 ID (CorpId)', placeholder: 'wx...' },
            { key: 'corpName', label: '企业名称', placeholder: '可选' },
            { key: 'agentId', label: '应用 AgentId', placeholder: '1000xxx' },
            { key: 'secret', label: '应用 Secret', placeholder: '保密，仅传输不存明文' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm text-gray-600 mb-1 block">{label}</label>
              <input
                type={key === 'secret' ? 'password' : 'text'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">取消</button>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? '添加中...' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== 发送消息弹窗 ==========
function SendMessageModal({ onClose, configs }: { onClose: () => void; configs: any[] }) {
  const [form, setForm] = useState({ configId: configs[0]?.id || '', toUserId: '', content: '', batchMode: false, userIdsText: '' })
  const sendMutation = useMutation({
    mutationFn: (data: typeof form) =>
      data.batchMode
        ? weworkApi.batchSend({ configId: data.configId, userIds: data.userIdsText.split('\n').map(s => s.trim()).filter(Boolean), content: data.content })
        : weworkApi.sendMessage({ configId: data.configId, toUserId: data.toUserId, content: data.content }),
    onSuccess: (res: any) => {
      if (form.batchMode) toast.success(`批量发送完成：成功 ${res.success} / 失败 ${res.failed}`)
      else toast.success('消息发送成功')
      onClose()
    },
    onError: () => toast.error('发送失败'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">发送企微消息</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">选择企微配置</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.configId}
              onChange={e => setForm(f => ({ ...f, configId: e.target.value }))}
            >
              {configs.map((c: any) => <option key={c.id} value={c.id}>{c.corpName || c.corpId}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="batchMode" checked={form.batchMode} onChange={e => setForm(f => ({ ...f, batchMode: e.target.checked }))} />
            <label htmlFor="batchMode" className="text-sm text-gray-600">批量模式</label>
          </div>
          {form.batchMode ? (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">目标用户 ID（每行一个）</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="userId1&#10;userId2&#10;userId3"
                value={form.userIdsText}
                onChange={e => setForm(f => ({ ...f, userIdsText: e.target.value }))}
              />
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">目标用户 ID</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="企微用户 ID"
                value={form.toUserId}
                onChange={e => setForm(f => ({ ...f, toUserId: e.target.value }))}
              />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">消息内容</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="输入消息内容..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">取消</button>
          <button
            onClick={() => sendMutation.mutate(form)}
            disabled={sendMutation.isPending}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {sendMutation.isPending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ========== 主页面 ==========
export default function WeworkPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'configs' | 'friends' | 'messages'>('overview')
  const [showAddConfig, setShowAddConfig] = useState(false)
  const [showSendMsg, setShowSendMsg] = useState(false)

  const { data: stats } = useQuery({ queryKey: ['wework', 'stats'], queryFn: weworkApi.getStats, staleTime: 30000 })
  const { data: configs = [], refetch: refetchConfigs } = useQuery({ queryKey: ['wework', 'configs'], queryFn: weworkApi.getConfigs })
  const { data: friendsRes } = useQuery({ queryKey: ['wework', 'friends'], queryFn: () => weworkApi.getFriendRequests({ pageSize: 50 }), enabled: tab === 'friends' })
  const { data: msgsRes } = useQuery({ queryKey: ['wework', 'messages'], queryFn: () => weworkApi.getMessages({ pageSize: 50 }), enabled: tab === 'messages' })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => weworkApi.deleteConfig(id),
    onSuccess: () => { toast.success('已删除'); refetchConfigs() },
  })
  const testMutation = useMutation({
    mutationFn: (id: string) => weworkApi.testConnection(id),
    onSuccess: (res) => res.success ? toast.success(`连接成功：${res.corpName || '已验证'}`) : toast.error(`连接失败：${res.error}`),
  })

  const statusColor: Record<string, string> = { sent: 'text-green-600', pending: 'text-yellow-600', failed: 'text-red-600', accepted: 'text-blue-600' }
  const statusLabel: Record<string, string> = { sent: '已发送', pending: '等待中', failed: '失败', accepted: '已接受', active: '活跃', inactive: '未激活' }

  return (
    <div className="space-y-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企业微信 SCRM</h1>
          <p className="text-sm text-gray-500 mt-1">好友添加 · 私信发送 · 客户触达管理</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportApi.download({ type: 'customers', format: 'excel' })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> 导出客户
          </button>
          {(configs as any[]).length > 0 && (
            <button
              onClick={() => setShowSendMsg(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Send className="w-4 h-4" /> 发送消息
            </button>
          )}
          <button
            onClick={() => setShowAddConfig(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> 添加配置
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="活跃配置" value={stats?.activeConfigs} icon={Settings} color="bg-blue-500" />
        <StatCard label="好友申请" value={stats?.totalFriendRequests} icon={UserPlus} color="bg-purple-500" />
        <StatCard label="已发送申请" value={stats?.sentFriendRequests} icon={CheckCircle} color="bg-green-500" />
        <StatCard label="消息总数" value={stats?.totalMessages} icon={MessageSquare} color="bg-orange-500" />
        <StatCard label="已发送消息" value={stats?.sentMessages} icon={Send} color="bg-teal-500" />
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'overview', label: '概览', icon: BarChart3 },
            { key: 'configs', label: '企微配置', icon: Settings },
            { key: 'friends', label: '好友申请', icon: UserPlus },
            { key: 'messages', label: '消息记录', icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* 概览 */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">🚀 企业微信 SCRM 使用指南</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>在"企微配置"页签添加您的企业微信应用（CorpId + Secret）</li>
                  <li>点击"测试连接"验证配置是否生效</li>
                  <li>在"好友申请"中批量向线索发送好友请求</li>
                  <li>好友通过后，在"消息记录"中发送个性化私信</li>
                  <li>结合 A/B 话术测试模块提升消息转化率</li>
                </ol>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">好友申请成功率</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalFriendRequests ? Math.round((stats.sentFriendRequests / stats.totalFriendRequests) * 100) : 0}%
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">消息发送成功率</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalMessages ? Math.round((stats.sentMessages / stats.totalMessages) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 配置列表 */}
          {tab === 'configs' && (
            <div className="space-y-3">
              {(configs as any[]).length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无配置，点击右上角"添加配置"开始</p>
                </div>
              )}
              {(configs as any[]).map((cfg: any) => (
                <div key={cfg.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{cfg.corpName || cfg.corpId}</p>
                    <p className="text-sm text-gray-500">ID: {cfg.corpId} · AgentId: {cfg.agentId}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${cfg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel[cfg.status] || cfg.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testMutation.mutate(cfg.id)}
                      disabled={testMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <RefreshCw className="w-3 h-3" /> 测试连接
                    </button>
                    <button
                      onClick={() => { if (confirm('确认删除此配置？')) deleteMutation.mutate(cfg.id) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" /> 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 好友申请 */}
          {tab === 'friends' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-left">
                      <th className="py-3 pr-4">申请ID</th>
                      <th className="py-3 pr-4">微信ID</th>
                      <th className="py-3 pr-4">备注</th>
                      <th className="py-3 pr-4">添加方式</th>
                      <th className="py-3 pr-4">状态</th>
                      <th className="py-3">发送时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(friendsRes?.data || []).map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 text-xs text-gray-400">{r.id.slice(0, 8)}...</td>
                        <td className="py-3 pr-4">{r.wechatId || r.externalUserId || '-'}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.remark || '-'}</td>
                        <td className="py-3 pr-4">{r.addMethod}</td>
                        <td className="py-3 pr-4">
                          <span className={`font-medium ${statusColor[r.status] || 'text-gray-600'}`}>{statusLabel[r.status] || r.status}</span>
                        </td>
                        <td className="py-3 text-gray-500">{r.sentAt ? new Date(r.sentAt).toLocaleString('zh-CN') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!friendsRes?.data?.length && <div className="text-center py-8 text-gray-400">暂无好友申请记录</div>}
              </div>
            </div>
          )}

          {/* 消息记录 */}
          {tab === 'messages' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-left">
                      <th className="py-3 pr-4">收件人</th>
                      <th className="py-3 pr-4">消息内容</th>
                      <th className="py-3 pr-4">状态</th>
                      <th className="py-3 pr-4">发送时间</th>
                      <th className="py-3">回复内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(msgsRes?.data || []).map((m: any) => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4">{m.toUserId}</td>
                        <td className="py-3 pr-4 max-w-xs truncate">{m.content}</td>
                        <td className="py-3 pr-4">
                          <span className={`font-medium ${statusColor[m.status] || 'text-gray-600'}`}>{statusLabel[m.status] || m.status}</span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{m.sentAt ? new Date(m.sentAt).toLocaleString('zh-CN') : '-'}</td>
                        <td className="py-3 max-w-xs truncate text-gray-600">{m.replyContent || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!msgsRes?.data?.length && <div className="text-center py-8 text-gray-400">暂无消息记录</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddConfig && <AddConfigModal onClose={() => setShowAddConfig(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['wework'] })} />}
      {showSendMsg && <SendMessageModal onClose={() => setShowSendMsg(false)} configs={configs as any[]} />}
    </div>
  )
}
