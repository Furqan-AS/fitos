import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Activity, Salad, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/',          icon: Home,       label: 'Home' },
  { to: '/workout',   icon: Dumbbell,   label: 'Workout' },
  { to: '/cardio',    icon: Activity,   label: 'Cardio' },
  { to: '/nutrition', icon: Salad,      label: 'Nutrition' },
  { to: '/progress',  icon: TrendingUp, label: 'Progress' },
  { to: '/profile',   icon: User,       label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
      <div className="max-w-md mx-auto flex items-stretch pb-safe">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-white/25 hover:text-white/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive && 'bg-amber-500/15'
                )}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
