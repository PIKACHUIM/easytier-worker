/**
 * EdgeOne Node Functions 入口文件
 * 使用 [[default]] catch-all 路由，将所有请求转发给 Hono app 处理
 * 参考：https://pages.edgeone.ai/document/cloud-functions
 *
 * 注意：当前 EdgeOne 不支持 D1 数据库，Hono 完整应用暂不部署到 EdgeOne。
 * 此文件作为预留入口，待 EdgeOne 支持后启用。
 * 启用时取消下方注释，并删除占位代码即可。
 */

// TODO: 当 EdgeOne 支持 D1 数据库后，取消以下注释启用完整 Hono 应用
// import { app } from '../src'
// export default app

// 占位：返回提示信息
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'EdgeOne Node Functions placeholder. Full Hono app is deployed on Cloudflare.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  },
}