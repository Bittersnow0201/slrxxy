import type { TimelineItem } from '../data/types'

export function newTimelineItem(partial?: Partial<TimelineItem>): TimelineItem {
  return {
    id: partial?.id || `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: partial?.date || new Date().toISOString().slice(0, 10),
    title: partial?.title ?? '新的一天',
    text: partial?.text ?? '',
    images: partial?.images || [],
  }
}

export function ensureTimelineId(item: TimelineItem, index: number): TimelineItem {
  return {
    ...item,
    id: item.id || `timeline-${index}-${item.date || 'undated'}`,
    images: Array.isArray(item.images) ? item.images : [],
  }
}

/** 按日期从早到晚；同日保持原有相对顺序 */
export function sortTimelineByDate(items: TimelineItem[]): TimelineItem[] {
  return items
    .map((item, index) => ({ item: ensureTimelineId(item, index), index }))
    .sort((a, b) => {
      const da = a.item.date || ''
      const db = b.item.date || ''
      if (da !== db) return da < db ? -1 : 1
      return a.index - b.index
    })
    .map(({ item }) => item)
}

/** 把节点按日期插入正确位置（新增 / 改日期后用） */
export function placeTimelineByDate(items: TimelineItem[], next: TimelineItem): TimelineItem[] {
  const without = items.filter((item) => item.id !== next.id)
  const date = next.date || ''
  let insertAt = without.findIndex((item) => (item.date || '') > date)
  if (insertAt < 0) insertAt = without.length
  const result = [...without]
  result.splice(insertAt, 0, next)
  return result
}

export function moveTimelineItem(items: TimelineItem[], fromId: string, toId: string): TimelineItem[] {
  if (fromId === toId) return items
  const from = items.findIndex((item) => item.id === fromId)
  const to = items.findIndex((item) => item.id === toId)
  if (from < 0 || to < 0) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
