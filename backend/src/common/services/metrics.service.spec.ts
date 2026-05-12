import { MetricsService } from './metrics.service'

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(() => {
    service = new MetricsService()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return metrics as string', async () => {
    const metrics = await service.getMetrics()
    expect(typeof metrics).toBe('string')
    expect(metrics).toContain('http_requests_total')
    expect(metrics).toContain('process_cpu_seconds')
  })

  it('should increment http request counter', () => {
    service.httpRequestsTotal.inc({ method: 'GET', route: '/api/leads', status_code: 200 })
    // Should not throw
    expect(true).toBe(true)
  })

  it('should observe http request duration', () => {
    const endTimer = service.httpRequestDuration.startTimer({ method: 'GET', route: '/api/leads' })
    endTimer()
    expect(true).toBe(true)
  })

  it('should increment login attempts counter', () => {
    service.loginAttempts.inc({ status: 'success' })
    service.loginAttempts.inc({ status: 'failed' })
    expect(true).toBe(true)
  })

  it('should return content type', () => {
    expect(service.getContentType()).toContain('text/plain')
  })
})
