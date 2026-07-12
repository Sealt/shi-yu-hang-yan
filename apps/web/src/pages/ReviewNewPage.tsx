import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Rating, Review, ReviewType } from '@hyy/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export function ReviewNewPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<ReviewType>('takeout')
  const [restaurant, setRestaurant] = useState('')
  const [rating, setRating] = useState<Rating>('好吃')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await api<{ review: Review }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          type,
          restaurant_name: restaurant.trim(),
          rating,
          content: content.trim(),
        }),
      })
      navigate(`/reviews/${data.review.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell page-section">
      <div className="max-w-lg lg:max-w-xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/reviews" className="no-underline text-foreground/75">
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>

        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-primary-deep">
          写评价
        </h1>
        <p className="mt-2 text-sm lg:text-base text-muted-foreground mb-6">
          匿名发布，请客观描述。不当内容会被管理员处理。
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-5 border border-border rounded-md p-5 sm:p-6 bg-white"
        >
          <div className="space-y-2">
            <Label>类型</Label>
            <div className="flex gap-2">
              {(
                [
                  ['takeout', '外卖'],
                  ['dine_in', '聚餐'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={type === value ? 'default' : 'outline'}
                  onClick={() => setType(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurant">商家名称</Label>
            <Input
              id="restaurant"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              placeholder="例如：某某炸鸡"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>评价</Label>
            <div className="flex gap-2">
              {(
                [
                  ['好吃', 'good'],
                  ['难吃', 'bad'],
                ] as const
              ).map(([value, variant]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={rating === value ? variant : 'outline'}
                  onClick={() => setRating(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">具体说说</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="味道、分量、价格、配送…写点有用的"
              required
              rows={5}
              maxLength={5000}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? '提交中…' : '发布评价'}
          </Button>
        </form>
      </div>
    </div>
  )
}
