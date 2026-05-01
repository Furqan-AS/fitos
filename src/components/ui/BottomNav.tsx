import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Salad, TrendingUp, User } from 'lucide-react'

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
        background: 'rgba(13,13,19,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-md mx-auto flex pb-safe">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center py-3 gap-1">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  color={isActive ? '#E9A020' : 'rgba(255,255,255,0.22)'}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: isActive ? '#E9A020' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
