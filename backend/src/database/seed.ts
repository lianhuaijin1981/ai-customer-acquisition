/**
 * 数据库种子脚本 - 初始化基础数据
 * 运行方式: npx ts-node -r tsconfig-paths/register src/database/seed.ts
 */

import 'reflect-metadata'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import * as schema from './schema'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/ai_customer'

async function seed() {
  const client = postgres(DATABASE_URL)
  const db = drizzle(client, { schema })

  console.log('🌱 开始数据库种子初始化...')

  // ========== 1. 初始化管理员账号 ==========
  const adminId = uuidv4()
  const passwordHash = await bcrypt.hash('123456', 10)

  try {
    await db.insert(schema.users).values({
      id: adminId,
      username: 'admin',
      email: 'admin@ai-customer.com',
      passwordHash,
      role: 'admin',
    }).onConflictDoNothing()
    console.log('✅ 管理员账号初始化完成 (admin / 123456)')
  } catch (e) {
    console.log('ℹ️  管理员账号已存在，跳过')
  }

  // ========== 2. 初始化话术模板 ==========
  const templateSeeds = [
    {
      id: uuidv4(),
      name: '首次触达 - 通用版',
      industry: '通用',
      scene: 'first_contact',
      content: '您好 {{nickname}}，我是{{brand}}的{{role}}，看到您{{interaction}}，想和您聊聊{{topic}}方面的内容，方便的话可以加我微信深入交流~',
      variables: JSON.stringify(['nickname', 'brand', 'role', 'interaction', 'topic']),
      status: 'active',
    },
    {
      id: uuidv4(),
      name: '教育行业 - 学员家长触达',
      industry: '教育',
      scene: 'first_contact',
      content: '您好{{nickname}}家长，我是{{school}}的{{teacher}}老师，关注到您对孩子{{subject}}学习很上心，我们正在开展{{activity}}，名额有限，您有兴趣了解一下吗？',
      variables: JSON.stringify(['nickname', 'school', 'teacher', 'subject', 'activity']),
      status: 'active',
    },
    {
      id: uuidv4(),
      name: '电商行业 - 潜在买家触达',
      industry: '电商',
      scene: 'first_contact',
      content: '亲，看到您评论了{{product}}相关内容，我们家正好有同款在做活动，{{discount}}，质量超好！感兴趣私信我，发您详细信息~',
      variables: JSON.stringify(['product', 'discount']),
      status: 'active',
    },
    {
      id: uuidv4(),
      name: '二次跟进 - 未回复唤醒',
      industry: '通用',
      scene: 'follow_up',
      content: '{{nickname}} 您好，之前给您发过一条消息，不知道有没有看到，关于{{topic}}还是很值得了解下的，方便的话回复我一下？',
      variables: JSON.stringify(['nickname', 'topic']),
      status: 'active',
    },
    {
      id: uuidv4(),
      name: '加微信引导话术',
      industry: '通用',
      scene: 'add_wechat',
      content: '{{nickname}} 您好，平台消息不太方便，我的微信是 {{wechat_id}}，加我微信详聊，我可以给您发{{benefit}}，期待与您进一步交流！',
      variables: JSON.stringify(['nickname', 'wechat_id', 'benefit']),
      status: 'active',
    },
  ]

  for (const t of templateSeeds) {
    try {
      await db.insert(schema.templates).values({
        ...t,
        variables: JSON.parse(t.variables) as string[],
        createdBy: adminId,
      }).onConflictDoNothing()
    } catch (e) {
      // ignore
    }
  }
  console.log(`✅ 话术模板初始化完成 (${templateSeeds.length} 条)`)

  // ========== 3. 初始化风控规则 ==========
  const riskRuleSeeds = [
    {
      id: uuidv4(),
      name: '微博默认风控规则',
      platform: 'weibo',
      dailySendLimit: 50,
      addFriendLimit: 20,
      minSendInterval: 60,
      enableContentFilter: true,
      sensitiveKeywords: ['贷款', '赌博', '色情', '违禁', '发票'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: '小红书默认风控规则',
      platform: 'xiaohongshu',
      dailySendLimit: 30,
      addFriendLimit: 10,
      minSendInterval: 90,
      enableContentFilter: true,
      sensitiveKeywords: ['贷款', '赌博', '色情', '违禁'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: '全平台通用风控规则',
      platform: 'all',
      dailySendLimit: 200,
      addFriendLimit: 50,
      minSendInterval: 30,
      enableContentFilter: true,
      sensitiveKeywords: ['贷款', '赌博', '色情', '违禁', '发票', '刷单'],
      isActive: true,
    },
  ]

  for (const r of riskRuleSeeds) {
    try {
      await db.insert(schema.riskRules).values({
        ...r,
        updatedBy: adminId,
      }).onConflictDoNothing()
    } catch (e) {
      // ignore
    }
  }
  console.log(`✅ 风控规则初始化完成 (${riskRuleSeeds.length} 条)`)

  // ========== 4. 初始化示例线索 ==========
  const leadSeeds = Array.from({ length: 10 }).map((_, i) => ({
    id: uuidv4(),
    platform: ['weibo', 'xiaohongshu'][i % 2],
    platformUserId: `user_${1000 + i}`,
    nickname: `测试用户${i + 1}`,
    bio: `这是测试用户${i + 1}的简介`,
    interactionContent: `对产品${i + 1}表示感兴趣`,
    interactionType: 'comment',
    intentScore: 30 + i * 7,
    intentLevel: i < 3 ? 'high' : i < 7 ? 'medium' : 'low',
    tags: ['测试', '待跟进'] as string[],
    status: 'new',
    followerCount: 1000 + i * 500,
  }))

  for (const lead of leadSeeds) {
    try {
      await db.insert(schema.leads).values(lead).onConflictDoNothing()
    } catch (e) {
      // ignore
    }
  }
  console.log(`✅ 示例线索初始化完成 (${leadSeeds.length} 条)`)

  // ========== 5. 初始化运营历史数据（近 7 天）==========
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const base = 80 + Math.floor(Math.random() * 40)
    const sent = base + Math.floor(Math.random() * 50)
    const reply = Math.floor(sent * (0.15 + Math.random() * 0.15))
    const addWechat = Math.floor(reply * (0.3 + Math.random() * 0.3))
    const convert = Math.floor(addWechat * (0.1 + Math.random() * 0.2))

    for (const platform of ['weibo', 'xiaohongshu']) {
      try {
        await db.insert(schema.operationData).values({
          date: dateStr,
          platform,
          leadsCount: base,
          sentCount: sent,
          replyCount: reply,
          addWechatCount: addWechat,
          convertCount: convert,
          replyRate: reply / sent,
          addWechatRate: addWechat / reply || 0,
          convertRate: convert / addWechat || 0,
          cost: sent * 0.05,
        })
      } catch (e) {
        // ignore duplicate
      }
    }
  }
  console.log('✅ 运营历史数据初始化完成（近7天）')

  await client.end()
  console.log('\n🎉 数据库种子初始化全部完成！')
}

seed().catch((err) => {
  console.error('❌ 种子初始化失败:', err)
  process.exit(1)
})
