import type { AppContent, PhotoItem, TimelineImage, TimelineItem } from '../data/types'
import { ensureTimelineId, placeTimelineByDate } from './timeline'

export function photoRef(photo: PhotoItem): string {
  return photo.fileID || photo.src || ''
}

export function findPhotoIndex(photos: PhotoItem[], ref: string): number {
  if (!ref) return -1
  return photos.findIndex((p) => photoRef(p) === ref)
}

export function timelineImageFromPhoto(photo: PhotoItem): TimelineImage | null {
  if (!photo.src && !photo.fileID) return null
  return { src: photo.src, fileID: photo.fileID }
}

/** 从相册照片创建一条时间线节点（不重复上传图片，只引用已有 src/fileID） */
export function createTimelineFromPhoto(content: AppContent, photoIndex: number): AppContent {
  const photo = content.photos[photoIndex]
  if (!photo) return content

  const ref = photoRef(photo)
  const image = timelineImageFromPhoto(photo)
  const timelineId = `timeline-photo-${Date.now()}`

  const item: TimelineItem = {
    id: timelineId,
    date: photo.date || new Date().toISOString().slice(0, 10),
    title: photo.caption.trim() || '相册里的这一刻',
    text: '',
    images: image ? [image] : [],
    linkedPhotoRef: ref || undefined,
  }

  const nextTimeline = placeTimelineByDate(
    content.timeline.map((t, i) => ensureTimelineId(t, i)),
    ensureTimelineId(item, 0),
  )

  const nextPhotos = content.photos.map((p, i) =>
    i === photoIndex ? { ...p, linkedTimelineId: timelineId } : p,
  )

  return { ...content, timeline: nextTimeline, photos: nextPhotos }
}

/** 时间线节点关联相册照片（引用已有图片，不重复上传） */
export function linkTimelineToPhoto(content: AppContent, timelineId: string, photoIndex: number): AppContent {
  const photo = content.photos[photoIndex]
  if (!photo) return content

  const ref = photoRef(photo)
  const image = timelineImageFromPhoto(photo)

  const nextTimeline = content.timeline.map((item, index) => {
    const normalized = ensureTimelineId(item, index)
    if (normalized.id !== timelineId) return normalized

    const images = [...(normalized.images || [])]
    if (image && !images.some((img) => (img.fileID || img.src) === ref)) {
      images.push(image)
    }

    return {
      ...normalized,
      linkedPhotoRef: ref || undefined,
      images,
    }
  })

  const nextPhotos = content.photos.map((p, i) => {
    if (i === photoIndex) return { ...p, linkedTimelineId: timelineId }
    if (p.linkedTimelineId === timelineId && i !== photoIndex) {
      const { linkedTimelineId: _, ...rest } = p
      return rest
    }
    return p
  })

  return { ...content, timeline: nextTimeline, photos: nextPhotos }
}

export function clearTimelinePhotoLink(content: AppContent, timelineId: string): AppContent {
  return {
    ...content,
    timeline: content.timeline.map((item, index) => {
      const normalized = ensureTimelineId(item, index)
      if (normalized.id !== timelineId) return normalized
      const { linkedPhotoRef: _, ...rest } = normalized
      return rest
    }),
    photos: content.photos.map((p) =>
      p.linkedTimelineId === timelineId ? (({ linkedTimelineId: __, ...rest }) => rest)(p) : p,
    ),
  }
}
