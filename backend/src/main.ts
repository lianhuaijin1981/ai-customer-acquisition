import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  })
  const logger = new Logger('Bootstrap')

  // 全局前缀
  app.setGlobalPrefix('api')

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  )

  // Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('AI 智能获客平台 API')
    .setDescription('全链路 AI 智能获客平台接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.APP_PORT || 8000
  await app.listen(port)
  logger.log(`🚀 Server running on http://localhost:${port}`)
  logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`)
}
bootstrap()
