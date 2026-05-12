import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { MetricsService } from '../services/metrics.service'

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const method = request.method
    const route = request.route?.path || request.url

    const endTimer = this.metricsService.httpRequestDuration.startTimer({
      method,
      route,
    })

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          })
          endTimer()
        },
        error: (error) => {
          const statusCode = error.status || 500
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          })
          endTimer()
        },
      }),
    )
  }
}
