import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'blue' | 'amber' | 'red' | 'slate'
  className?: string
}

export default function Badge({ children, variant = 'slate', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        {
          'bg-green-500/15 text-green-400': variant === 'green',
          'bg-blue-500/15 text-blue-400': variant === 'blue',
          'bg-amber-500/15 text-amber-400': variant === 'amber',
          'bg-red-500/15 text-red-400': variant === 'red',
          'bg-slate-700 text-slate-300': variant === 'slate',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
