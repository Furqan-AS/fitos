import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Salad, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/',          icon: Home,       label: 'Home'     },
  { to: '/workout',   icon: Dumbbell,   label: 'Train'    },
  { to: '/nutrition', icon: Salad,      label: 'Eat'      },
  { to: '/progress',  icon: TrendingUp, label: 'Progress' },
  { to: '/profile',   icon: User,       label: 'Me'       },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,8,14,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="max-w-md mx-auto flex pb-safe">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-150"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.6}
                  className={cn(
                    'transition-all duration-150',
                    isActive ? 'text-white' : 'text-white/22'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wide transition-all duration-150',
                    isActive ? 'text-amber-400' : 'text-white/18'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
