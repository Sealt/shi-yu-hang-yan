import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type {
  Comment,
  PaginatedComments,
  PaginatedReviews,
  Review,
  ReviewType,
} from '@hyy/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, getAdminToken, setAdminToken } from '@/lib/utils'
import { ExternalLink, MessageSquare, Search } from 'lucide-react'

type TypeFilter = ReviewType | 'all'

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(1)}
      >
        首页
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        上一页
      </Button>
      <span className="text-sm text-gray-500 self-center tabular-nums px-1">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        下一页
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(totalPages)}
      >
        尾页
      </Button>
    </div>
  )
}

export function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('reviews')

  // reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [reviewTotal, setReviewTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // comments (global tab)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentPage, setCommentPage] = useState(1)
  const [commentTotalPages, setCommentTotalPages] = useState(1)
  const [commentTotal, setCommentTotal] = useState(0)

  // per-review comment drawer
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null)
  const [expandedComments, setExpandedComments] = useState<Comment[]>([])
  const [expandedReview, setExpandedReview] = useState<Review | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const data = await api<{ ok: boolean }>('/api/admin/me')
      setAuthed(data.ok || Boolean(getAdminToken()))
    } catch {
      setAuthed(Boolean(getAdminToken()))
    }
  }, [])

  const loadReviews = useCallback(async () => {
    if (!getAdminToken() && !authed) return
    try {
      const q = new URLSearchParams({
        page: String(reviewPage),
        type: typeFilter,
      })
      if (search.trim()) q.set('search', search.trim())
      const data = await api<PaginatedReviews>(`/api/admin/reviews?${q}`)
      setReviews(data.reviews)
      setReviewTotalPages(data.totalPages)
      setReviewTotal(data.total)
    } catch {
      setAuthed(false)
      setAdminToken(null)
    }
  }, [reviewPage, typeFilter, search, authed])

  const loadComments = useCallback(async () => {
    if (!getAdminToken() && !authed) return
    try {
      const data = await api<PaginatedComments>(
        `/api/admin/comments?page=${commentPage}&include_deleted=1`,
      )
      setComments(data.comments)
      setCommentTotalPages(data.totalPages)
      setCommentTotal(data.total)
    } catch {
      setAuthed(false)
      setAdminToken(null)
    }
  }, [commentPage, authed])

  const loadReviewComments = useCallback(async (reviewId: number) => {
    setLoadingComments(true)
    try {
      const data = await api<{ review: Review; comments: Comment[] }>(
        `/api/admin/reviews/${reviewId}`,
      )
      setExpandedReview(data.review)
      setExpandedComments(data.comments)
    } catch {
      setExpandedComments([])
      setExpandedReview(null)
    } finally {
      setLoadingComments(false)
    }
  }, [])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authed && tab === 'reviews') void loadReviews()
  }, [authed, tab, loadReviews])

  useEffect(() => {
    if (authed && tab === 'comments') void loadComments()
  }, [authed, tab, loadComments])

  useEffect(() => {
    if (expandedReviewId != null) void loadReviewComments(expandedReviewId)
  }, [expandedReviewId, loadReviewComments])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const data = await api<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      setAdminToken(data.token)
      setAuthed(true)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  async function logout() {
    try {
      await api('/api/admin/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    setAdminToken(null)
    setAuthed(false)
    setExpandedReviewId(null)
  }

  async function patchReview(
    id: number,
    patch: { is_visible?: boolean; is_deleted?: boolean },
  ) {
    await api(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await loadReviews()
    if (expandedReviewId === id) await loadReviewComments(id)
  }

  async function patchComment(id: number, is_deleted: boolean) {
    await api(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_deleted }),
    })
    if (tab === 'comments') await loadComments()
    if (expandedReviewId != null) await loadReviewComments(expandedReviewId)
    // refresh review list so comment_count stays accurate
    if (tab === 'reviews') await loadReviews()
  }

  function toggleExpand(reviewId: number) {
    setExpandedReviewId((prev) => (prev === reviewId ? null : reviewId))
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    setReviewPage(1)
    setSearch(searchInput)
  }

  if (!authed) {
    return (
      <div className="page-shell page-section">
        <div className="max-w-sm mx-auto">
          <h1 className="text-xl lg:text-2xl font-semibold text-primary-deep mb-6">
            管理后台
          </h1>
          <form
            onSubmit={(e) => void login(e)}
            className="space-y-4 border border-border rounded-md p-5 bg-white"
          >
            <div className="space-y-2">
              <Label htmlFor="password">管理员密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell page-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-primary-deep">
            管理后台
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            评价审核、隐藏/删除，以及进一步评论管理
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void logout()}>
          退出
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v)
          setExpandedReviewId(null)
        }}
      >
        <TabsList className="max-w-md">
          <TabsTrigger value="reviews" className="flex-1">
            评价管理
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1">
            评论管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', '全部'],
                  ['takeout', '外卖'],
                  ['dine_in', '聚餐'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={typeFilter === value ? 'default' : 'outline'}
                  onClick={() => {
                    setTypeFilter(value)
                    setReviewPage(1)
                    setExpandedReviewId(null)
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <form
              onSubmit={applySearch}
              className="flex gap-2 flex-1 sm:max-w-xs sm:ml-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="搜索餐厅名…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" variant="outline">
                搜索
              </Button>
            </form>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            共 {reviewTotal} 条评价
            {search ? `（筛选：${search}）` : ''}
          </p>

          <ul className="divide-y divide-border border-y border-border">
            {reviews.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-500">
                暂无评价
              </li>
            )}
            {reviews.map((r) => {
              const expanded = expandedReviewId === r.id
              return (
                <li key={r.id} className="py-4 lg:py-5">
                  <div className="lg:flex lg:items-start lg:justify-between lg:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm text-gray-500">#{r.id}</span>
                        <span className="font-semibold text-black">
                          {r.restaurant_name}
                        </span>
                        <Badge variant={r.rating === '好吃' ? 'good' : 'bad'}>
                          {r.rating}
                        </Badge>
                        <Badge variant="outline">
                          {r.type === 'dine_in' ? '聚餐' : '外卖'}
                        </Badge>
                        {!r.is_visible && <Badge variant="secondary">已隐藏</Badge>}
                        {!!r.is_deleted && <Badge variant="bad">已删除</Badge>}
                        {(r.comment_count ?? 0) > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <MessageSquare className="size-3" />
                            {r.comment_count}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-gray-700 line-clamp-2">
                        {r.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {r.created_at}
                        {' · '}
                        赞同 {r.agree_count} / 反对 {r.disagree_count}
                      </p>
                    </div>
                    <div className="mt-3 lg:mt-0 flex flex-wrap gap-2 lg:flex-shrink-0 lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void patchReview(r.id, { is_visible: !r.is_visible })
                        }
                        disabled={!!r.is_deleted}
                      >
                        {r.is_visible ? '隐藏' : '显示'}
                      </Button>
                      <Button
                        size="sm"
                        variant={r.is_deleted ? 'outline' : 'destructive'}
                        onClick={() =>
                          void patchReview(r.id, { is_deleted: !r.is_deleted })
                        }
                      >
                        {r.is_deleted ? '恢复' : '删除'}
                      </Button>
                      <Button
                        size="sm"
                        variant={expanded ? 'default' : 'outline'}
                        onClick={() => toggleExpand(r.id)}
                      >
                        <MessageSquare className="size-3.5" />
                        {expanded ? '收起评论' : '管理评论'}
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          to={`/reviews/${r.id}`}
                          target="_blank"
                          className="no-underline"
                        >
                          <ExternalLink className="size-3.5" />
                          前台
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 ml-0 sm:ml-2 rounded-md border border-border bg-secondary/40 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-black">
                          评价 #{r.id} 的评论
                          {expandedReview
                            ? `（${expandedComments.length}）`
                            : ''}
                        </h3>
                      </div>
                      {loadingComments ? (
                        <p className="text-sm text-gray-500">加载中…</p>
                      ) : expandedComments.length === 0 ? (
                        <p className="text-sm text-gray-500">暂无评论</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {expandedComments.map((c) => (
                            <li
                              key={c.id}
                              className={`py-3 first:pt-0 last:pb-0 ${
                                c.is_deleted ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="lg:flex lg:items-start lg:justify-between lg:gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-500">
                                      评论 #{c.id}
                                    </span>
                                    {!!c.is_deleted && (
                                      <Badge variant="bad">已删除</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {c.content}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {c.created_at}
                                  </p>
                                </div>
                                <div className="mt-2 lg:mt-0 lg:flex-shrink-0 lg:justify-end">
                                  <Button
                                    size="sm"
                                    variant={c.is_deleted ? 'outline' : 'destructive'}
                                    onClick={() =>
                                      void patchComment(c.id, !c.is_deleted)
                                    }
                                  >
                                    {c.is_deleted ? '恢复评论' : '删除评论'}
                                  </Button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <Pagination
            page={reviewPage}
            totalPages={reviewTotalPages}
            onChange={(p) => {
              setReviewPage(p)
              setExpandedReviewId(null)
            }}
          />
        </TabsContent>

        <TabsContent value="comments">
          <p className="text-xs text-gray-500 mb-3">
            共 {commentTotal} 条评论（含已删除），可直接软删除或恢复
          </p>

          <ul className="divide-y divide-border border-y border-border">
            {comments.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-500">
                暂无评论
              </li>
            )}
            {comments.map((c) => (
              <li
                key={c.id}
                className={`py-4 lg:py-5 ${c.is_deleted ? 'opacity-60' : ''}`}
              >
                <div className="lg:flex lg:items-start lg:justify-between lg:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-500">
                        评论 #{c.id}
                      </span>
                      <span className="text-sm text-gray-500">
                        → 评价 #{c.review_id}
                      </span>
                      {c.restaurant_name && (
                        <span className="font-semibold text-sm text-black">
                          {c.restaurant_name}
                        </span>
                      )}
                      {c.review_type && (
                        <Badge variant="outline">
                          {c.review_type === 'dine_in' ? '聚餐' : '外卖'}
                        </Badge>
                      )}
                      {!!c.is_deleted && <Badge variant="bad">已删除</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm text-gray-700 whitespace-pre-wrap">
                      {c.content}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{c.created_at}</p>
                  </div>
                  <div className="mt-3 lg:mt-0 flex flex-wrap gap-2 lg:flex-shrink-0 lg:justify-end">
                    <Button
                      size="sm"
                      variant={c.is_deleted ? 'outline' : 'destructive'}
                      onClick={() => void patchComment(c.id, !c.is_deleted)}
                    >
                      {c.is_deleted ? '恢复' : '删除'}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link
                        to={`/reviews/${c.review_id}`}
                        target="_blank"
                        className="no-underline"
                      >
                        <ExternalLink className="size-3.5" />
                        查看评价
                      </Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Pagination
            page={commentPage}
            totalPages={commentTotalPages}
            onChange={setCommentPage}
          />
        </TabsContent>
      </Tabs>

    </div>
  )
}
