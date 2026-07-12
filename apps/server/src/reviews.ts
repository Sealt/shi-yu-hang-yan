import type { ReviewType, SortMode } from '@hyy/shared'
import { getDb } from './db.js'

export type ReviewRow = {
  id: number
  type: ReviewType
  restaurant_name: string
  rating: string
  content: string
  agree_count: number
  disagree_count: number
  is_visible: number
  is_deleted: number
  created_at: string
  comment_count?: number
}

export function listReviews(opts: {
  type?: ReviewType | 'all'
  search?: string
  rating?: string
  page?: number
  perPage?: number
  sort?: SortMode
  admin?: boolean
}) {
  const db = getDb()
  const page = Math.max(1, opts.page ?? 1)
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 20))
  const offset = (page - 1) * perPage
  const conditions: string[] = []
  const params: unknown[] = []

  if (!opts.admin) {
    conditions.push('is_visible = 1', 'is_deleted = 0')
  }

  if (opts.type && opts.type !== 'all') {
    conditions.push('type = ?')
    params.push(opts.type)
  }

  if (opts.search) {
    conditions.push('restaurant_name LIKE ?')
    params.push(`%${opts.search}%`)
  }

  if (opts.rating) {
    conditions.push('rating = ?')
    params.push(opts.rating)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderBy = 'ORDER BY created_at DESC'
  if (opts.sort === 'likes') {
    orderBy = 'ORDER BY agree_count DESC, created_at DESC'
  } else if (opts.sort === 'comments') {
    orderBy = 'ORDER BY comment_count DESC, created_at DESC'
  }

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM reviews ${where}`).get(...params) as { c: number }
  ).c

  // Admin sees total comments (incl. deleted); public only non-deleted
  const commentFilter = opts.admin ? '' : 'AND c.is_deleted = 0'
  const rows = db
    .prepare(
      `SELECT r.*,
        (SELECT COUNT(*) FROM comments c WHERE c.review_id = r.id ${commentFilter}) AS comment_count
       FROM reviews r
       ${where}
       ${orderBy}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as ReviewRow[]

  return {
    reviews: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export function getReviewById(id: number, admin = false) {
  const db = getDb()
  const visibility = admin ? '' : 'AND is_visible = 1 AND is_deleted = 0'
  return db
    .prepare(
      `SELECT r.*,
        (SELECT COUNT(*) FROM comments c WHERE c.review_id = r.id AND c.is_deleted = 0) AS comment_count
       FROM reviews r
       WHERE id = ? ${visibility}`,
    )
    .get(id) as ReviewRow | undefined
}

export function createReview(input: {
  type: ReviewType
  restaurant_name: string
  rating: string
  content: string
}) {
  const db = getDb()
  const result = db
    .prepare(
      `INSERT INTO reviews (type, restaurant_name, rating, content)
       VALUES (@type, @restaurant_name, @rating, @content)`,
    )
    .run(input)
  return getReviewById(Number(result.lastInsertRowid), true)!
}

export type CommentRow = {
  id: number
  review_id: number
  content: string
  is_deleted: number
  created_at: string
  restaurant_name?: string
  review_type?: ReviewType
}

export function listComments(reviewId: number, admin = false) {
  const db = getDb()
  const del = admin ? '' : 'AND is_deleted = 0'
  return db
    .prepare(
      `SELECT * FROM comments WHERE review_id = ? ${del} ORDER BY created_at ASC`,
    )
    .all(reviewId) as CommentRow[]
}

export function getCommentById(id: number) {
  const db = getDb()
  return db
    .prepare(
      `SELECT c.*, r.restaurant_name, r.type AS review_type
       FROM comments c
       JOIN reviews r ON r.id = c.review_id
       WHERE c.id = ?`,
    )
    .get(id) as CommentRow | undefined
}

/** Admin: paginated comments across all reviews (or one review). */
export function listAllComments(opts: {
  page?: number
  perPage?: number
  reviewId?: number
  includeDeleted?: boolean
}) {
  const db = getDb()
  const page = Math.max(1, opts.page ?? 1)
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 30))
  const offset = (page - 1) * perPage
  const conditions: string[] = []
  const params: unknown[] = []

  if (opts.reviewId) {
    conditions.push('c.review_id = ?')
    params.push(opts.reviewId)
  }
  if (!opts.includeDeleted) {
    conditions.push('c.is_deleted = 0')
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (
    db
      .prepare(`SELECT COUNT(*) as c FROM comments c ${where}`)
      .get(...params) as { c: number }
  ).c

  const rows = db
    .prepare(
      `SELECT c.*, r.restaurant_name, r.type AS review_type
       FROM comments c
       JOIN reviews r ON r.id = c.review_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as CommentRow[]

  return {
    comments: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export function createComment(reviewId: number, content: string) {
  const db = getDb()
  const result = db
    .prepare(`INSERT INTO comments (review_id, content) VALUES (?, ?)`)
    .run(reviewId, content)
  return db
    .prepare('SELECT * FROM comments WHERE id = ?')
    .get(Number(result.lastInsertRowid))
}

export function voteReview(reviewId: number, voterId: string, voteType: 'agree' | 'disagree') {
  const db = getDb()
  const review = getReviewById(reviewId)
  if (!review) return { ok: false as const, error: '评价不存在' }

  const existing = db
    .prepare('SELECT * FROM votes WHERE review_id = ? AND voter_id = ?')
    .get(reviewId, voterId) as { vote_type: string } | undefined

  if (existing) {
    if (existing.vote_type === voteType) {
      return { ok: false as const, error: '你已经投过相同的票了' }
    }
    // switch vote
    const tx = db.transaction(() => {
      db.prepare('UPDATE votes SET vote_type = ? WHERE review_id = ? AND voter_id = ?').run(
        voteType,
        reviewId,
        voterId,
      )
      if (voteType === 'agree') {
        db.prepare(
          'UPDATE reviews SET agree_count = agree_count + 1, disagree_count = MAX(disagree_count - 1, 0) WHERE id = ?',
        ).run(reviewId)
      } else {
        db.prepare(
          'UPDATE reviews SET disagree_count = disagree_count + 1, agree_count = MAX(agree_count - 1, 0) WHERE id = ?',
        ).run(reviewId)
      }
    })
    tx()
  } else {
    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO votes (review_id, voter_id, vote_type) VALUES (?, ?, ?)',
      ).run(reviewId, voterId, voteType)
      if (voteType === 'agree') {
        db.prepare('UPDATE reviews SET agree_count = agree_count + 1 WHERE id = ?').run(reviewId)
      } else {
        db.prepare('UPDATE reviews SET disagree_count = disagree_count + 1 WHERE id = ?').run(
          reviewId,
        )
      }
    })
    tx()
  }

  return { ok: true as const, review: getReviewById(reviewId)! }
}

export function setReviewVisibility(id: number, isVisible: boolean) {
  getDb().prepare('UPDATE reviews SET is_visible = ? WHERE id = ?').run(isVisible ? 1 : 0, id)
}

export function setReviewDeleted(id: number, isDeleted: boolean) {
  getDb().prepare('UPDATE reviews SET is_deleted = ? WHERE id = ?').run(isDeleted ? 1 : 0, id)
}

export function setCommentDeleted(id: number, isDeleted: boolean) {
  getDb().prepare('UPDATE comments SET is_deleted = ? WHERE id = ?').run(isDeleted ? 1 : 0, id)
}

export function trackVisitor(visitorId: string, ip: string, ua: string) {
  const db = getDb()
  const existing = db
    .prepare('SELECT id, visit_count FROM visitors WHERE visitor_id = ?')
    .get(visitorId) as { id: number; visit_count: number } | undefined

  if (existing) {
    db.prepare(
      `UPDATE visitors SET last_visit_at = datetime('now', 'localtime'),
       visit_count = visit_count + 1, ip_address = ?, user_agent = ?
       WHERE visitor_id = ?`,
    ).run(ip, ua, visitorId)
  } else {
    db.prepare(
      `INSERT INTO visitors (visitor_id, ip_address, user_agent) VALUES (?, ?, ?)`,
    ).run(visitorId, ip, ua)
    db.prepare(
      `UPDATE site_stats SET total_visitors = total_visitors + 1,
       last_updated = datetime('now', 'localtime') WHERE id = 1`,
    ).run()
  }

  db.prepare(
    `INSERT INTO online_users (visitor_id, last_activity) VALUES (?, datetime('now', 'localtime'))
     ON CONFLICT(visitor_id) DO UPDATE SET last_activity = datetime('now', 'localtime')`,
  ).run(visitorId)

  // prune stale online users (>5 min)
  db.prepare(
    `DELETE FROM online_users WHERE last_activity < datetime('now', 'localtime', '-5 minutes')`,
  ).run()
}

export function getStats() {
  const db = getDb()
  const total = (
    db.prepare('SELECT total_visitors FROM site_stats WHERE id = 1').get() as {
      total_visitors: number
    }
  ).total_visitors
  const online = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM online_users
         WHERE last_activity >= datetime('now', 'localtime', '-5 minutes')`,
      )
      .get() as { c: number }
  ).c
  return { total_visitors: total, online_users: online }
}

export function createAdminSession(token: string, hours = 24) {
  const db = getDb()
  db.prepare(
    `INSERT INTO admin_sessions (token, expires_at)
     VALUES (?, datetime('now', 'localtime', ?))`,
  ).run(token, `+${hours} hours`)
}

export function isValidAdminToken(token: string | undefined) {
  if (!token) return false
  const db = getDb()
  const row = db
    .prepare(
      `SELECT token FROM admin_sessions
       WHERE token = ? AND expires_at > datetime('now', 'localtime')`,
    )
    .get(token)
  return Boolean(row)
}

export function deleteAdminSession(token: string) {
  getDb().prepare('DELETE FROM admin_sessions WHERE token = ?').run(token)
}
