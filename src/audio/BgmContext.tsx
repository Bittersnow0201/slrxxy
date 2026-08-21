import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../auth/AuthContext'

const BGM_PREF_KEY = 'slrxxy-bgm-on'
const BGM_SRC = `${import.meta.env.BASE_URL}media/bgm.mp3`

type BgmContextValue = {
  enabled: boolean
  playing: boolean
  toggle: () => void
  /** 在登录点击等用户手势里调用，便于手机端开始播放 */
  unlock: () => void
}

const BgmContext = createContext<BgmContextValue | null>(null)

function readPrefOn() {
  try {
    const raw = localStorage.getItem(BGM_PREF_KEY)
    if (raw === null) return true
    return raw === '1'
  } catch {
    return true
  }
}

function writePrefOn(on: boolean) {
  try {
    localStorage.setItem(BGM_PREF_KEY, on ? '1' : '0')
  } catch {
    // ignore
  }
}

export function BgmProvider({ children }: { children: ReactNode }) {
  const { loggedIn } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [enabled, setEnabled] = useState(readPrefOn)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = new Audio(BGM_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.32
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audioRef.current = audio
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !enabled) return
    try {
      await audio.play()
    } catch {
      // 浏览器拦截自动播放时保持关闭态，等用户点「开音乐」
    }
  }, [enabled])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
  }, [])

  useEffect(() => {
    if (!loggedIn) {
      stop()
      return
    }
    if (enabled) {
      void tryPlay()
    } else {
      stop()
    }
  }, [loggedIn, enabled, tryPlay, stop])

  const unlock = useCallback(() => {
    if (!enabled) return
    void tryPlay()
  }, [enabled, tryPlay])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      writePrefOn(next)
      const audio = audioRef.current
      if (!audio) return next
      if (next) {
        void audio.play().catch(() => {})
      } else {
        audio.pause()
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      enabled,
      playing,
      toggle,
      unlock,
    }),
    [enabled, playing, toggle, unlock],
  )

  return <BgmContext.Provider value={value}>{children}</BgmContext.Provider>
}

export function useBgm() {
  const ctx = useContext(BgmContext)
  if (!ctx) throw new Error('useBgm must be used within BgmProvider')
  return ctx
}
