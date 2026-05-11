import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 token
http.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || '请求失败，请稍后重试'

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      toast.error('登录已过期，请重新登录')
    } else if (status === 403) {
      toast.error('权限不足，无法执行该操作')
    } else if (status === 500) {
      toast.error('服务器异常，请联系管理员')
    } else {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default http
