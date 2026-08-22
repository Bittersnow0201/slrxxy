import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBgm } from '../audio/BgmContext'
import { useContent } from '../content/ContentContext'
import { AgentChat } from './AgentChat'
import './Layout.css'

const MAIN_LINKS = [
  { to: '/', label: '首页', end: true },
  { to: '/timeline', label: '时间线' },
  { to: '/photos', label: '相册' },
  { to: '/letter', label: '悄悄话' },
] as const

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { enabled: bgmOn, playing: bgmPlaying, toggle: toggleBgm, unlock } = useBgm()
  const { content, ready, cloudEnabled, loadState, loadError, refresh } = useContent()
  const isHome = pathname === '/'
  const brand = ready ? content.site.brand : 'slr和xxy的小宇宙'
  const footer = ready ? content.site.footer : ''
  const showCloudWarn = cloudEnabled && (loadState === 'error' || loadState === 'cache')

  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const brandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [moreOpen])

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

  function onBrandPointerDown() {
    brandTimer.current = setTimeout(() => {
      navigate('/edit')
      setMenuOpen(false)
      setMoreOpen(false)
    }, 600)
  }

  function clearBrandTimer() {
    if (brandTimer.current) {
      clearTimeout(brandTimer.current)
      brandTimer.current = null
    }
  }

  const bgmLabel = !bgmOn ? '音乐关' : bgmPlaying ? '音乐开' : '点开音乐'

  return (
    <div className={`shell${isHome ? ' is-home' : ''}`}>
      <header className={`topbar${isHome ? ' on-hero' : ''}`}>
        <NavLink
          to="/"
          className="brand-mini"
          end
          onPointerDown={onBrandPointerDown}
          onPointerUp={clearBrandTimer}
          onPointerLeave={clearBrandTimer}
          onPointerCancel={clearBrandTimer}
          title="长按可进入编辑"
        >
          {brand}
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="sr-only">打开菜单</span>
        </button>

        <nav id="site-nav" className={`nav${menuOpen ? ' open' : ''}`} aria-label="主导航">
          <div className="nav-main">
            {MAIN_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : undefined}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className={`bgm-btn${bgmOn ? ' is-on' : ''}`}
              onClick={onBgmClick}
              aria-pressed={bgmOn}
              title={bgmOn ? '关闭背景音乐' : '打开背景音乐'}
            >
              {bgmLabel}
            </button>

            <div className="nav-more" ref={moreRef}>
              <button
                type="button"
                className={`nav-more-btn${moreOpen ? ' open' : ''}`}
                aria-expanded={moreOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  setMoreOpen((v) => !v)
                }}
              >
                更多
              </button>
              {moreOpen ? (
                <div className="nav-more-menu" role="menu">
                  <NavLink to="/edit" role="menuitem" onClick={() => setMoreOpen(false)}>
                    编辑
                  </NavLink>
                  <button type="button" role="menuitem" onClick={onLogout}>
                    退出
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      {showCloudWarn ? (
        <div className="cloud-warn" role="status">
          <p>
            {loadState === 'cache'
              ? '云端暂时读不到最新内容，先用本机缓存显示。请点「重新拉取」；若仍失败，请检查 CloudBase 存储读取权限。'
              : `云端读取失败${loadError ? `：${loadError}` : ''}。请先点「重新拉取」，修好前请勿随意保存，以免覆盖云端数据。`}
          </p>
          <button type="button" onClick={() => void refresh()}>
            重新拉取
          </button>
        </div>
      ) : null}

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
