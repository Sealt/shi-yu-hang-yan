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
import { Download, FileText, X } from 'lucide-react'
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

  const mobileBarRef = useRef<HTMLDivElement>(null)
  const leftNavRef = useRef<HTMLElement>(null)
  const rightNavRef = useRef<HTMLElement>(null)
  const mobileH1ScrollerRef = useRef<HTMLDivElement>(null)
  const mobileH2ScrollerRef = useRef<HTMLDivElement>(null)

  const activeH1IdRef = useRef('')
  const activeH2IdRef = useRef('')
  const lockSpyUntilRef = useRef(0)

  const closePreview = useCallback(() => setPreview(null), [])

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

  const content = useMemo(() => cleanMarkdown(raw), [raw])
  const toc = useMemo(() => extractToc(content), [content])
  const { h1List, h2ByH1, h2Parent } = useMemo(() => buildChapters(toc), [toc])

  const activeH2List = useMemo(
    () => (activeH1Id ? (h2ByH1.get(activeH1Id) ?? []) : []),
    [activeH1Id, h2ByH1],
  )

  const getScrollOffset = useCallback(() => {
    const header = 56
    const bar = mobileBarRef.current
    if (bar && window.matchMedia('(max-width: 1023px)').matches) {
      return header + bar.offsetHeight + 12
    }
    return 88
  }, [])

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
    },
    [scrollToHeading],
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

  // 高亮变化 → 左右目录容器内滚到当前项（与正文阅读位置联动）
  useEffect(() => {
    if (!activeH1Id) return
    // 桌面左侧
    ensureVisibleInContainer(
      leftNavRef.current,
      leftNavRef.current?.querySelector(`[data-toc-h1="${CSS.escape(activeH1Id)}"]`) ??
        null,
      'y',
    )
    // 移动端一级横向
    ensureVisibleInContainer(
      mobileH1ScrollerRef.current,
      mobileH1ScrollerRef.current?.querySelector(
        `[data-toc-h1="${CSS.escape(activeH1Id)}"]`,
      ) ?? null,
      'x',
    )
  }, [activeH1Id])

  useEffect(() => {
    if (!activeH2Id) return
    // 等右侧列表随 activeH1 重渲后再滚
    const t = window.setTimeout(() => {
      ensureVisibleInContainer(
        rightNavRef.current,
        rightNavRef.current?.querySelector(
          `[data-toc-h2="${CSS.escape(activeH2Id)}"]`,
        ) ?? null,
        'y',
      )
      ensureVisibleInContainer(
        mobileH2ScrollerRef.current,
        mobileH2ScrollerRef.current?.querySelector(
          `[data-toc-h2="${CSS.escape(activeH2Id)}"]`,
        ) ?? null,
        'x',
      )
    }, 0)
    return () => window.clearTimeout(t)
  }, [activeH2Id, activeH2List])

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

  return (
    <div className="w-full">
      {/* 移动端目录条 */}
      <div
        ref={mobileBarRef}
        className="lg:hidden sticky top-14 z-30 border-b border-border bg-white/95 backdrop-blur-sm"
      >
        <div className="page-shell py-2 space-y-2">
          <div>
            <p className="text-[11px] font-medium text-primary mb-1.5">章节</p>
            <div
              ref={mobileH1ScrollerRef}
              className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
            >
              {h1List.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  data-toc-h1={item.id}
                  onClick={(e) => onTocClick(e, item.id)}
                  className={cn(
                    'shrink-0 rounded-md border px-2.5 py-1 text-xs no-underline transition-colors',
                    activeH1Id === item.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-black/80 bg-white',
                  )}
                >
                  {item.text}
                </a>
              ))}
            </div>
          </div>

          <div className="min-h-[2.25rem]">
            {activeH2List.length > 0 ? (
              <>
                <p className="text-[11px] font-medium text-primary mb-1.5">本节</p>
                <div
                  ref={mobileH2ScrollerRef}
                  className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
                >
                  {activeH2List.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      data-toc-h2={item.id}
                      onClick={(e) => onTocClick(e, item.id)}
                      className={cn(
                        'shrink-0 rounded-md border px-2.5 py-1 text-xs no-underline transition-colors',
                        activeH2Id === item.id
                          ? 'border-primary bg-secondary text-primary font-medium'
                          : 'border-border text-black/80 bg-white',
                      )}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground pt-1">本节无二级标题</p>
            )}
          </div>
        </div>
      </div>

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
