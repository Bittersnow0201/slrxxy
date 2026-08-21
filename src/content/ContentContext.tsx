import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { defaultContent } from '../data/content'
import type { AppContent, PhotoItem } from '../data/types'
import {
  fetchRemoteContent,
  isCloudConfigured,
  saveRemoteContent,
  uploadRemoteImage,
  type ContentLoadState,
} from '../lib/cloudbase'
import { compressImage } from '../lib/compressImage'

type ContentContextValue = {
  ready: boolean
  content: AppContent
  source: 'cloud' | 'local'
  loadState: ContentLoadState
  loadError: string
  cloudEnabled: boolean
  refresh: () => Promise<void>
  saveContent: (next: AppContent) => Promise<void>
  uploadPhoto: (file: File, meta: { caption: string; date: string }) => Promise<PhotoItem>
  uploadImage: (file: File, folder?: 'photos' | 'timeline') => Promise<{ src: string; fileID: string }>
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [content, setContent] = useState<AppContent>(defaultContent)
  const [source, setSource] = useState<'cloud' | 'local'>('local')
  const [loadState, setLoadState] = useState<ContentLoadState>('disabled')
  const [loadError, setLoadError] = useState('')
  const cloudEnabled = isCloudConfigured()

  const applyFetch = useCallback(async () => {
    const result = await fetchRemoteContent()
    setContent(result.content)
    setSource(result.source)
    setLoadState(result.loadState)
    setLoadError(result.errorMessage || '')
  }, [])

  const refresh = useCallback(async () => {
    await applyFetch()
  }, [applyFetch])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await fetchRemoteContent()
      if (cancelled) return
      setContent(result.content)
      setSource(result.source)
      setLoadState(result.loadState)
      setLoadError(result.errorMessage || '')
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const saveContent = useCallback(async (next: AppContent) => {
    if (loadState === 'error') {
      throw new Error(
        loadError
          ? `云端读取异常（${loadError}），暂不能保存，以免覆盖云端数据。请刷新后重试。`
          : '云端读取异常，暂不能保存。请刷新后重试。',
      )
    }
    const verified = await saveRemoteContent(next)
    setContent(verified)
    setSource('cloud')
    setLoadState('cloud')
    setLoadError('')
  }, [loadState, loadError])

  const uploadPhoto = useCallback(
    async (file: File, meta: { caption: string; date: string }) => {
      const blob = await compressImage(file)
      const { fileID, url } = await uploadRemoteImage(blob, file.name.replace(/\.\w+$/, '') + '.jpg', 'photos')
      const item: PhotoItem = {
        src: url,
        caption: meta.caption || '未命名照片',
        date: meta.date || new Date().toISOString().slice(0, 10),
        fileID,
      }
      return item
    },
    [],
  )

  const uploadImage = useCallback(async (file: File, folder: 'photos' | 'timeline' = 'photos') => {
    const blob = await compressImage(file)
    const { fileID, url } = await uploadRemoteImage(blob, file.name.replace(/\.\w+$/, '') + '.jpg', folder)
    return { src: url, fileID }
  }, [])

  const value = useMemo(
    () => ({
      ready,
      content,
      source,
      loadState,
      loadError,
      cloudEnabled,
      refresh,
      saveContent,
      uploadPhoto,
      uploadImage,
    }),
    [
      ready,
      content,
      source,
      loadState,
      loadError,
      cloudEnabled,
      refresh,
      saveContent,
      uploadPhoto,
      uploadImage,
    ],
  )

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
