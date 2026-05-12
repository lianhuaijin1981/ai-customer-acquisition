import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { AuditService } from '../../modules/audit/audit.service'
import { Reflector } from '@nestjs/core'

export const SKIP_AUDIT_KEY = 'skipAudit'
export const SkipAudit = () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
  if (descriptor) {
    Reflect.defineMetadata(SKIP_AUDIT_KEY, true, descriptor.value)
  } else {
    Reflect.defineMetadata(SKIP_AUDIT_KEY, true, target)
  }
}

/**
 * 审计日志拦截器
 * 自动记录所有 POST/PUT/PATCH/DELETE 操作
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name)

  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const method = request.method

    // 仅记录写操作
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle()
    }

    // 检查是否跳过审计
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skipAudit) {
      return next.handle()
    }

    const user = request.user
    const path = request.route?.path || request.url
    const resource = path.split('/')[2] || 'unknown' // /api/{resource}/...
    const action = this.methodToAction(method)
    const ip = request.ip || request.connection?.remoteAddress
    const userAgent = request.headers?.['user-agent']

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.log({
            userId: user?.id,
            username: user?.username,
            action,
            resource,
            detail: `${method} ${path}`,
            ip,
            userAgent,
            status: 'success',
          }).catch(err => this.logger.warn(`审计日志写入失败: ${err.message}`))
        },
        error: (error) => {
          this.auditService.log({
            userId: user?.id,
            username: user?.username,
            action,
            resource,
            detail: `${method} ${path} - ERROR: ${error.message}`,
            ip,
            userAgent,
            status: 'failed',
          }).catch(err => this.logger.warn(`审计日志写入失败: ${err.message}`))
        },
      }),
    )
  }

  private methodToAction(method: string): string {
    switch (method) {
      case 'POST': return 'create'
      case 'PUT':
      case 'PATCH': return 'update'
      case 'DELETE': return 'delete'
      default: return method.toLowerCase()
    }
  }
}
