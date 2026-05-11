import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { LeadsModule } from './modules/leads/leads.module'
import { OutreachModule } from './modules/outreach/outreach.module'
import { CrmModule } from './modules/crm/crm.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { RiskModule } from './modules/risk/risk.module'
import { AccountsModule } from './modules/accounts/accounts.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    LeadsModule,
    OutreachModule,
    CrmModule,
    AnalyticsModule,
    RiskModule,
    AccountsModule,
    TemplatesModule,
    DashboardModule,
  ],
})
export class AppModule {}
