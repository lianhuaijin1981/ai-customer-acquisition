import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * 装饰器：标注接口所需的角色
 * 用法: @Roles('admin') 或 @Roles('admin', 'operator')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
