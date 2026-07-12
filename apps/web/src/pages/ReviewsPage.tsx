import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PaginatedReviews, Review, ReviewType, SortMode } from '@hyy/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, cn } from '@/lib/utils'
import { MessageSquare, Plus, Search, ThumbsDown, ThumbsUp, X } from 'lucide-react'

const TYPE_OPTIONS: { value: ReviewType; label: string }[] = [
  { value: 'takeout', label: '外卖' },
  { value: 'dine_in', label: '聚餐' },
]

const RATING_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: '好吃', label: '好吃' },
  { value: '难吃', label: '难吃' },
]

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'date', label: '最新' },
  { value: 'likes', label: '最多赞同' },
  { value: 'comments', label: '最多评论' },
]

export function ReviewsPage() {
  const [type, setType] = useState<ReviewType>('takeout')
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('')
  const [sort, setSort] = useState<SortMode>('date')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedReviews | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        type,
        page: String(page),
        sort,
      })
      if (search.trim()) params.set('search', search.trim())
      if (rating) params.set('rating', rating)
      const res = await api<PaginatedReviews>(`/api/reviews?${params}`)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [type, search, rating, sort, page])

  useEffect(() => {
    void load()
  }, [load])

  const hasActiveFilters = Boolean(search.trim() || rating || sort !== 'date')

  function clearFilters() {
    setSearch('')
    setRating('')
    setSort('date')
    setPage(1)
  }

  function setTypeAndReset(next: ReviewType) {
    setType(next)
    setPage(1)
  }

  return (
    <div className="page-shell page-section text-neutral-900">
      {/* 桌面端页头：保持原样 */}
      <header className="hidden md:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 lg:mb-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-neutral-500">
            社区评价
          </p>
          <h1 className="mt-1.5 text-2xl lg:text-3xl font-semibold tracking-tight text-primary-deep">
            外卖红黑榜
          </h1>
          <p className="mt-2 text-sm lg:text-base text-neutral-500 leading-relaxed">
            外卖、聚餐吃到好的或踩雷的，记一笔，帮同学避雷种草。
          </p>
        </div>
        <Button asChild className="shrink-0 self-start sm:self-auto">
          <Link to="/reviews/new" className="no-underline">
            <Plus className="size-4" />
            写评价
          </Link>
        </Button>
      </header>

      {/* 移动端页头 */}
      <header className="md:hidden mb-3">
        <p className="text-xs font-medium tracking-wide text-neutral-500">
          社区评价
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-primary-deep">
          外卖红黑榜
        </h1>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          外卖、聚餐吃到好的或踩雷的，记一笔，帮同学避雷种草。
        </p>
      </header>

      {/* 桌面端工具栏：保持原样 */}
      <div className="hidden md:block rounded-lg bg-secondary/80 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <Tabs
            value={type}
            onValueChange={(v) => setTypeAndReset(v as ReviewType)}
          >
            <TabsList className="w-auto bg-white/70">
              <TabsTrigger value="takeout">外卖</TabsTrigger>
              <TabsTrigger value="dine_in">聚餐</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2 lg:items-center">
            <Input
              placeholder="搜索商家…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="sm:w-48 lg:w-56 bg-white border-border"
            />
            <select
              className="h-9 rounded-md border border-input bg-white px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={rating}
              onChange={(e) => {
                setRating(e.target.value)
                setPage(1)
              }}
            >
              <option value="">全部评价</option>
              <option value="好吃">好吃</option>
              <option value="难吃">难吃</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-white px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortMode)
                setPage(1)
              }}
            >
              <option value="date">最新</option>
              <option value="likes">最多赞同</option>
              <option value="comments">最多评论</option>
            </select>
          </div>
        </div>
      </div>

      {/* 移动端工具栏：类型+写评价同一行，再搜索与筛选 */}
      <div className="md:hidden rounded-xl border border-border/80 bg-secondary/50 p-2.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div
            className="inline-flex shrink-0 gap-0.5 rounded-lg bg-white/80 p-0.5 shadow-sm"
            role="tablist"
            aria-label="评价类型"
          >
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTypeAndReset(opt.value)}
                  className={cn(
                    'h-8 rounded-md px-3 text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-neutral-600 hover:bg-muted/80 hover:text-primary',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <Button asChild size="sm" className="h-8 shrink-0 px-2.5 text-xs">
            <Link to="/reviews/new" className="no-underline">
              <Plus className="size-3.5" />
              写评价
            </Link>
          </Button>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <Input
            placeholder="搜索商家…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="h-10 bg-white border-border pl-9 pr-9"
            aria-label="搜索商家"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setPage(1)
              }}
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-muted hover:text-neutral-700"
              aria-label="清除搜索"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <FilterChipRow label="评价" ariaLabel="按评价筛选">
            {RATING_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value || 'all'}
                active={rating === opt.value}
                onClick={() => {
                  setRating(opt.value)
                  setPage(1)
                }}
                tone={
                  opt.value === '好吃'
                    ? 'good'
                    : opt.value === '难吃'
                      ? 'bad'
                      : 'default'
                }
              >
                {opt.label}
              </FilterChip>
            ))}
          </FilterChipRow>

          <FilterChipRow label="排序" ariaLabel="排序方式">
            {SORT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                active={sort === opt.value}
                onClick={() => {
                  setSort(opt.value)
                  setPage(1)
                }}
              >
                {opt.label}
              </FilterChip>
            ))}
          </FilterChipRow>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-xs text-neutral-500 hover:text-primary underline-offset-2 hover:underline px-0.5 py-1"
            >
              清除筛选
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 lg:mt-6">
        {loading && (
          <p className="text-sm text-neutral-500 py-16 text-center">加载中…</p>
        )}
        {error && (
          <p className="text-sm text-red-600 py-16 text-center">{error}</p>
        )}

        {!loading && !error && data && (
          <>
            {data.total > 0 && (
              <p className="mb-3 text-xs text-neutral-500">
                共 {data.total} 条
                {type === 'takeout' ? '外卖' : '聚餐'}评价
              </p>
            )}

            {data.reviews.length === 0 ? (
              <div className="border-t border-gray-200 py-16 text-center">
                <p className="text-sm text-neutral-500">暂无评价</p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="md:hidden mt-3 text-sm text-primary hover:underline"
                  >
                    清除筛选再看看
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="grid md:grid-cols-2 gap-x-8 border-t border-gray-200">
                {data.reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </ul>
            )}

            {data.totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  首页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  上一页
                </Button>
                <span className="text-sm text-neutral-500 tabular-nums px-1">
                  {data.page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  下一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(data.totalPages)}
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  尾页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FilterChipRow({
  label,
  ariaLabel,
  children,
}: {
  label: ReactNode
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 w-7 text-[11px] font-medium text-neutral-500">
        {label}
      </span>
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none -mx-0.5 px-0.5"
        role="group"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
  tone = 'default',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'default' | 'good' | 'bad'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? tone === 'good'
            ? 'border-good/30 bg-good/10 text-good'
            : tone === 'bad'
              ? 'border-bad/30 bg-bad/10 text-bad'
              : 'border-primary/25 bg-primary text-primary-foreground'
          : 'border-transparent bg-white text-neutral-600 hover:bg-muted hover:text-neutral-900',
      )}
    >
      {children}
    </button>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const isGood = review.rating === '好吃'

  return (
    <li className="border-b border-gray-200">
      <Link
        to={`/reviews/${review.id}`}
        className="block py-4 sm:py-5 no-underline text-neutral-900 outline-none"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-black">
            {review.restaurant_name}
          </h2>
          <Badge variant={isGood ? 'good' : 'bad'}>{review.rating}</Badge>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 line-clamp-2">
          {review.content}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-3.5 opacity-70" />
            <span className="tabular-nums">{review.agree_count}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsDown className="size-3.5 opacity-70" />
            <span className="tabular-nums">{review.disagree_count}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5 opacity-70" />
            <span className="tabular-nums">{review.comment_count ?? 0}</span>
          </span>
          <span className="sm:ml-auto text-neutral-400">{review.created_at}</span>
        </div>
      </Link>
    </li>
  )
}
