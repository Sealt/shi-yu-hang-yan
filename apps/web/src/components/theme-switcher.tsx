import { cn } from '@/lib/utils'
import { themes } from '@/lib/theme'
import { useTheme } from '@/hooks/use-theme'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        className,
      )}
      role="group"
      aria-label="选择页面主题"
    >
      {themes.map((t) => {
        const active = theme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            aria-label={t.label}
            title={t.label}
            className={cn(
              'outline-none transition-opacity duration-150',
              'focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1',
              // 外圈圆角 4px；选中时 2px 色环
              active
                ? 'rounded-[4px] p-[2px]'
                : 'rounded-[4px] opacity-70 hover:opacity-100',
            )}
            style={active ? { backgroundColor: t.color } : undefined}
          >
            {/* 白边：圆角 = 4px - 2px = 2px */}
            <span
              className={cn(
                'block',
                active ? 'rounded-[2px] bg-white p-[2px]' : '',
              )}
            >
              {/* 色块：选中时圆角 = 2px - 2px ≈ 0 用 1px 略圆；未选中 4px */}
              <span
                className={cn(
                  'block',
                  active
                    ? 'size-3.5 rounded-[1px]'
                    : 'size-4 rounded-[4px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]',
                )}
                style={{ backgroundColor: t.color }}
                aria-hidden
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
