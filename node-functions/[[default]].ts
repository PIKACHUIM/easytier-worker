/**
 * EdgeOne Node Functions 入口文件
 * 使用 [[default]] catch-all 路由，将所有请求转发给 Hono app 处理
 * 参考：https://pages.edgeone.ai/document/cloud-functions
 */
import {app} from '../src/index'

export default app
