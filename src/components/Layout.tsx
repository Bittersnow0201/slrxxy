import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useBgm } from '../audio/BgmContext'
import { useContent } from '../content/ContentContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { AgentChat } from './AgentChat'
import { BottomTabBar } from './BottomTabBar'
import './Layout.css'

const DESKTOP_LINKS = [
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
  const online = useOnlineStatus()
  const isHome = pathname === '/'
  const brand = ready ? content.site.brand : 'slr和xxy的小宇宙'
  const footer = ready ? content.site.footer : ''
  const showCloudWarn = cloudEnabled && (loadState === 'error' || loadState === 'cache')
  const isEdit = pathname === '/edit'

  const [moreOpen, setMoreOpen] = useState(false)
  const brandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pullIndicatorRef = useRef<HTMLDivElement>(null)

  const onPullRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  const { refreshing: pullRefreshing } = usePullToRefresh({
    onRefresh: onPullRefresh,
    disabled: !cloudEnabled,
    indicatorRef: pullIndicatorRef,
  })

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [moreOpen])

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function onBgmToggle() {
    if (bgmOn && !bgmPlaying) {
      unlock()
      return
    }
    toggleBgm()
  }

  function onBrandPointerDown() {
    brandTimer.current = setTimeout(() => {
      navigate('/edit')
      setMoreOpen(false)
    }, 600)
  }

  function clearBrandTimer() {
    if (brandTimer.current) {
      clearTimeout(brandTimer.current)
      brandTimer.current = null
    }
  }

  return (
    <div className={`shell${isHome ? ' is-home' : ''}${isEdit ? ' is-edit' : ''}`}>
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

        <div className="topbar-actions">
          <label className="bgm-switch" title={bgmOn ? '关闭背景音乐' : '打开背景音乐'}>
            <span className="bgm-switch-label">音乐</span>
            <input
              type="checkbox"
              checked={bgmOn}
              onChange={onBgmToggle}
              aria-label={bgmOn ? '音乐开' : '音乐关'}
            />
            <span className="bgm-switch-track" aria-hidden="true" />
          </label>

          <button
            type="button"
            className={`more-trigger${moreOpen ? ' open' : ''}`}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            更多
          </button>
        </div>

        <nav className="nav-desktop" aria-label="主导航">
          {DESKTOP_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : undefined}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/edit">编辑</NavLink>
          <button type="button" className="logout-btn" onClick={onLogout}>
            退出
          </button>
        </nav>
      </header>

      {moreOpen ? (
        <div className="more-overlay" role="presentation">
          <button type="button" className="more-overlay-backdrop" aria-label="关闭" onClick={() => setMoreOpen(false)} />
          <aside className="more-panel" role="dialog" aria-label="更多">
            <h2 className="more-panel-title">更多</h2>
            <NavLink to="/edit" className="more-panel-link" onClick={() => setMoreOpen(false)}>
              编辑
            </NavLink>
            <button type="button" className="more-panel-link" onClick={onLogout}>
              退出
            </button>
            {cloudEnabled ? (
              <button
                type="button"
                className="more-panel-link"
                onClick={() => {
                  setMoreOpen(false)
                  void refresh()
                }}
              >
                刷新云端
              </button>
            ) : null}
          </aside>
        </div>
      ) : null}

      {!online ? (
        <div className="offline-banner" role="status">
          当前离线，显示的可能是本机缓存内容
        </div>
      ) : null}

      <div
        ref={pullIndicatorRef}
        className={`pull-indicator${pullRefreshing ? ' is-refreshing' : ''}`}
        aria-hidden={!pullRefreshing}
        role="status"
      >
        <span className="pull-indicator-text">下拉刷新</span>
      </div>

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

      <BottomTabBar />
      <AgentChat />
    </div>
  )
}
