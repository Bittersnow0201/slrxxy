import type { AppContent, PhotoItem, TimelineItem } from '../data/types'

export type SpotlightItem =
  | { kind: 'timeline'; item: TimelineItem }
  | { kind: 'photo'; item: PhotoItem; index: number }

function dateSeed(date = new Date()): number {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return y * 10000 + m * 100 + d
}

function pickIndex(seed: number, length: number): number {
  if (length <= 0) return 0
  return seed % length
}

/** 按当天日期确定性抽取一条时间线或一张照片 */
export function pickDailySpotlight(content: AppContent, now = new Date()): SpotlightItem | null {
  const pool: SpotlightItem[] = []

  for (const item of content.timeline || []) {
    if (item.title?.trim() || item.text?.trim()) {
      pool.push({ kind: 'timeline', item })
    }
  }

  ;(content.photos || []).forEach((item, index) => {
    if (item.src) {
      pool.push({ kind: 'photo', item, index })
    }
  })

  if (pool.length === 0) return null
  const index = pickIndex(dateSeed(now), pool.length)
  return pool[index] ?? null
}
