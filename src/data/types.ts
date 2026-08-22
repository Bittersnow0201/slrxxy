export type TimelineItem = {
  /** 稳定 id；旧数据没有时由 normalize 补上，不改动原有内容 */
  id: string
  date: string
  title: string
  text: string
  /** 可选配图；旧云端数据没有该字段时按空数组处理 */
  images?: TimelineImage[]
}

export type TimelineImage = {
  src: string
  fileID?: string
}

export type PhotoItem = {
  src: string
  caption: string
  /** 可为空；为空时相册不显示日期 */
  date: string
  /** CloudBase fileID when uploaded to cloud storage */
  fileID?: string
}

export type LetterContent = {
  /** 稳定 id；旧数据没有时由 normalize 补上 */
  id: string
  from: string
  to: string
  title: string
  body: string
  updatedAt?: number
}

export type SiteContent = {
  brand: string
  tagline: string
  footer: string
}

/** 智能体人设与展示配置；对话内容不入库，仅存在于当次会话 */
export type AgentContent = {
  name: string
  /** 系统人设 / 性格说明 */
  persona: string
  greeting: string
}

export type AppContent = {
  togetherSince: string
  site: SiteContent
  timeline: TimelineItem[]
  photos: PhotoItem[]
  /**
   * 兼容旧版单封信字段。始终与 letters[0] 同步，
   * 读取时以 letters 为准；保存时两者都写，避免旧数据丢失。
   */
  letter: LetterContent
  /** 多封信列表；旧云端只有 letter 时会自动迁入 */
  letters: LetterContent[]
  agent: AgentContent
  updatedAt?: number
}

export const CONTENT_DOC_ID = 'main'
export const CONTENT_COLLECTION = 'site_content'
