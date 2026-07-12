import { ArrowRight, BookOpen, ThumbsUp, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const modules = [
  {
    to: '/guide',
    title: '生活指南',
    desc: '园区办事、周边服务、奖助政策、报修医保与实用技巧，一本说清杭研日常。',
    icon: BookOpen,
    cta: '阅读指南',
  },
  {
    to: '/eat',
    title: '吃在杭研',
    desc: '园区内各家餐厅菜单、价格与分类一览，搜菜名、比价格、快速决定今天吃什么。',
    icon: UtensilsCrossed,
    cta: '看菜单',
  },
  {
    to: '/reviews',
    title: '外卖红黑榜',
    desc: '同学真实评价外卖与聚餐：种草好吃的，避雷踩雷的，一起把饭局吃明白。',
    icon: ThumbsUp,
    cta: '去看看',
  },
]

const ADMISSION_BANNER_URL =
  'https://mp.weixin.qq.com/s/7EBj_qVPkKGPjgfQd9ZShg'

export function HomePage() {
  return (
    <div>
      <section className="border-b border-border">
        <a
          href={ADMISSION_BANNER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block no-underline overflow-hidden bg-black"
          aria-label="欢迎报考西安电子科技大学杭州研究院，点击查看详情"
        >
          <img
            src="/PBK_2556.jpg"
            alt="西安电子科技大学杭州研究院校园"
            className="block w-full h-auto max-h-[min(42vh,360px)] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 page-shell pb-4 sm:pb-5 lg:pb-6 pt-12">
            <p className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide text-white drop-shadow-sm">
              欢迎报考西安电子科技大学杭州研究院
            </p>
            <p className="mt-1 text-xs sm:text-sm text-white/85 flex items-center gap-1">
              点击了解更多
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </p>
          </div>
        </a>
      </section>

      <section className="page-shell page-section">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Link
                key={m.to}
                to={m.to}
                className={cn(
                  'group flex flex-col border border-gray-200 rounded-md bg-white p-5 lg:p-6',
                  'no-underline transition-colors',
                  'hover:border-primary/40 hover:bg-muted/40',
                )}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-gray-100 text-black transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-black transition-colors group-hover:text-primary">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 flex-1 transition-colors group-hover:text-primary">
                  {m.desc}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors group-hover:text-primary">
                  {m.cta}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
