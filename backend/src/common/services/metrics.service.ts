import { Injectable } from '@nestjs/common'
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class MetricsService {
  private readonly registry: Registry

  // HTTP 请求计数器
  readonly httpRequestsTotal: Counter

  // HTTP 请求耗时
  readonly httpRequestDuration: Histogram

  // 活跃连接数
  readonly activeConnections: Gauge

  // 业务指标
  readonly leadsCollected: Counter
  readonly messagesSent: Counter
  readonly loginAttempts: Counter

  constructor() {
    this.registry = new Registry()

    // 收集默认 Node.js 指标
    collectDefaultMetrics({ register: this.registry })

    // HTTP 请求总数
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    })

    // HTTP 请求耗时
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    })

    // 活跃连接数
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    })

    // 线索采集计数
    this.leadsCollected = new Counter({
      name: 'leads_collected_total',
      help: 'Total number of leads collected',
      labelNames: ['platform'],
      registers: [this.registry],
    })

    // 消息发送计数
    this.messagesSent = new Counter({
      name: 'messages_sent_total',
      help: 'Total number of messages sent',
      labelNames: ['platform', 'status'],
      registers: [this.registry],
    })

    // 登录尝试计数
    this.loginAttempts = new Counter({
      name: 'login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status'],
      registers: [this.registry],
    })
  }

  /**
   * 获取 Prometheus 格式的指标数据
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  /**
   * 获取 Content-Type
   */
  getContentType(): string {
    return this.registry.contentType
  }
}
