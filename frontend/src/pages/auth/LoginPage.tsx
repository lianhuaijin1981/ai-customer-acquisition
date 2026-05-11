import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: 'admin', password: '123456' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Demo login - in production calls POST /api/auth/login
      await new Promise((res) => setTimeout(res, 800))
      if (form.username && form.password) {
        setAuth('demo-token-xxx', {
          id: '1',
          username: form.username,
          email: `${form.username}@company.com`,
          role: 'admin',
          createdAt: new Date().toISOString(),
        })
        toast.success('登录成功！')
      } else {
        toast.error('请填写用户名和密码')
      }
    } catch {
      toast.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-2">欢迎登录</h2>
      <p className="text-sm text-gray-500 mb-6">AI 智能获客平台管理系统</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="用户名"
          placeholder="请输入用户名"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <Input
          label="密码"
          type="password"
          placeholder="请输入密码"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded" defaultChecked />
            记住我
          </label>
          <button type="button" className="text-blue-600 hover:underline">
            忘记密码？
          </button>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          登录
        </Button>
      </form>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <strong>演示账号：</strong> admin / 123456
      </div>
    </div>
  )
}
