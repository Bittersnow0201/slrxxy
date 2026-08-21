export const AUTH = {
  username: 'slrxxy',
  password: '2026221',
}

export const AUTH_STORAGE_KEY = 'slrxxy-auth'
export const HERO_BG_STORAGE_KEY = 'slrxxy-hero-bg'

/** 登录后随机选用的首页背景（相对 public） */
export const HERO_BACKGROUNDS = ['media/hero-kitty-a.png', 'media/hero-kitty-b.png'] as const

export function pickRandomHeroBg(): string {
  const index = Math.floor(Math.random() * HERO_BACKGROUNDS.length)
  const path = HERO_BACKGROUNDS[index]
  try {
    sessionStorage.setItem(HERO_BG_STORAGE_KEY, path)
  } catch {
    // ignore
  }
  return path
}

export function readHeroBg(): string {
  try {
    const saved = sessionStorage.getItem(HERO_BG_STORAGE_KEY)
    if (saved && (HERO_BACKGROUNDS as readonly string[]).includes(saved)) {
      return saved
    }
  } catch {
    // ignore
  }
  return pickRandomHeroBg()
}

export function clearHeroBg() {
  try {
    sessionStorage.removeItem(HERO_BG_STORAGE_KEY)
  } catch {
    // ignore
  }
}
