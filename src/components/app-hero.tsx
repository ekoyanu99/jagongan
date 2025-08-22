import React from 'react'
import { Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppHeroProps {
  children?: React.ReactNode
  subtitle?: React.ReactNode
  title?: React.ReactNode
  className?: string
  variant?: 'default' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
}

export function AppHero({ children, subtitle, title, className, variant = 'minimal', size = 'lg' }: AppHeroProps) {
  const variants = {
    default: 'bg-white dark:bg-black text-gray-900 dark:text-gray-100',
    minimal: 'bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800',
  }

  const sizes = {
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-20',
    lg: 'py-16 md:py-28',
  }

  return (
    <div className={cn('relative overflow-hidden', variants[variant], sizes[size], className)}>
      <div className="relative container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className={cn('mb-6 p-3 rounded-full bg-blue-100 dark:bg-blue-900/20', size === 'sm' ? 'p-2' : 'p-3')}>
            <Twitter className={cn('text-blue-600 dark:text-blue-400', size === 'sm' ? 'w-6 h-6' : 'w-8 h-8')} />
          </div>

          <div className="max-w-4xl mx-auto">
            {typeof title === 'string' ? (
              <h1
                className={cn(
                  'font-bold leading-tight tracking-tight',
                  size === 'sm' ? 'text-3xl' : size === 'md' ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl',
                )}
              >
                {title}
              </h1>
            ) : (
              title
            )}

            {subtitle && (
              <div className={cn('mt-4 md:mt-6 text-neutral-600 dark:text-neutral-400')}>
                {typeof subtitle === 'string' ? (
                  <p
                    className={cn(
                      'text-lg md:text-xl leading-relaxed',
                      size === 'sm' ? 'text-base' : 'text-lg md:text-xl',
                    )}
                  >
                    {subtitle}
                  </p>
                ) : (
                  subtitle
                )}
              </div>
            )}
          </div>

          {children && (
            <div className={cn('mt-8 md:mt-12 w-full max-w-2xl', size === 'sm' ? 'mt-6' : 'mt-8 md:mt-12')}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface HeroStatsProps {
  value: string | number
  label: string
  icon?: React.ReactNode
}

export function HeroStats({ value, label, icon }: HeroStatsProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2">
        {icon && <span className="text-blue-400">{icon}</span>}
        <span className="text-2xl md:text-3xl font-bold text-white">{value}</span>
      </div>
      <span className="text-sm text-blue-200 mt-1">{label}</span>
    </div>
  )
}
