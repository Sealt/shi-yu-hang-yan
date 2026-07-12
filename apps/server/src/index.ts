import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { getDb } from './db.js'
import {
  createAdminSession,
  createComment,
  createReview,
  deleteAdminSession,
  getCommentById,
  getReviewById,
  getStats,
  isValidAdminToken,
  listAllComments,
  listComments,
  listReviews,
  setCommentDeleted,
  setReviewDeleted,
  setReviewVisibility,
  trackVisitor,
  voteReview,
} from './reviews.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const isProd = process.env.NODE_ENV === 'production'

// ensure db ready
getDb()

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: isProd
      ? (origin) => origin || '*'
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
)

app.use('/api/*', async (c, next) => {
  const visitorId =
    c.req.header('x-visitor-id') ||
    getCookie(c, 'visitor_id') ||
    randomBytes(16).toString('hex')

  if (!getCookie(c, 'visitor_id')) {
    setCookie(c, 'visitor_id', visitorId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'Lax',
    })
  }

  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  const ua = c.req.header('user-agent') || ''
  try {
    trackVisitor(visitorId, ip, ua)
  } catch {
    /* non-critical */
  }
  await next()
})

const createReviewSchema = z.object({
  type: z.enum(['takeout', 'dine_in']),
  restaurant_name: z.string().trim().min(1).max(100),
  rating: z.enum(['好吃', '难吃']),
  content: z.string().trim().min(1).max(5000),
})

const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

const voteSchema = z.object({
  vote_type: z.enum(['agree', 'disagree']),
  voter_id: z.string().trim().min(1).max(200),
})

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/stats', (c) => c.json(getStats()))

app.get('/api/reviews', (c) => {
  const type = (c.req.query('type') || 'all') as 'takeout' | 'dine_in' | 'all'
  const search = c.req.query('search') || ''
  const rating = c.req.query('rating') || ''
  const page = Number(c.req.query('page') || 1)
  const sort = (c.req.query('sort') || 'date') as 'date' | 'likes' | 'comments'
  const data = listReviews({ type, search, rating, page, sort })
  return c.json(data)
})

app.get('/api/reviews/:id', (c) => {
  const id = Number(c.req.param('id'))
  const review = getReviewById(id)
  if (!review) return c.json({ error: '评价不存在' }, 404)
  const comments = listComments(id)
  return c.json({ review, comments })
})

app.post('/api/reviews', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: '参数无效', details: parsed.error.flatten() }, 400)
  }
  const review = createReview(parsed.data)
  return c.json({ review }, 201)
})

app.post('/api/reviews/:id/comments', async (c) => {
  const id = Number(c.req.param('id'))
  if (!getReviewById(id)) return c.json({ error: '评价不存在' }, 404)
  const body = await c.req.json().catch(() => null)
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: '参数无效' }, 400)
  const comment = createComment(id, parsed.data.content)
  return c.json({ comment }, 201)
})

app.post('/api/reviews/:id/vote', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null)
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: '参数无效' }, 400)
  const result = voteReview(id, parsed.data.voter_id, parsed.data.vote_type)
  if (!result.ok) return c.json({ error: result.error }, 400)
  return c.json({ review: result.review })
})

// Admin
app.post('/api/admin/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const password = body?.password
  if (password !== ADMIN_PASSWORD) {
    return c.json({ error: '密码错误' }, 401)
  }
  const token = randomBytes(32).toString('hex')
  createAdminSession(token)
  setCookie(c, 'admin_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24,
  })
  return c.json({ token })
})

app.post('/api/admin/logout', async (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (token) deleteAdminSession(token)
  deleteCookie(c, 'admin_token', { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/admin/me', (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  return c.json({ ok: isValidAdminToken(token) })
})

app.get('/api/admin/reviews', (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (!isValidAdminToken(token)) return c.json({ error: '未授权' }, 401)
  const page = Number(c.req.query('page') || 1)
  const type = (c.req.query('type') || 'all') as 'takeout' | 'dine_in' | 'all'
  const search = c.req.query('search') || ''
  const data = listReviews({ type, page, search, admin: true, perPage: 30 })
  return c.json(data)
})

app.get('/api/admin/reviews/:id', (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (!isValidAdminToken(token)) return c.json({ error: '未授权' }, 401)
  const id = Number(c.req.param('id'))
  const review = getReviewById(id, true)
  if (!review) return c.json({ error: '不存在' }, 404)
  const comments = listComments(id, true)
  return c.json({ review, comments })
})

app.patch('/api/admin/reviews/:id', async (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (!isValidAdminToken(token)) return c.json({ error: '未授权' }, 401)
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => ({}))
  if (typeof body.is_visible === 'boolean') setReviewVisibility(id, body.is_visible)
  if (typeof body.is_deleted === 'boolean') setReviewDeleted(id, body.is_deleted)
  const review = getReviewById(id, true)
  if (!review) return c.json({ error: '不存在' }, 404)
  return c.json({ review })
})

app.get('/api/admin/comments', (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (!isValidAdminToken(token)) return c.json({ error: '未授权' }, 401)
  const page = Number(c.req.query('page') || 1)
  const reviewIdRaw = c.req.query('review_id')
  const reviewId = reviewIdRaw ? Number(reviewIdRaw) : undefined
  const includeDeleted = c.req.query('include_deleted') !== '0'
  const data = listAllComments({
    page,
    perPage: 30,
    reviewId: Number.isFinite(reviewId) ? reviewId : undefined,
    includeDeleted,
  })
  return c.json(data)
})

app.patch('/api/admin/comments/:id', async (c) => {
  const token = c.req.header('x-admin-token') || getCookie(c, 'admin_token')
  if (!isValidAdminToken(token)) return c.json({ error: '未授权' }, 401)
  const id = Number(c.req.param('id'))
  const existing = getCommentById(id)
  if (!existing) return c.json({ error: '评论不存在' }, 404)
  const body = await c.req.json().catch(() => ({}))
  if (typeof body.is_deleted === 'boolean') setCommentDeleted(id, body.is_deleted)
  const comment = getCommentById(id)
  return c.json({ ok: true, comment })
})

// Production: serve web dist
const webDist = path.resolve(__dirname, '../../web/dist')
if (fs.existsSync(webDist)) {
  app.use('/*', serveStatic({ root: webDist }))
  app.get('*', async (c) => {
    const index = path.join(webDist, 'index.html')
    if (fs.existsSync(index)) {
      return c.html(fs.readFileSync(index, 'utf8'))
    }
    return c.text('Not Found', 404)
  })
}

console.log(`Hangyan server listening on http://localhost:${PORT}`)
serve({ fetch: app.fetch, port: PORT })
