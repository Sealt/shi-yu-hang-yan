import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Comment, Review } from '@hyy/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api, getVisitorId } from '@/lib/utils'
import { ArrowLeft, ThumbsDown, ThumbsUp } from 'lucide-react'

export function ReviewDetailPage() {
  const { id } = useParams()
  const [review, setReview] = useState<Review | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await api<{ review: Review; comments: Comment[] }>(
        `/api/reviews/${id}`,
      )
      setReview(data.review)
      setComments(data.comments)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleVote(vote_type: 'agree' | 'disagree') {
    if (!id) return
    setMsg(null)
    try {
      const data = await api<{ review: Review }>(`/api/reviews/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote_type, voter_id: getVisitorId() }),
      })
      setReview(data.review)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '投票失败')
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !content.trim()) return
    setSubmitting(true)
    setMsg(null)
    try {
      await api(`/api/reviews/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      })
      setContent('')
      await load()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell page-section text-sm text-muted-foreground">加载中…</div>
    )
  }

  if (error || !review) {
    return (
      <div className="page-shell page-section">
        <p className="text-sm text-destructive">{error || '评价不存在'}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/reviews" className="no-underline">
            返回列表
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="page-shell page-section">
      <div className="max-w-3xl mx-auto lg:max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/reviews" className="no-underline text-foreground/75">
            <ArrowLeft className="size-4" />
            返回列表
          </Link>
        </Button>

        <article className="border border-border rounded-md p-5 sm:p-6 lg:p-8 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-semibold text-primary-deep">
              {review.restaurant_name}
            </h1>
            <Badge variant={review.rating === '好吃' ? 'good' : 'bad'}>
              {review.rating}
            </Badge>
            <Badge variant="outline">
              {review.type === 'dine_in' ? '聚餐' : '外卖'}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{review.created_at}</p>
          <p className="mt-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
            {review.content}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="good" size="sm" onClick={() => void handleVote('agree')}>
              <ThumbsUp className="size-3.5" />
              赞同 {review.agree_count}
            </Button>
            <Button variant="bad" size="sm" onClick={() => void handleVote('disagree')}>
              <ThumbsDown className="size-3.5" />
              反对 {review.disagree_count}
            </Button>
          </div>
          {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
        </article>

        <Separator className="my-8" />

        <section>
          <h2 className="text-base lg:text-lg font-semibold text-primary-deep mb-4">
            评论 ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-6">还没有评论</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border mb-6">
              {comments.map((c) => (
                <li key={c.id} className="py-3.5">
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.created_at}</p>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={(e) => void handleComment(e)}
            className="space-y-3 max-w-xl"
          >
            <Textarea
              placeholder="写一条评论…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? '提交中…' : '发表评论'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
