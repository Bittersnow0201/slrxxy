import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  AUTH,
  AUTH_STORAGE_KEY,
  clearHeroBg,
  pickRandomHeroBg,
  readHeroBg,
} from '../data/auth'

const HERO_BG_FALLBACK = 'media/hero-kitty-a.png'

type AuthContextValue = {
  ready: boolean
  loggedIn: boolean
  /** 本次登录会话选用的首页背景路径（相对 public） */
  heroBg: string
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readLoggedIn() {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [heroBg, setHeroBg] = useState(HERO_BG_FALLBACK)

  useEffect(() => {
    const ok = readLoggedIn()
    setLoggedIn(ok)
    if (ok) {
      setHeroBg(readHeroBg())
    }
    setReady(true)
  }, [])

  function login(username: string, password: string) {
    const ok = username.trim() === AUTH.username && password === AUTH.password
    if (ok) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, '1')
      } catch {
        // 某些浏览器隐私模式写不进 storage，仍允许本次会话进入
      }
      setHeroBg(pickRandomHeroBg())
      setLoggedIn(true)
    }
    return ok
  }

  function logout() {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore
    }
    clearHeroBg()
    setLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ ready, loggedIn, heroBg, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
