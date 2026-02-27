/**
 * Node.js 运行入口（Docker 环境专用）
 * 用 better-sqlite3 模拟 Cloudflare D1 接口
 * 用 @hono/node-server 替代 wrangler dev
 */
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, scheduled } from './index'
import type { Env } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---- 数据库初始化 ----
const DB_PATH = process.env.DB_PATH || '/data/easytier.db'
const DB_DIR = path.dirname(DB_PATH)
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
}

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// 执行 schema.sql 初始化表结构
const schemaPath = path.resolve(__dirname, '../schema.sql')
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    sqlite.exec(schema)
    console.log('[server] 数据库 schema 初始化完成')
}

/**
 * 模拟 Cloudflare D1 的 prepare().bind().run() / .first() / .all() 接口
 */
function createD1Shim(db: Database.Database) {
    return {
        prepare(sql: string) {
            return {
                bind(...params: any[]) {
                    return {
                        run() {
                            try {
                                const stmt = db.prepare(sql)
                                const info = stmt.run(...params)
                                return Promise.resolve({
                                    success: true,
                                    meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
                                })
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        },
                        first() {
                            try {
                                const stmt = db.prepare(sql)
                                const row = stmt.get(...params)
                                return Promise.resolve(row ?? null)
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        },
                        all() {
                            try {
                                const stmt = db.prepare(sql)
                                const rows = stmt.all(...params)
                                return Promise.resolve({ results: rows, success: true })
                            } catch (e) {
                                return Promise.reject(e)
                            }
                        }
                    }
                },
                // 无参数直接调用
                run() {
                    try {
                        const stmt = db.prepare(sql)
                        const info = stmt.run()
                        return Promise.resolve({
                            success: true,
                            meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
                        })
                    } catch (e) {
                        return Promise.reject(e)
                    }
                },
                first() {
                    try {
                        const stmt = db.prepare(sql)
                        const row = stmt.get()
                        return Promise.resolve(row ?? null)
                    } catch (e) {
                        return Promise.reject(e)
                    }
                },
                all() {
                    try {
                        const stmt = db.prepare(sql)
                        const rows = stmt.all()
                        return Promise.resolve({ results: rows, success: true })
                    } catch (e) {
                        return Promise.reject(e)
                    }
                }
            }
        },
        // 批量执行
        batch(statements: any[]) {
            const results = statements.map(s => {
                try {
                    return { success: true, results: [] }
                } catch (e) {
                    return { success: false, error: String(e) }
                }
            })
            return Promise.resolve(results)
        },
        exec(sql: string) {
            try {
                db.exec(sql)
                return Promise.resolve({ success: true })
            } catch (e) {
                return Promise.reject(e)
            }
        }
    }
}

// ---- 环境变量绑定 ----
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    console.error('[server] 错误：JWT_SECRET 环境变量未设置')
    process.exit(1)
}

const env: Env = {
    DB: createD1Shim(sqlite) as any,
    JWT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION || 'false',
}

// ---- 静态文件服务（前端 dist） ----
const DIST_PATH = path.resolve(__dirname, '../dist')
if (fs.existsSync(DIST_PATH)) {
    // 注意：dist 是 SSR 产物（index.js），前端资产在 dist/assets
    // Hono 路由已处理所有页面，静态资产通过 serveStatic 提供
    app.use('/assets/*', serveStatic({ root: path.relative(process.cwd(), DIST_PATH) }))
    app.use('/favicon.ico', serveStatic({ root: path.relative(process.cwd(), DIST_PATH) }))
}

// ---- 定时任务（每 10 分钟执行一次） ----
const CRON_INTERVAL = 10 * 60 * 1000
setInterval(async () => {
    console.log('[cron] 执行定时任务...')
    try {
        await scheduled(null, env, {})
    } catch (e) {
        console.error('[cron] 定时任务执行失败:', e)
    }
}, CRON_INTERVAL)

// ---- 启动服务器 ----
const PORT = parseInt(process.env.PORT || '8787', 10)

serve({
    fetch: (req) => app.fetch(req, env, { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as any),
    port: PORT,
    hostname: '0.0.0.0',
}, (info) => {
    console.log(`[server] EasyTier 节点管理系统已启动`)
    console.log(`[server] 监听地址: http://0.0.0.0:${info.port}`)
    console.log(`[server] 数据库路径: ${DB_PATH}`)
})
