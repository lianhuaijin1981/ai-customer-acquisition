import { Module, Global } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DB_TOKEN = Symbol('DRIZZLE_DB')

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL', 'postgres://postgres:password@localhost:5432/ai_customer')
        const client = postgres(url)
        return drizzle(client, { schema })
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
