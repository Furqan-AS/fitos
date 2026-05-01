import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed select-none',
          {
            'text-white glow-brand-sm hover:opacity-90': variant === 'primary',
            'glass text-white hover:bg-white/8': variant === 'secondary',
            'text-white/40 hover:text-white hover:bg-white/5': variant === 'ghost',
            'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20': variant === 'danger',
          },
          {
            'px-3 py-2 text-xs gap-1.5': size === 'sm',
            'px-5 py-3 text-sm gap-2': size === 'md',
            'px-6 py-4 text-base gap-2.5': size === 'lg',
          },
          className
        )}
        style={variant === 'primary' ? { background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' } : undefined}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
