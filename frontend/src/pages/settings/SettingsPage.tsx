import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { User, Bell, Shield, Key, Database, Plug } from 'lucide-react'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'profile', label: '账号信息', icon: User },
  { id: 'notify', label: '通知设置', icon: Bell },
  { id: 'security', label: '安全设置', icon: Shield },
  { id: 'api', label: 'API 配置', icon: Key },
  { id: 'data', label: '数据管理', icon: Database },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900">系统设置</h2>
        <p className="text-sm text-gray-500 mt-0.5">管理账号信息、通知偏好与系统配置</p>
      </div>

      <div className="flex gap-6">
        {/* Tab List */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>账号信息</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">A</div>
                  <div>
                    <p className="font-medium text-gray-900">管理员</p>
                    <p className="text-sm text-gray-500">admin@company.com</p>
                    <Badge variant="purple" className="mt-1">超级管理员</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">更换头像</Button>
                </div>
                <Input label="用户名" defaultValue="admin" />
                <Input label="邮箱" type="email" defaultValue="admin@company.com" />
                <Input label="手机号" defaultValue="138****8888" />
                <Button onClick={() => toast.success('信息已保存！')}>保存更改</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notify' && (
            <Card>
              <CardHeader><CardTitle>通知设置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: '风控预警通知', desc: '账号异常、触达超限等风险事件', enabled: true },
                  { label: '任务完成通知', desc: '触达任务完成时通知', enabled: true },
                  { label: '日报推送', desc: '每日运营数据汇总', enabled: false },
                  { label: '线索突破通知', desc: '高意向线索出现时实时通知', enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <div className={`w-11 h-6 ${item.enabled ? 'bg-blue-600' : 'bg-gray-300'} rounded-full relative cursor-pointer transition-colors`}
                      onClick={() => toast.success('设置已更新')}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow transition-all ${item.enabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                ))}
                <Input label="告警邮件地址" defaultValue="alert@company.com" />
                <Button onClick={() => toast.success('通知设置已保存！')}>保存</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader><CardTitle>AI 大模型 API 配置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="当前使用模型"
                  options={[
                    { label: 'KIMI (月之暗面)', value: 'kimi' },
                    { label: 'GPT-4o (OpenAI)', value: 'gpt4o' },
                    { label: '文心一言 (百度)', value: 'wenxin' },
                    { label: '通义千问 (阿里)', value: 'qianwen' },
                    { label: '智谱 GLM (清华)', value: 'glm' },
                  ]}
                  defaultValue="kimi"
                />
                <Input label="API Key" type="password" placeholder="请输入 API Key" defaultValue="sk-****************************" />
                <Input label="API Base URL（可选）" placeholder="默认使用官方地址" />
                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  API Key 已加密存储，系统仅在生成话术时调用，不会用于其他用途。
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast.success('API 连通性测试通过 ✓')}>测试连接</Button>
                  <Button onClick={() => toast.success('API 配置已保存！')}>保存</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader><CardTitle>安全设置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="当前密码" type="password" placeholder="请输入当前密码" />
                <Input label="新密码" type="password" placeholder="请输入新密码（≥8位）" />
                <Input label="确认新密码" type="password" placeholder="请再次输入新密码" />
                <Button onClick={() => toast.success('密码已修改！')}>修改密码</Button>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">双因素认证 (2FA)</p>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-700">TOTP 验证器</p>
                      <p className="text-xs text-gray-500">使用 Google Authenticator 等应用</p>
                    </div>
                    <Badge variant="gray">未启用</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader><CardTitle>数据管理</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '线索数据', count: '1,234', size: '45 MB' },
                    { label: '触达记录', count: '8,902', size: '128 MB' },
                    { label: '客户数据', count: '456', size: '12 MB' },
                    { label: '运营日志', count: '28 天', size: '89 MB' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{item.count}</p>
                      <p className="text-xs text-gray-400">{item.size}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => toast.success('数据导出任务已启动，完成后将发送邮件通知')}>
                    导出全部数据
                  </Button>
                  <Button variant="secondary" onClick={() => toast.success('清理 30 天前的过期线索，预计释放 23 MB 空间')}>
                    清理过期数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
