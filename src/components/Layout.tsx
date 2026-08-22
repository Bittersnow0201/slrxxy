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
  const { content, ready, cloudEnabled, loadState, loadError, refresh } = useContent()
  const isHome = pathname === '/'
  const brand = ready ? content.site.brand : 'slr和xxy的小宇宙'
  const footer = ready ? content.site.footer : ''
  const showCloudWarn = cloudEnabled && (loadState === 'error' || loadState === 'cache')

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
          <NavLink to="/letter">悄悄话</NavLink>
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
