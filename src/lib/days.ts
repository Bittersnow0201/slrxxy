/** 计算从起始日到今天（或指定日）一共多少天（含起始日当天） */
export function daysTogether(since: string, now = new Date()): number {
  const start = new Date(`${since}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = today.getTime() - start.getTime()
  return Math.max(1, Math.floor(diff / 86400000) + 1)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}.${Number(m)}.${Number(d)}`
}
