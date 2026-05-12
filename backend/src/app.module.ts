import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { CommonModule } from './common/common.module'
import { AuthModule } from './modules/auth/auth.module'
import { LeadsModule } from './modules/leads/leads.module'
import { OutreachModule } from './modules/outreach/outreach.module'
import { CrmModule } from './modules/crm/crm.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { RiskModule } from './modules/risk/risk.module'
import { AccountsModule } from './modules/accounts/accounts.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { CollectorModule } from './modules/collector/collector.module'
import { SchedulerModule } from './modules/scheduler/scheduler.module'
import { WeworkModule } from './modules/wework/wework.module'
import { AbTestModule } from './modules/abtest/abtest.module'
import { ExportModule } from './modules/export/export.module'
import { HealthModule } from './modules/health/health.module'
import { AuditModule } from './modules/audit/audit.module'

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
    CommonModule,
    AuthModule,
    LeadsModule,
    OutreachModule,
    CrmModule,
    AnalyticsModule,
    RiskModule,
    AccountsModule,
    TemplatesModule,
    DashboardModule,
    CollectorModule,
    SchedulerModule,
    WeworkModule,
    AbTestModule,
    ExportModule,
    HealthModule,
    AuditModule,
  ],
})
export class AppModule {}
