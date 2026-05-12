import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { JwtService } from '@nestjs/jwt'
import { DB_TOKEN } from '../src/database/database.module'
import * as request from 'supertest'

describe('Auth (e2e)', () => {
  let app: INestApplication
  let jwtService: JwtService

  beforeAll(async () => {
    // We need to override the DB_TOKEN and JwtModule since
    // the real DB and JWT config may not be available in test.
    // Instead, we test against a fully-bootstrapped app with env vars set.
    process.env.APP_JWT_SECRET = 'test-secret-key-that-is-at-least-32-chars-long-for-testing'
    process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5432/ai_customer_test'
    process.env.REDIS_URL = ''

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DB_TOKEN)
      .useValue({})
      .compile()

    app = moduleFixture.createNestApplication()

    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    )

    const reflector = app.get(Reflector)
    // RolesGuard requires request.user which may not be set; skip it for e2e
    app.useGlobalGuards(new (class {
      canActivate() { return true }
    })())

    await app.init()

    jwtService = moduleFixture.get(JwtService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'wrong' })
        .expect(401)
    })

    it('should return 401 for wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401)
    })

    it('should return 200 and a JWT token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: '123456' })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined()
          expect(res.body.user).toBeDefined()
          expect(res.body.user.username).toBe('admin')
          expect(res.body.user).not.toHaveProperty('passwordHash')
        })
    })

    it('should return 401 when username is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: '123456' })
        .expect(401)
    })

    it('should return 401 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin' })
        .expect(401)
    })

    it('should return 401 for empty body', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(401)
    })
  })
})
