import { useState } from 'react'
import { exportApi } from '@/services/api'
import { Download, FileSpreadsheet, FileText, Users, Send, UserCheck, BarChart3, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

type ExportType = 'leads' | 'outreach_tasks' | 'outreach_logs' | 'customers' | 'analytics' | 'templates'
type ExportFormat = 'excel' | 'csv'

const exportItems = [
  {
    type: 'leads' as ExportType,
    icon: Users,
    title: '线索数据',
    desc: '导出线索池全量数据，包含意向评分、标签、状态等',
    color: 'bg-blue-500',
    fields: ['平台', '昵称', '意向评分', '意向等级', '状态', '行业', '地区', '粉丝数', '标签', '创建时间'],
  },
  {
    type: 'outreach_tasks' as ExportType,
    icon: Send,
    title: '触达任务',
    desc: '导出所有触达任务的配置和执行数据',
    color: 'bg-purple-500',
    fields: ['任务名称', '平台', '状态', '已发送', '已回复', '已转化', '回复率', '转化率'],
  },
  {
    type: 'outreach_logs' as ExportType,
    icon: MessageSquare,
    title: '触达记录',
    desc: '导出详细的消息发送/回复日志，最多 5 万条',
    color: 'bg-orange-500',
    fields: ['任务ID', '线索ID', '发送内容', '状态', '发送时间', '回复内容'],
  },
  {
    type: 'customers' as ExportType,
    icon: UserCheck,
    title: '客户数据',
    desc: '导出私域客户库，包含客户等级、互动记录等',
    color: 'bg-green-500',
    fields: ['微信ID', '姓名', '来源平台', '状态', '客户等级', '意向评分', '标签', '备注'],
  },
  {
    type: 'analytics' as ExportType,
    icon: BarChart3,
    title: '运营数据',
    desc: '导出每日运营指标数据（线索/发送/回复/转化等）',
    color: 'bg-teal-500',
    fields: ['日期', '平台', '线索量', '发送量', '回复量', '加微量', '转化量', '各类转化率'],
  },
  {
    type: 'templates' as ExportType,
    icon: FileText,
    title: '话术模板',
    desc: '导出全量话术模板，包含使用次数和效果数据',
    color: 'bg-pink-500',
    fields: ['模板名称', '行业', '场景', '回复率', '内容摘要', '变量列表'],
  },
]

export default function ExportPage() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    platform: '',
    status: '',
  })
  const [format, setFormat] = useState<ExportFormat>('excel')
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleExport = (type: ExportType) => {
    setDownloading(type)
    try {
      exportApi.download({ type, format, ...filters })
      toast.success('文件下载已开始')
    } catch {
      toast.error('导出失败')
    } finally {
      setTimeout(() => setDownloading(null), 1500)
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据导出</h1>
        <p className="text-sm text-gray-500 mt-1">将平台数据导出为 Excel 或 CSV 文件</p>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">导出筛选条件</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">开始日期</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">结束日期</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">平台筛选</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.platform}
              onChange={e => setFilters(f => ({ ...f, platform: e.target.value }))}
            >
              <option value="">全部平台</option>
              <option value="weibo">微博</option>
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="kuaishou">快手</option>
              <option value="wechat">微信</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">状态筛选</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：active、new、pending..."
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            />
          </div>
        </div>

        {/* 格式选择 */}
        <div className="mt-4 flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700">导出格式：</span>
          {([
            { value: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, desc: '支持样式，推荐' },
            { value: 'csv', label: 'CSV (.csv)', icon: FileText, desc: '通用格式，兼容性佳' },
          ] as const).map(({ value, label, icon: Icon, desc }) => (
            <label key={value} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${format === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="format" value={value} checked={format === value} onChange={() => setFormat(value)} className="hidden" />
              <Icon className={`w-5 h-5 ${format === value ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <p className={`text-sm font-medium ${format === value ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 导出项目卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportItems.map(({ type, icon: Icon, title, desc, color, fields }) => (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
            {/* 字段列表 */}
            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
              {fields.map(f => (
                <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f}</span>
              ))}
            </div>
            <button
              onClick={() => handleExport(type)}
              disabled={downloading === type}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${downloading === type ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Download className="w-4 h-4" />
              {downloading === type ? '准备下载...' : `导出 ${format === 'excel' ? 'Excel' : 'CSV'}`}
            </button>
          </div>
        ))}
      </div>

      {/* 提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <strong>注意：</strong> Excel 导出单次最多 1 万条（触达记录 5 万条），建议配合日期/平台筛选导出分段数据。导出文件将自动下载到浏览器默认下载目录。
      </div>
    </div>
  )
}
