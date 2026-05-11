import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

export function formatPercent(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%'
}

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(date)
}

export const PLATFORM_LABELS: Record<string, string> = {
  weibo: '微博',
  xiaohongshu: '小红书',
  douyin: '抖音',
  zhihu: '知乎',
  wechat: '微信',
  other: '其他',
}

export const PLATFORM_COLORS: Record<string, string> = {
  weibo: '#e6162d',
  xiaohongshu: '#fe2c55',
  douyin: '#010101',
  zhihu: '#0084ff',
  wechat: '#07c160',
  other: '#6b7280',
}

export const INTENT_LEVEL_LABELS: Record<string, string> = {
  high: '高意向',
  medium: '中意向',
  low: '低意向',
}

export const INTENT_LEVEL_COLORS: Record<string, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#6b7280',
}

export const STATUS_LABELS: Record<string, string> = {
  new: '新线索',
  processing: '跟进中',
  contacted: '已触达',
  converted: '已转化',
  lost: '已流失',
  archived: '已归档',
  active: '正常',
  suspended: '封禁',
  warning: '预警',
  inactive: '未激活',
  pending: '待处理',
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
}
