/** 昵称映射；内部仍可用 slr / xxy 存库，展示时统一为昵称 */
const PERSON_LABELS: Record<string, string> = {
  slr: '小小逸',
  xxy: '小小雨',
  小小逸: '小小逸',
  小小雨: '小小雨',
}

export function displayPersonName(id: string): string {
  return PERSON_LABELS[id] || id
}

export function formatLetterMeta(from: string, to: string): string {
  return `${displayPersonName(from)} 对 ${displayPersonName(to)} 说`
}
