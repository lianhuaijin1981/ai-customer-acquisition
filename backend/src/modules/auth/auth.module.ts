import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('APP_JWT_SECRET')
        if (!secret) {
          throw new Error(
            'FATAL: APP_JWT_SECRET environment variable is required. ' +
            'Set a strong random string (≥32 chars) in your .env file.'
          )
        }
        if (secret.length < 32) {
          throw new Error(
            'FATAL: APP_JWT_SECRET must be at least 32 characters long. ' +
            `Current length: ${secret.length}`
          )
        }
        const insecureDefaults = [
          'fallback-secret',
          'change-me-in-production',
          'your_jwt_secret_here_change_in_production',
          'secret',
          'jwt-secret',
        ]
        if (insecureDefaults.includes(secret.toLowerCase())) {
          throw new Error(
            'FATAL: APP_JWT_SECRET is set to a known insecure default value. ' +
            'Please use a cryptographically random string for production.'
          )
        }
        return {
          secret,
          signOptions: { expiresIn: config.get('APP_JWT_EXPIRES_IN', '7d') },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
