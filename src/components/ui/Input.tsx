import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  unit?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, unit, error, id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm',
            'focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors',
            unit && 'pr-12',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'
export default Input
