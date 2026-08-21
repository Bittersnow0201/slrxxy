import type { AppContent, LetterContent } from '../data/types'
import { defaultContent } from '../data/content'

/** PG 云存储桶名，需与 SQL 建桶一致 */
export const STORAGE_BUCKET = 'slrxxy'
const CONTENT_OBJECT = 'data/content.json'

type SignedUrlResult = {
  data?: { fullSignedURL?: string; signedUrl?: string }
  error?: unknown
}

type StorageBucket = {
  upload: (
    path: string,
    body: Blob,
    opts?: { contentType?: string; upsert?: boolean },
  ) => Promise<{ data?: { id?: string; path?: string; fullPath?: string }; error?: unknown }>
  download: (path: string) => Promise<{ data?: Blob; error?: unknown }>
  createSignedUrl?: (path: string, expiresIn: number) => Promise<SignedUrlResult>
}

type CloudApp = {
  auth: (opts?: { persistence?: string }) => {
    getLoginState: () => Promise<unknown>
    signInAnonymously?: () => Promise<unknown>
    anonymousAuthProvider?: () => { signIn: () => Promise<unknown> }
  }
  storage: {
    from: (bucketId: string) => StorageBucket
    createBucket?: (
      bucketId: string,
      opts?: {
        public?: boolean
        fileSizeLimit?: number
        allowedMimeTypes?: string[] | null
      },
    ) => Promise<{ data?: unknown; error?: unknown }>
    getBucket?: (bucketId: string) => Promise<{ data?: unknown; error?: unknown }>
  }
}

let app: CloudApp | null = null
let readyPromise: Promise<CloudApp | null> | null = null

export function getCloudEnvId() {
  return (import.meta.env.VITE_CLOUDBASE_ENV as string | undefined)?.trim() || ''
}

export function isCloudConfigured() {
  return Boolean(getCloudEnvId())
}

async function ensureApp(): Promise<CloudApp | null> {
  const env = getCloudEnvId()
  if (!env) return null

  if (app) return app
  if (readyPromise) return readyPromise

  readyPromise = (async () => {
    const cloudbase = (await import('@cloudbase/js-sdk')).default
    const instance = cloudbase.init({ env }) as unknown as CloudApp
    const auth = instance.auth({ persistence: 'local' })
    const state = await auth.getLoginState()
    if (!state) {
      if (typeof auth.signInAnonymously === 'function') {
        await auth.signInAnonymously()
      } else if (auth.anonymousAuthProvider) {
        await auth.anonymousAuthProvider().signIn()
      } else {
        throw new Error('请先在 CloudBase 控制台开启匿名登录')
      }
    }
    app = instance
    await ensureBucket(instance)
    return instance
  })().catch((error) => {
    readyPromise = null
    app = null
    console.error('[cloudbase] init failed', error)
    throw error
  })

  return readyPromise
}

async function ensureBucket(instance: CloudApp) {
  if (instance.storage.getBucket) {
    const got = await instance.storage.getBucket(STORAGE_BUCKET)
    if (got?.data && !got.error) return
  }

  if (!instance.storage.createBucket) {
    throw new Error(bucketMissingMessage())
  }

  const created = await instance.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/json'],
  })

  if (created.error) {
    const msg = String((created.error as { message?: string })?.message || created.error)
    if (!/exist|已存在|duplicate/i.test(msg)) {
      throw new Error(`${bucketMissingMessage()}（自动创建失败：${msg}）`)
    }
  }
}

function bucketMissingMessage() {
  return `云存储桶「${STORAGE_BUCKET}」未就绪。请到 CloudBase → SQL 型数据库 → SQL 编辑器，执行 docs/CLOUDBASE.md 里的两段 SQL（建桶 + 权限）。`
}

function getBucket(instance: CloudApp) {
  return instance.storage.from(STORAGE_BUCKET)
}

function normalizeLetter(
  raw: Partial<LetterContent> | null | undefined,
  fallback: LetterContent,
  index: number,
): LetterContent {
  return {
    id: raw?.id || fallback.id || `letter-${index}`,
    from: raw?.from || fallback.from,
    to: raw?.to || fallback.to,
    title: raw?.title || fallback.title,
    body: raw?.body ?? fallback.body,
    updatedAt: raw?.updatedAt,
  }
}

function normalizeLetters(raw: Partial<AppContent> | null | undefined): LetterContent[] {
  const legacy = normalizeLetter(raw?.letter, defaultContent.letter, 0)
  const list = Array.isArray(raw?.letters) ? raw!.letters! : null

  if (list && list.length > 0) {
    return list.map((item, index) =>
      normalizeLetter(item, index === 0 ? legacy : defaultContent.letter, index),
    )
  }

  return [legacy]
}

function normalizeContent(raw: Partial<AppContent> | null | undefined): AppContent {
  const timelineRaw = Array.isArray(raw?.timeline) ? raw!.timeline! : defaultContent.timeline
  const letters = normalizeLetters(raw)
  return {
    togetherSince: raw?.togetherSince || defaultContent.togetherSince,
    site: {
      brand: raw?.site?.brand || defaultContent.site.brand,
      tagline: raw?.site?.tagline || defaultContent.site.tagline,
      footer: raw?.site?.footer || defaultContent.site.footer,
    },
    timeline: timelineRaw.map((item, index) => ({
      id: item.id || `timeline-${index}-${item.date || 'undated'}`,
      date: item.date,
      title: item.title,
      text: item.text,
      images: Array.isArray(item.images) ? item.images.filter((img) => img && (img.src || img.fileID)) : [],
    })),
    photos: Array.isArray(raw?.photos) ? raw!.photos! : defaultContent.photos,
    letter: letters[0],
    letters,
    agent: (() => {
      const rawAgent = raw?.agent
      // 旧默认名「小壳」自动迁到「小丫头」Suki 风人设；已自定义名字的不覆盖
      if (!rawAgent || rawAgent.name === '小壳') {
        return { ...defaultContent.agent }
      }
      return {
        name: rawAgent.name || defaultContent.agent.name,
        persona: rawAgent.persona || defaultContent.agent.persona,
        greeting: rawAgent.greeting || defaultContent.agent.greeting,
      }
    })(),
    updatedAt: raw?.updatedAt,
  }
}

async function signedUrl(bucket: StorageBucket, path: string) {
  if (!bucket.createSignedUrl) throw new Error('当前环境无法生成文件链接')
  const { data, error } = await bucket.createSignedUrl(path, 7 * 24 * 3600)
  if (error) throw error
  const url = data?.fullSignedURL || data?.signedUrl
  if (!url) throw new Error('获取文件链接失败')
  return url
}

function explainError(error: unknown): Error {
  const raw = String((error as { message?: string })?.message || error || '')
  if (/STORAGE_BUCKET_NOT_FOUND|bucket not found/i.test(raw)) {
    return new Error(bucketMissingMessage())
  }
  if (/403|permission|policy|RLS|row-level|权限/i.test(raw)) {
    return new Error('云存储权限不足。请在 SQL 编辑器执行 docs/CLOUDBASE.md 中的「权限 SQL」后重试。')
  }
  return error instanceof Error ? error : new Error(raw || '云端操作失败')
}

export async function fetchRemoteContent(): Promise<{
  content: AppContent
  source: 'cloud' | 'local'
}> {
  if (!isCloudConfigured()) {
    return { content: defaultContent, source: 'local' }
  }

  try {
    const instance = await ensureApp()
    if (!instance) return { content: defaultContent, source: 'local' }

    const bucket = getBucket(instance)
    const { data, error } = await bucket.download(CONTENT_OBJECT)
    if (error || !data) return { content: defaultContent, source: 'local' }

    const parsed = normalizeContent(JSON.parse(await data.text()) as AppContent)
    parsed.photos = await hydratePhotoUrls(bucket, parsed.photos)
    parsed.timeline = await Promise.all(
      parsed.timeline.map(async (item) => ({
        ...item,
        images: item.images?.length ? await hydrateTimelineImages(bucket, item.images) : [],
      })),
    )
    return { content: parsed, source: 'cloud' }
  } catch (error) {
    console.error('[cloudbase] fetch failed', error)
    return { content: defaultContent, source: 'local' }
  }
}

export async function saveRemoteContent(content: AppContent): Promise<void> {
  if (!isCloudConfigured()) {
    throw new Error('未配置云端。请先在 .env 填写 VITE_CLOUDBASE_ENV。')
  }

  try {
    const instance = await ensureApp()
    if (!instance) throw new Error('云端初始化失败')

    const payload: AppContent = {
      ...normalizeContent(content),
      updatedAt: Date.now(),
    }
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const bucket = getBucket(instance)
    const { error } = await bucket.upload(CONTENT_OBJECT, blob, {
      contentType: 'application/json',
      upsert: true,
    })
    if (error) throw error
  } catch (error) {
    throw explainError(error)
  }
}

export async function uploadRemoteImage(
  file: Blob,
  filename: string,
  folder = 'photos',
): Promise<{
  fileID: string
  url: string
}> {
  if (!isCloudConfigured()) {
    throw new Error('未配置云端，无法上传图片')
  }

  try {
    const instance = await ensureApp()
    if (!instance) throw new Error('云端初始化失败')

    const safeFolder = folder === 'timeline' ? 'timeline' : 'photos'
    const objectPath = `${safeFolder}/${Date.now()}-${filename.replace(/[^\w.-]+/g, '_')}`
    const bucket = getBucket(instance)
    const { data, error } = await bucket.upload(objectPath, file, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })
    if (error) throw error

    const fileID = data?.fullPath || data?.path || `${STORAGE_BUCKET}/${objectPath}`
    const url = await signedUrl(bucket, objectPath)
    return { fileID, url }
  } catch (error) {
    throw explainError(error)
  }
}

async function hydratePhotoUrls(bucket: StorageBucket, photos: AppContent['photos']) {
  const next = [...photos]
  for (let i = 0; i < next.length; i += 1) {
    const photo = next[i]
    if (!photo.fileID) continue
    const path = photo.fileID.replace(new RegExp(`^${STORAGE_BUCKET}/`), '')
    if (!path.startsWith('photos/') && !path.startsWith('data/') && !path.startsWith('timeline/')) continue
    try {
      next[i] = { ...photo, src: await signedUrl(bucket, path) }
    } catch {
      // keep old src
    }
  }
  return next
}

async function hydrateTimelineImages(
  bucket: StorageBucket,
  images: NonNullable<AppContent['timeline'][number]['images']>,
) {
  const next = [...images]
  for (let i = 0; i < next.length; i += 1) {
    const image = next[i]
    if (!image.fileID) continue
    const path = image.fileID.replace(new RegExp(`^${STORAGE_BUCKET}/`), '')
    try {
      next[i] = { ...image, src: await signedUrl(bucket, path) }
    } catch {
      // keep old src
    }
  }
  return next
}
