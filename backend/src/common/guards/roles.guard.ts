import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * 角色守卫：检查当前用户是否具备接口所需角色
 * - 无 @Roles 装饰器的接口，任何已登录用户均可访问
 * - 有 @Roles 装饰器的接口，用户 role 必须在允许列表中
 * - admin 角色拥有超级权限，可访问所有接口
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 未标注角色要求 → 放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('无权访问：未认证')
    }

    // admin 拥有超级权限
    if (user.role === 'admin') {
      return true
    }

    const hasRole = requiredRoles.includes(user.role)
    if (!hasRole) {
      throw new ForbiddenException(
        `无权访问：需要 [${requiredRoles.join('/')}] 角色，当前角色为 [${user.role}]`
      )
    }

    return true
  }
}
