import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import type { Env } from './types'
import auth from './routes/auth'
import nodes from './routes/nodes'
import api from './routes/api'
import system from './routes/system'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import DashboardPage from './components/DashboardPage'
import AdminPage from './components/AdminPage'
import InitializePage from './components/InitializePage'
import SettingsPage from './components/SettingsPage'

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
  return c.render(<HomePage />)
})

app.get('/login', (c) => {
  return c.render(<LoginPage />)
})

app.get('/register', (c) => {
  return c.render(<RegisterPage />)
})

app.get('/dashboard', (c) => {
  return c.render(<DashboardPage />)
})

app.get('/admin', (c) => {
  return c.render(<AdminPage />)
})

app.get('/initialize', (c) => {
  return c.render(<InitializePage />)
})

app.get('/settings', (c) => {
  return c.render(<SettingsPage />)
})

export default app