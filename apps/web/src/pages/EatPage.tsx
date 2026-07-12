import { useMemo, useState, type ReactNode } from 'react'
import {
  ALL_STORES,
  LOW_PRICE_LIMIT,
  menuData,
  type MenuItem,
  type SortMode,
  type StoreMenu,
} from '@/data/menus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'priceAsc', label: '价格升序' },
  { value: 'priceDesc', label: '价格降序' },
]

function parsePriceNumbers(price: string): number[] {
  const matches = price.match(/(\d+(?:\.\d+)?)/g)
  return matches ? matches.map(Number) : []
}

function getComparablePrice(item: MenuItem): number | null {
  const prices = parsePriceNumbers(item.price)
  if (!prices.length) return null
  return Math.min(...prices)
}

function isLowPriceItem(item: MenuItem, maxPrice: number) {
  const p = getComparablePrice(item)
  return p !== null && p <= maxPrice
}

function sortItems(items: MenuItem[], sortMode: SortMode) {
  if (sortMode === 'default') return items
  return [...items].sort((a, b) => {
    const pa = getComparablePrice(a)
    const pb = getComparablePrice(b)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return sortMode === 'priceAsc' ? pa - pb : pb - pa
  })
}

function getStoreStats(store: StoreMenu) {
  const allItems = store.categories.flatMap((c) => c.items)
  const allPrices = allItems.flatMap((item) => parsePriceNumbers(item.price))
  return {
    count: allItems.length,
    min: allPrices.length ? Math.min(...allPrices) : null,
    max: allPrices.length ? Math.max(...allPrices) : null,
  }
}

export function EatPage() {
  const [store, setStore] = useState(ALL_STORES)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('default')
  const [lowPriceOnly, setLowPriceOnly] = useState(false)

  const stores = useMemo(() => [ALL_STORES, ...menuData.map((s) => s.name)], [])

  const filtered = useMemo(() => {
    return menuData
      .filter((s) => store === ALL_STORES || s.name === store)
      .map((s) => {
        const categories = s.categories
          .map((cat) => {
            let items = cat.items
            if (query.trim()) {
              const q = query.trim().toLowerCase()
              items = items.filter(
                (item) =>
                  item.name.toLowerCase().includes(q) ||
                  (item.spec?.toLowerCase().includes(q) ?? false),
              )
            }
            if (lowPriceOnly) {
              items = items.filter((item) => isLowPriceItem(item, LOW_PRICE_LIMIT))
            }
            items = sortItems(items, sortMode)
            return { ...cat, items }
          })
          .filter((cat) => cat.items.length > 0)
        return { ...s, categories }
      })
      .filter((s) => s.categories.length > 0)
  }, [store, query, sortMode, lowPriceOnly])

  const allItemCount = menuData.reduce(
    (n, s) => n + s.categories.reduce((m, c) => m + c.items.length, 0),
    0,
  )

  const shownCount = filtered.reduce(
    (n, s) => n + s.categories.reduce((m, c) => m + c.items.length, 0),
    0,
  )

  const hasActiveFilters =
    Boolean(query.trim()) || lowPriceOnly || sortMode !== 'default' || store !== ALL_STORES

  function clearFilters() {
    setQuery('')
    setSortMode('default')
    setLowPriceOnly(false)
    setStore(ALL_STORES)
  }

  const statsLine = (
    <>
      {menuData.length} 家店铺 · {allItemCount} 道菜品
      {shownCount !== allItemCount ? ` · 当前 ${shownCount} 道` : ''}
    </>
  )

  return (
    <div className="page-shell page-section">
      {/* 桌面端：保持原布局 */}
      <header className="mb-3 hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-primary-deep leading-tight">
            吃在杭研
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground leading-snug">
            {statsLine}
          </p>
        </div>

        <div className="flex h-8 w-full min-w-0 flex-wrap items-center gap-1.5 sm:w-auto sm:flex-nowrap sm:justify-end">
          <Input
            placeholder="搜索菜品…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 min-h-8 w-full py-0 sm:w-44 lg:w-52 bg-white border-border"
          />
          <select
            className="h-8 min-h-8 rounded-md border border-border bg-white px-2 text-sm leading-none text-foreground min-w-[7rem]"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="default">默认排序</option>
            <option value="priceAsc">价格升序</option>
            <option value="priceDesc">价格降序</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant={lowPriceOnly ? 'default' : 'outline'}
            className="h-8 min-h-8 px-3"
            onClick={() => setLowPriceOnly((v) => !v)}
          >
            ≤¥{LOW_PRICE_LIMIT}
          </Button>
        </div>
      </header>

      <div className="mb-3 hidden md:flex flex-wrap gap-1.5">
        {stores.map((name) => (
          <StoreChip
            key={name}
            name={name}
            active={store === name}
            onClick={() => setStore(name)}
          />
        ))}
      </div>

      {/* 移动端：标题 + 独立工具栏，避免控件挤在一行重叠 */}
      <header className="md:hidden mb-3">
        <h1 className="text-xl font-semibold tracking-tight text-primary-deep leading-tight">
          吃在杭研
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{statsLine}</p>
      </header>

      <div className="md:hidden rounded-xl border border-border/80 bg-secondary/50 p-2.5 space-y-2.5 mb-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <Input
            placeholder="搜索菜品…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 bg-white border-border pl-9 pr-9"
            aria-label="搜索菜品"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-muted hover:text-neutral-700"
              aria-label="清除搜索"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="排序与筛选">
          <span className="shrink-0 text-[11px] font-medium text-neutral-500 mr-0.5">
            排序
          </span>
          {SORT_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={sortMode === opt.value}
              onClick={() => setSortMode(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
          <button
            type="button"
            onClick={() => setLowPriceOnly((v) => !v)}
            className={cn(
              'h-8 shrink-0 rounded-full px-3 text-xs font-medium border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              lowPriceOnly
                ? 'border-primary/25 bg-primary text-primary-foreground'
                : 'border-transparent bg-white text-neutral-600',
            )}
            aria-pressed={lowPriceOnly}
          >
            ≤¥{LOW_PRICE_LIMIT}
          </button>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-neutral-500 hover:text-primary underline-offset-2 hover:underline px-0.5 py-0.5"
          >
            清除筛选
          </button>
        ) : null}
      </div>

      {/* 移动端店铺：换行排布，不横向滑动 */}
      <div
        className="md:hidden mb-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="选择店铺"
      >
        {stores.map((name) => (
          <StoreChip
            key={name}
            name={name}
            active={store === name}
            onClick={() => setStore(name)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">没有匹配的菜品</p>
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
        <div className="mt-4 flex flex-col gap-5">
          {filtered.map((s) => {
            const stats = getStoreStats(menuData.find((x) => x.name === s.name) ?? s)
            return (
              <section
                key={s.name}
                id={s.name}
                className="overflow-hidden rounded-lg border border-gray-200 bg-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-card px-3 py-2.5 sm:px-3.5">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-primary-deep leading-snug">
                      {s.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.updatedAt}
                      {stats.min != null && stats.max != null
                        ? ` · ¥${stats.min}–${stats.max} · ${stats.count} 道`
                        : ''}
                    </p>
                  </div>
                  {s.note ? (
                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {s.note}
                    </span>
                  ) : null}
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-x-3 bg-card px-2.5 pb-2.5 pt-0.5 sm:px-3 sm:pb-3">
                  {s.categories.map((cat) => (
                    <div
                      key={cat.name}
                      className="break-inside-avoid mb-2.5 min-w-0 overflow-hidden rounded-md bg-muted/40"
                    >
                      <h3 className="bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold text-black">
                        {cat.name}
                      </h3>
                      <ul className="bg-card px-1.5 py-1">
                        {cat.items.map((item, i) => (
                          <li
                            key={item.name + item.price + (item.spec || '')}
                            className={cn(
                              'flex items-baseline justify-between gap-2 rounded-sm px-1.5 py-0.5',
                              i % 2 === 1 && 'bg-muted/50',
                            )}
                          >
                            <div className="min-w-0 flex flex-wrap items-baseline gap-x-1">
                              <span className="text-sm leading-snug text-black">
                                {item.name}
                              </span>
                              {item.spec ? (
                                <span className="text-[11px] leading-snug text-muted-foreground">
                                  {item.spec}
                                </span>
                              ) : null}
                            </div>
                            <span className="shrink-0 text-sm font-medium tabular-nums text-primary leading-snug">
                              {item.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StoreChip({
  name,
  active,
  onClick,
  className,
}: {
  name: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs rounded-md transition-colors',
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'bg-gray-100 text-black hover:bg-gray-200',
        className,
      )}
    >
      {name}
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full px-3 text-xs font-medium transition-colors',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary/25 bg-primary text-primary-foreground'
          : 'border-transparent bg-white text-neutral-600 hover:bg-muted hover:text-neutral-900',
      )}
    >
      {children}
    </button>
  )
}
