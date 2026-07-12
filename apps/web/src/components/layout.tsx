import { BookOpen, Github, Home, Menu, UtensilsCrossed, ThumbsUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useTheme } from '@/hooks/use-theme'

const SITE_NAME = '诗语杭研'
const SITE_SLOGAN = '西电杭生活指南'

const LOGO_BY_THEME = {
  red: '/logored.png',
  blue: '/logoblue.png',
} as const

const nav = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/guide', label: '生活指南', icon: BookOpen },
  { to: '/eat', label: '吃在杭研', icon: UtensilsCrossed },
  { to: '/reviews', label: '外卖红黑榜', icon: ThumbsUp },
]

const GITHUB_URL = 'https://github.com/Sealt/shi-yu-hang-yan'

const usefulLinks = [
  { label: '西电主页', href: 'https://www.xidian.edu.cn/' },
  { label: '西电杭研主页', href: 'https://hz.xidian.edu.cn/' },
  { label: '研招网', href: 'https://yz.chsi.com.cn/' },
  { label: '学信网', href: 'https://www.chsi.com.cn/' },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { theme } = useTheme()
  const logoSrc = LOGO_BY_THEME[theme]

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm shadow-[0_4px_16px_-2px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
        <div className="page-shell flex h-14 lg:h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center no-underline shrink-0 min-w-0"
            aria-label={SITE_NAME}
          >
            <img
              src={logoSrc}
              alt={SITE_NAME}
              className="h-8 lg:h-10 w-auto max-w-[min(56vw,260px)] object-contain object-left"
            />
          </Link>

          <div className="flex items-center gap-2 lg:gap-3">
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'px-3 lg:px-4 py-2 text-sm no-underline rounded-md transition-colors',
                      isActive
                        ? 'text-primary font-semibold bg-secondary'
                        : 'text-foreground/80 hover:text-primary hover:bg-secondary/70',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <ThemeSwitcher className="shrink-0" />

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground/80"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? '关闭菜单' : '打开菜单'}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-secondary/60 shadow-inner">
            <nav className="page-shell py-2 flex flex-col">
              {nav.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-3 text-sm no-underline rounded-md',
                        isActive
                          ? 'bg-card text-primary font-semibold shadow-sm'
                          : 'text-foreground/85 hover:bg-card/70',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'size-4',
                            isActive ? 'text-primary' : 'text-foreground/55',
                          )}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="mt-auto bg-secondary/40">
        <div className="page-shell py-6 lg:py-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-2.5">常用链接</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 no-underline hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-end gap-0 sm:shrink-0">
            <Link
              to="/"
              className="group inline-flex flex-col items-end gap-1 no-underline min-w-0 text-right pr-5 sm:pr-6"
            >
              <span className="text-base font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors">
                {SITE_NAME}
              </span>
              <span className="text-xs tracking-wide text-muted-foreground">
                {SITE_SLOGAN}
              </span>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 pl-5 sm:pl-6 border-l border-border text-sm text-foreground/80 no-underline hover:text-primary transition-colors shrink-0"
              aria-label="在 GitHub 上查看诗语杭研源码"
            >
              <Github className="size-4" aria-hidden />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
