import { useMemo, useState } from 'react'
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

  return (
    <div className="page-shell page-section">
      <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 shrink-0">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-primary-deep leading-tight">
            吃在杭研
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground leading-snug">
            {menuData.length} 家店铺 · {allItemCount} 道菜品
            {shownCount !== allItemCount ? ` · 当前 ${shownCount} 道` : ''}
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

      <div className="flex flex-wrap gap-1.5">
        {stores.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setStore(name)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors',
              store === name
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-gray-100 text-black hover:bg-gray-200',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">没有匹配的菜品</p>
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
