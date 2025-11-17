import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import type { Env } from './types'
import auth from './routes/auth'
import nodes from './routes/nodes'
import api from './routes/api'
import system from './routes/system'
import HomeIndex from './components/HomeIndex'
import UserLogin from './components/UserLogin'
import UserSetup from './components/UserSetup'
import UserNodes from './components/UserNodes'
import UserEmail from './components/UserEmail'
import EmailVerificationRequired from './components/EmailVerificationRequired'
import HostNodes from './components/HostNodes'
import HostSetup from './components/HostSetup'
import HostAdmin from './components/HostAdmin'

const app = new Hono<{ Bindings: Env }>()

// 启用 CORS
app.use('/*', cors())

// API 路由
app.route('/api/auth', auth)
app.route('/api/nodes', nodes)
app.route('/api/system', system)
app.route('/api', api)

// 前端页面路由
app.use(renderer)

app.get('/', (c) => {
  return c.render(<HomeIndex />)
})

app.get('/login', (c) => {
  return c.render(<UserLogin />)
})

app.get('/register', (c) => {
  return c.render(<UserSetup />)
})

app.get('/dashboard', (c) => {
  return c.render(<UserNodes />)
})

app.get('/admin', (c) => {
  return c.render(<HostNodes />)
})

app.get('/initialize', (c) => {
  return c.render(<HostSetup />)
})

app.get('/settings', (c) => {
  return c.render(<HostAdmin />)
})

app.get('/verify', (c) => {
  return c.render(<UserEmail />)
})

app.get('/verify-required', (c) => {
  return c.render(<EmailVerificationRequired />)
})

export default app