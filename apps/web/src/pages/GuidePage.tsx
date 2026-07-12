import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Download, FileText, List, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** markdown 中这些后缀渲染为可下载块按钮 */
const DOWNLOAD_EXTS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
  'rar',
  '7z',
  'ai',
  'cdr',
  'svg',
  'psd',
  'sketch',
])

type TocItem = { id: string; text: string; level: number }

function getHrefExt(href: string): string | null {
  const path = href.split('?')[0]?.split('#')[0] ?? ''
  const base = path.split('/').pop() ?? ''
  const m = /\.([a-z0-9]+)$/i.exec(base)
  return m ? m[1].toLowerCase() : null
}

function isDownloadableHref(href?: string | null): boolean {
  if (!href) return false
  if (href.startsWith('#') || href.startsWith('mailto:')) return false
  const ext = getHrefExt(href)
  return ext != null && DOWNLOAD_EXTS.has(ext)
}

function fileLabelFromHref(href: string, children: ReactNode): string {
  const fromChildren = textFromChildren(children).trim()
  if (fromChildren) return fromChildren
  try {
    const path = decodeURIComponent(href.split('?')[0]?.split('#')[0] ?? '')
    return path.split('/').pop() || '下载文件'
  } catch {
    return href.split('/').pop() || '下载文件'
  }
}

function downloadFileName(href: string, label: string): string {
  try {
    const path = decodeURIComponent(href.split('?')[0]?.split('#')[0] ?? '')
    const base = path.split('/').pop()
    if (base) return base
  } catch {
    /* ignore */
  }
  return label || 'download'
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function textFromChildren(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textFromChildren).join('')
  if (typeof children === 'object' && 'props' in children) {
    return textFromChildren(
      (children as { props?: { children?: ReactNode } }).props?.children,
    )
  }
  return ''
}

function extractToc(md: string): TocItem[] {
  const items: TocItem[] = []
  for (const line of md.split('\n')) {
    const m = /^(#{1,3})\s+(.+)$/.exec(line)
    if (!m) continue
    const level = m[1].length
    const text = m[2].replace(/\\/g, '').replace(/[#*`]/g, '').trim()
    if (!text) continue
    items.push({ id: slugify(text), text, level })
  }
  return items
}

function buildChapters(toc: TocItem[]) {
  const h1List: TocItem[] = []
  const h2ByH1 = new Map<string, TocItem[]>()
  /** h2 id → 所属 h1 id */
  const h2Parent = new Map<string, string>()
  let currentH1: string | null = null

  for (const item of toc) {
    if (item.level === 1) {
      currentH1 = item.id
      h1List.push(item)
      h2ByH1.set(item.id, [])
    } else if (item.level === 2 && currentH1) {
      h2ByH1.get(currentH1)!.push(item)
      h2Parent.set(item.id, currentH1)
    }
  }

  return { h1List, h2ByH1, h2Parent }
}

function encodeAttachmentPath(file: string) {
  return file
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/')
}

function cleanMarkdown(raw: string) {
  let md = raw
  // 图片
  md = md.replace(
    /!\[([^\]]*)\]\(Images_attachments\/([^)]+)\)/g,
    (_m, alt, file) =>
      `![${alt}](/guide/Images_attachments/${encodeAttachmentPath(file)})`,
  )
  // 附件链接（非图片）
  md = md.replace(
    /(?<!!)\[([^\]]*)\]\(Images_attachments\/([^)]+)\)/g,
    (_m, text, file) =>
      `[${text}](/guide/Images_attachments/${encodeAttachmentPath(file)})`,
  )
  md = md.replace(/\\([.\-_()#])/g, '$1')
  return md
}

function FileDownloadBlock({
  href,
  children,
}: {
  href: string
  children?: ReactNode
}) {
  const label = fileLabelFromHref(href, children)
  const ext = getHrefExt(href)?.toUpperCase() ?? 'FILE'
  const fileName = downloadFileName(href, label)

  return (
    <a
      href={href}
      download={fileName}
      target="_blank"
      rel="noreferrer"
      className="md-file-download"
      aria-label={`下载 ${label}`}
    >
      <span className="md-file-download__icon" aria-hidden>
        <FileText className="size-5" />
      </span>
      <span className="md-file-download__body">
        <span className="md-file-download__name">{label}</span>
        <span className="md-file-download__meta">{ext} · 点击下载</span>
      </span>
      <span className="md-file-download__action" aria-hidden>
        <Download className="size-4" />
      </span>
    </a>
  )
}

/**
 * 在可滚动容器内把元素滚进视野（只改 container.scrollTop / scrollLeft，不动 window）
 */
function ensureVisibleInContainer(
  container: HTMLElement | null,
  item: HTMLElement | null,
  axis: 'y' | 'x' = 'y',
) {
  if (!container || !item) return

  if (axis === 'x') {
    const left = item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2
    const next = Math.max(0, Math.min(left, container.scrollWidth - container.clientWidth))
    if (Math.abs(container.scrollLeft - next) > 2) {
      container.scrollTo({ left: next, behavior: 'smooth' })
    }
    return
  }

  const pad = 12
  const itemTop = item.offsetTop
  const itemBottom = itemTop + item.offsetHeight
  const viewTop = container.scrollTop
  const viewBottom = viewTop + container.clientHeight

  if (itemTop < viewTop + pad) {
    container.scrollTo({ top: Math.max(0, itemTop - pad), behavior: 'smooth' })
  } else if (itemBottom > viewBottom - pad) {
    container.scrollTo({
      top: itemBottom - container.clientHeight + pad,
      behavior: 'smooth',
    })
  }
}

function Heading({
  as: Tag,
  children,
}: {
  as: 'h1' | 'h2' | 'h3' | 'h4'
  children?: ReactNode
}) {
  const text = textFromChildren(children)
  const id = slugify(text)
  return <Tag id={id}>{children}</Tag>
}

export function GuidePage() {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeH1Id, setActiveH1Id] = useState('')
  const [activeH2Id, setActiveH2Id] = useState('')
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(
    null,
  )
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const leftNavRef = useRef<HTMLElement>(null)
  const rightNavRef = useRef<HTMLElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)

  const activeH1IdRef = useRef('')
  const activeH2IdRef = useRef('')
  const lockSpyUntilRef = useRef(0)

  const closePreview = useCallback(() => setPreview(null), [])
  const closeMobileToc = useCallback(() => setMobileTocOpen(false), [])

  useEffect(() => {
    fetch('/guide/guide.md')
      .then((r) => {
        if (!r.ok) throw new Error('无法加载生活指南')
        return r.text()
      })
      .then(setRaw)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!preview) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [preview, closePreview])

  // 移动端目录抽屉：锁滚动 + Esc 关闭；切到桌面自动关
  useEffect(() => {
    if (!mobileTocOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileToc()
    }
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = () => {
      if (mq.matches) closeMobileToc()
    }
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [mobileTocOpen, closeMobileToc])

  const content = useMemo(() => cleanMarkdown(raw), [raw])
  const toc = useMemo(() => extractToc(content), [content])
  const { h1List, h2ByH1, h2Parent } = useMemo(() => buildChapters(toc), [toc])

  const activeH2List = useMemo(
    () => (activeH1Id ? (h2ByH1.get(activeH1Id) ?? []) : []),
    [activeH1Id, h2ByH1],
  )

  const getScrollOffset = useCallback(() => 88, [])

  const applyActive = useCallback((h1Id: string, h2Id: string) => {
    if (h1Id !== activeH1IdRef.current) {
      activeH1IdRef.current = h1Id
      setActiveH1Id(h1Id)
    }
    if (h2Id !== activeH2IdRef.current) {
      activeH2IdRef.current = h2Id
      setActiveH2Id(h2Id)
    }
  }, [])

  /**
   * 根据正文标题在视口中的位置，同时算出当前一级 / 二级
   * 规则：最后一个「顶边已越过阅读线」的标题为当前项
   */
  const syncActiveFromScroll = useCallback(() => {
    if (performance.now() < lockSpyUntilRef.current) return
    if (!h1List.length) return

    const line = getScrollOffset()

    // 按文档顺序收集所有 h1/h2 的位置
    type Mark = { id: string; level: 1 | 2; top: number }
    const marks: Mark[] = []

    for (const h1 of h1List) {
      const el = document.getElementById(h1.id)
      if (el) marks.push({ id: h1.id, level: 1, top: el.getBoundingClientRect().top })
      for (const h2 of h2ByH1.get(h1.id) ?? []) {
        const el2 = document.getElementById(h2.id)
        if (el2) {
          marks.push({ id: h2.id, level: 2, top: el2.getBoundingClientRect().top })
        }
      }
    }

    if (!marks.length) return

    // 默认第一节
    let currentH1 = h1List[0].id
    let currentH2 = ''

    for (const m of marks) {
      if (m.top - line <= 2) {
        if (m.level === 1) {
          currentH1 = m.id
          currentH2 = ''
        } else {
          // 二级：所属一级 + 自身
          currentH1 = h2Parent.get(m.id) ?? currentH1
          currentH2 = m.id
        }
      }
    }

    applyActive(currentH1, currentH2)
  }, [h1List, h2ByH1, h2Parent, getScrollOffset, applyActive])

  const scrollToHeading = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el) return

      // 点击后短暂停 spy，避免 smooth scroll 过程中高亮乱跳
      lockSpyUntilRef.current = performance.now() + 700

      // 先根据目标预高亮，左右目录一起更新
      if (h2Parent.has(id)) {
        applyActive(h2Parent.get(id)!, id)
      } else if (h1List.some((h) => h.id === id)) {
        applyActive(id, '')
      }

      const top =
        window.scrollY + el.getBoundingClientRect().top - getScrollOffset()
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })

      try {
        history.replaceState(null, '', `#${id}`)
      } catch {
        /* ignore */
      }

      window.setTimeout(() => {
        lockSpyUntilRef.current = 0
        syncActiveFromScroll()
      }, 720)
    },
    [getScrollOffset, h1List, h2Parent, applyActive, syncActiveFromScroll],
  )

  const onTocClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      scrollToHeading(id)
      closeMobileToc()
    },
    [scrollToHeading, closeMobileToc],
  )

  // 页面滚动 → 同步左右高亮
  useEffect(() => {
    if (!content || !h1List.length) return

    let raf = 0
    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(syncActiveFromScroll)
    }

    // 等 markdown 标题挂到 DOM
    const boot = window.setTimeout(() => {
      syncActiveFromScroll()
    }, 0)

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      window.clearTimeout(boot)
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [content, h1List, syncActiveFromScroll])

  // 高亮变化 → 桌面左右目录 / 移动端抽屉内滚到当前项
  useEffect(() => {
    if (!activeH1Id) return
    ensureVisibleInContainer(
      leftNavRef.current,
      leftNavRef.current?.querySelector(`[data-toc-h1="${CSS.escape(activeH1Id)}"]`) ??
        null,
      'y',
    )
    if (mobileTocOpen) {
      ensureVisibleInContainer(
        mobileNavRef.current,
        mobileNavRef.current?.querySelector(
          `[data-toc-h1="${CSS.escape(activeH1Id)}"]`,
        ) ?? null,
        'y',
      )
    }
  }, [activeH1Id, mobileTocOpen])

  useEffect(() => {
    if (!activeH2Id) return
    const t = window.setTimeout(() => {
      ensureVisibleInContainer(
        rightNavRef.current,
        rightNavRef.current?.querySelector(
          `[data-toc-h2="${CSS.escape(activeH2Id)}"]`,
        ) ?? null,
        'y',
      )
      if (mobileTocOpen) {
        ensureVisibleInContainer(
          mobileNavRef.current,
          mobileNavRef.current?.querySelector(
            `[data-toc-h2="${CSS.escape(activeH2Id)}"]`,
          ) ?? null,
          'y',
        )
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [activeH2Id, activeH2List, mobileTocOpen])

  // 初始 hash
  useEffect(() => {
    if (!content) return
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!hash) return
    const t = window.setTimeout(() => {
      if (document.getElementById(hash)) scrollToHeading(hash)
    }, 50)
    return () => window.clearTimeout(t)
  }, [content, scrollToHeading])

  if (error) {
    return (
      <div className="page-shell page-section text-sm text-destructive">{error}</div>
    )
  }

  if (!raw) {
    return (
      <div className="page-shell page-section text-sm text-muted-foreground">加载中…</div>
    )
  }

  const activeChapterTitle =
    h1List.find((h) => h.id === activeH1Id)?.text ??
    activeH2List.find((h) => h.id === activeH2Id)?.text ??
    '目录'

  return (
    <div className="w-full">
      {/* grid 保证两侧 aside 与正文同高，sticky 目录不会滚出消失 */}
      <div className="page-shell page-section">
        <div className="grid grid-cols-1 lg:grid-cols-[13rem_minmax(0,1fr)_12rem] xl:grid-cols-[14rem_minmax(0,1fr)_13rem] gap-6 xl:gap-8">
          <aside className="hidden lg:block min-w-0">
            <div className="sticky top-20 max-h-[calc(100dvh-5.5rem)] flex flex-col">
              <p className="text-sm font-semibold text-black mb-3 shrink-0">目录</p>
              <nav
                ref={leftNavRef}
                className="flex flex-col border-l border-border overflow-y-auto overscroll-contain min-h-0"
              >
                {h1List.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    data-toc-h1={item.id}
                    onClick={(e) => onTocClick(e, item.id)}
                    className={cn(
                      'text-sm py-2 pl-3 no-underline border-l-2 -ml-px transition-colors leading-snug',
                      activeH1Id === item.id
                        ? 'border-primary text-primary font-semibold bg-secondary/50'
                        : 'border-transparent text-black/80 hover:text-primary',
                    )}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl xl:max-w-4xl lg:justify-self-center w-full">
            {/* 仅正文对齐 theme.css / Border markdown 渲染 */}
            <div className="markdown-rendered">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => <Heading as="h1">{children}</Heading>,
                  h2: ({ children }) => <Heading as="h2">{children}</Heading>,
                  h3: ({ children }) => <Heading as="h3">{children}</Heading>,
                  h4: ({ children }) => <Heading as="h4">{children}</Heading>,
                  a: ({ href, children, ...props }) => {
                    if (href && isDownloadableHref(href)) {
                      return (
                        <FileDownloadBlock href={href}>{children}</FileDownloadBlock>
                      )
                    }
                    return (
                      <a
                        href={href}
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    )
                  },
                  img: ({ src, alt }) => {
                    if (!src) return null
                    return (
                      <button
                        type="button"
                        className="block max-w-full p-0 m-0 border-0 bg-transparent cursor-zoom-in text-left"
                        onClick={() => setPreview({ src, alt: alt || '' })}
                        aria-label={alt ? `放大查看：${alt}` : '放大查看图片'}
                      >
                        <img
                          src={src}
                          alt={alt || ''}
                          loading="lazy"
                          className="max-w-full h-auto pointer-events-none"
                        />
                      </button>
                    )
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>

          <aside className="hidden lg:block min-w-0">
            <div className="sticky top-20 max-h-[calc(100dvh-5.5rem)] flex flex-col">
              <p className="text-sm font-semibold text-black mb-3 shrink-0">本节目录</p>
              {activeH2List.length === 0 ? (
                <p className="text-xs text-black/50 leading-relaxed">
                  当前章节无二级标题
                </p>
              ) : (
                <nav
                  ref={rightNavRef}
                  className="flex flex-col border-l border-border overflow-y-auto overscroll-contain min-h-0"
                >
                  {activeH2List.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      data-toc-h2={item.id}
                      onClick={(e) => onTocClick(e, item.id)}
                      className={cn(
                        'text-[13px] py-1.5 pl-3 no-underline border-l-2 -ml-px transition-colors leading-snug',
                        activeH2Id === item.id
                          ? 'border-primary text-primary font-medium'
                          : 'border-transparent text-black/80 hover:text-primary',
                      )}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 移动端：浮动打开目录 */}
      {!mobileTocOpen && (
        <button
          type="button"
          className="lg:hidden fixed bottom-5 right-4 z-40 inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition"
          onClick={() => setMobileTocOpen(true)}
          aria-label="打开目录"
        >
          <List className="size-4" aria-hidden />
          目录
        </button>
      )}

      {/* 移动端：可开关侧栏目录 */}
      {createPortal(
        <div
          className={cn(
            'lg:hidden fixed inset-0 z-50',
            mobileTocOpen ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          aria-hidden={!mobileTocOpen}
        >
          <button
            type="button"
            className={cn(
              'absolute inset-0 bg-black/40 transition-opacity duration-200',
              mobileTocOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeMobileToc}
            aria-label="关闭目录"
            tabIndex={mobileTocOpen ? 0 : -1}
          />
          <aside
            className={cn(
              'absolute inset-y-0 left-0 flex w-[min(18.5rem,86vw)] flex-col bg-card shadow-2xl transition-transform duration-250 ease-out',
              mobileTocOpen ? 'translate-x-0' : '-translate-x-full',
            )}
            role="dialog"
            aria-modal="true"
            aria-label="生活指南目录"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">目录</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {activeChapterTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMobileToc}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground/70 hover:bg-muted hover:text-foreground"
                aria-label="关闭目录"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav
              ref={mobileNavRef}
              className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
            >
              {h1List.map((h1) => {
                const children = h2ByH1.get(h1.id) ?? []
                const h1Active = activeH1Id === h1.id
                return (
                  <div key={h1.id} className="mb-1">
                    <a
                      href={`#${h1.id}`}
                      data-toc-h1={h1.id}
                      onClick={(e) => onTocClick(e, h1.id)}
                      className={cn(
                        'flex items-center rounded-md px-2.5 py-2 text-sm no-underline leading-snug transition-colors',
                        h1Active
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'text-foreground/85 hover:bg-muted',
                      )}
                    >
                      {h1.text}
                    </a>
                    {children.length > 0 ? (
                      <div className="ml-2 mt-0.5 border-l border-border pl-2 space-y-0.5">
                        {children.map((h2) => (
                          <a
                            key={h2.id}
                            href={`#${h2.id}`}
                            data-toc-h2={h2.id}
                            onClick={(e) => onTocClick(e, h2.id)}
                            className={cn(
                              'block rounded-md px-2 py-1.5 text-[13px] no-underline leading-snug transition-colors',
                              activeH2Id === h2.id
                                ? 'bg-secondary text-primary font-medium'
                                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                            )}
                          >
                            {h2.text}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>,
        document.body,
      )}

      {preview &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="图片预览"
            onClick={closePreview}
          >
            <button
              type="button"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              onClick={closePreview}
              aria-label="关闭预览"
            >
              <X className="size-5" />
            </button>
            <img
              src={preview.src}
              alt={preview.alt}
              className="max-w-full max-h-[min(92dvh,100%)] w-auto h-auto object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
