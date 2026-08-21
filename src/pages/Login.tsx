import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { site } from '../data/content'
import { useAuth } from '../auth/AuthContext'
import { useBgm } from '../audio/BgmContext'
import './Login.css'

export function Login() {
  const { ready, loggedIn, login } = useAuth()
  const { unlock } = useBgm()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'
  const target = from === '/login' ? '/' : from

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  if (ready && loggedIn && !leaving) {
    return <Navigate to={target} replace />
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = login(username, password)
    if (!ok) {
      setError('不对呦，再想想呢')
      return
    }

    unlock()
    setLeaving(true)
    window.setTimeout(() => {
      navigate(target, { replace: true })
    }, 720)
  }

  return (
    <section className={`login-page${leaving ? ' is-leaving' : ''}`}>
      <div className="login-plane" aria-hidden="true">
        <span className="login-glow" />
        <span className="login-ring" />
      </div>

      <form className="login-panel" onSubmit={onSubmit}>
        <p className="login-mark">slr / xxy</p>
        <h1>{site.brand}</h1>
        <p className="login-hint">两个人的入口</p>

        <label>
          <span>账号</span>
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
          />
        </label>
        <label>
          <span>密码</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
          />
        </label>

        {error ? <p className="login-error">{error}</p> : null}

        <button type="submit">进入</button>
      </form>
    </section>
  )
}
