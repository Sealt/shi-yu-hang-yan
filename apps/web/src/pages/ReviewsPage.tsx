import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PaginatedReviews, Review, ReviewType, SortMode } from '@hyy/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/utils'
import { MessageSquare, Plus, ThumbsDown, ThumbsUp } from 'lucide-react'

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

  return (
    <div className="page-shell page-section text-neutral-900">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 lg:mb-6">
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

      <div className="rounded-lg bg-secondary/80 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as ReviewType)
              setPage(1)
            }}
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
