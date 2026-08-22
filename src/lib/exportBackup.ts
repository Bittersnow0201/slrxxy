import type { AppContent, PhotoItem } from '../data/types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-一-龥]+/g, '_').slice(0, 80) || 'photo'
}

export function downloadJsonBackup(content: AppContent) {
  const stamp = new Date().toISOString().slice(0, 10)
  const payload = JSON.stringify(content, null, 2)
  downloadBlob(new Blob([payload], { type: 'application/json' }), `slrxxy-backup-${stamp}.json`)
}

async function downloadPhotoFile(photo: PhotoItem, index: number) {
  if (!photo.src) return
  const res = await fetch(photo.src)
  if (!res.ok) throw new Error(`照片 ${index + 1} 下载失败`)
  const blob = await res.blob()
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
  const base = safeFilename(photo.caption || `photo-${index + 1}`)
  downloadBlob(blob, `${String(index + 1).padStart(2, '0')}-${base}.${ext}`)
}

/** 逐张下载相册照片（避免引入 zip 依赖） */
export async function downloadAllPhotos(
  photos: PhotoItem[],
  onProgress?: (done: number, total: number) => void,
) {
  const list = photos.filter((p) => p.src)
  if (list.length === 0) throw new Error('没有可下载的照片')

  let done = 0
  for (let i = 0; i < list.length; i += 1) {
    await downloadPhotoFile(list[i], i)
    done += 1
    onProgress?.(done, list.length)
    await new Promise((r) => setTimeout(r, 350))
  }
}
