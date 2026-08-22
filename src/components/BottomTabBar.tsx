import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { TabIcon } from './TabIcon'
import './BottomTabBar.css'

const TABS = [
  { to: '/', label: '首页', icon: 'home' as const, end: true },
  { to: '/timeline', label: '时间线', icon: 'timeline' as const },
  { to: '/photos', label: '相册', icon: 'photos' as const },
  { to: '/letter', label: '悄悄话', icon: 'letter' as const },
]

export function BottomTabBar() {
  const { pathname } = useLocation()

  if (pathname === '/edit') return null

  const bar = (
    <nav className="bottom-tab-bar" aria-label="底部导航">
      {TABS.map((tab) => {
        const active = 'end' in tab && tab.end ? pathname === tab.to : pathname.startsWith(tab.to)
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : undefined}
            className={`bottom-tab${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-tab-icon">
              <TabIcon name={tab.icon} active={active} />
            </span>
            <span className="bottom-tab-label">{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )

  return createPortal(bar, document.body)
}
