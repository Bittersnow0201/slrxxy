export type Milestone = {
  days: number
  message: string
}

export const MILESTONES: Milestone[] = [
  { days: 30, message: '第一个月，小宇宙还在慢慢亮起来。' },
  { days: 100, message: '一百天啦，每一天都算数。' },
  { days: 200, message: '两百天，故事又厚了一点。' },
  { days: 365, message: '一周年，想和你一起继续走下去。' },
  { days: 500, message: '五百天，谢谢你还在这里。' },
  { days: 730, message: '两周年，我们的小宇宙又长大了一圈。' },
  { days: 1000, message: '一千天，以后还有很多很多天。' },
]

const DISMISS_PREFIX = 'slrxxy-milestone-dismiss-'

export function findMilestone(days: number): Milestone | null {
  return MILESTONES.find((item) => item.days === days) ?? null
}

export function isMilestoneDismissed(days: number): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${days}`) === '1'
  } catch {
    return false
  }
}

export function dismissMilestone(days: number) {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${days}`, '1')
  } catch {
    // ignore
  }
}
