import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBgm } from '../audio/BgmContext'
import { useContent } from '../content/ContentContext'
import { AgentChat } from './AgentChat'
import './Layout.css'

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { enabled: bgmOn, playing: bgmPlaying, toggle: toggleBgm, unlock } = useBgm()
  const { content, ready } = useContent()
  const isHome = pathname === '/'
  const brand = ready ? content.site.brand : 'slr和xxy的小宇宙'
  const footer = ready ? content.site.footer : ''

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function onBgmClick() {
    if (bgmOn && !bgmPlaying) {
      unlock()
      return
    }
    toggleBgm()
  }

  return (
    <div className={`shell${isHome ? ' is-home' : ''}`}>
      <header className={`topbar${isHome ? ' on-hero' : ''}`}>
        <NavLink to="/" className="brand-mini" end>
          {brand}
        </NavLink>
        <nav className="nav" aria-label="主导航">
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink to="/timeline">时间线</NavLink>
          <NavLink to="/photos">相册</NavLink>
          <NavLink to="/letter">写给你</NavLink>
          <NavLink to="/edit">编辑</NavLink>
          <button
            type="button"
            className={`bgm-btn${bgmOn ? ' is-on' : ''}`}
            onClick={onBgmClick}
            aria-pressed={bgmOn}
            title={bgmOn ? '关闭背景音乐' : '打开背景音乐'}
          >
            {!bgmOn ? '音乐关' : bgmPlaying ? '音乐开' : '点开音乐'}
          </button>
          <button type="button" className="logout-btn" onClick={onLogout}>
            退出
          </button>
        </nav>
      </header>

      <main className={`main${isHome ? ' main-home' : ''}`}>{children}</main>

      {!isHome && (
        <footer className="footer">
          <p>{footer}</p>
        </footer>
      )}

      <AgentChat />
    </div>
  )
}
