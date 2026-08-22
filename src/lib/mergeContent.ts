import type { AppContent } from '../data/types'

/** 比较内容是否变化（忽略图片签名 URL，避免无意义整页重渲染） */
export function contentFingerprint(content: AppContent): string {
  return JSON.stringify({
    togetherSince: content.togetherSince,
    site: content.site,
    timeline: content.timeline.map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      text: item.text,
      linkedPhotoRef: item.linkedPhotoRef,
      images: item.images?.map((img) => ({ fileID: img.fileID, src: img.fileID ? undefined : img.src })),
    })),
    photos: content.photos.map((photo) => ({
      caption: photo.caption,
      date: photo.date,
      fileID: photo.fileID,
      linkedTimelineId: photo.linkedTimelineId,
      src: photo.fileID ? undefined : photo.src,
    })),
    letters: content.letters,
    agent: content.agent,
    updatedAt: content.updatedAt,
  })
}

export function mergeContentPreservingUrls(prev: AppContent, next: AppContent): AppContent {
  const photos = next.photos.map((photo, index) => {
    const prevPhoto =
      (photo.fileID && prev.photos.find((p) => p.fileID === photo.fileID)) || prev.photos[index]
    if (prevPhoto?.src && prevPhoto.fileID === photo.fileID) {
      return { ...photo, src: prevPhoto.src }
    }
    if (!photo.fileID && prevPhoto?.src === photo.src) {
      return photo
    }
    return photo
  })

  const timeline = next.timeline.map((item, index) => {
    const prevItem =
      (item.id && prev.timeline.find((t) => t.id === item.id)) || prev.timeline[index]
    const images = item.images?.map((img, imgIndex) => {
      const pool = prev.timeline.flatMap((t) => t.images || [])
      const prevImg =
        (img.fileID && pool.find((i) => i.fileID === img.fileID)) || prevItem?.images?.[imgIndex]
      if (prevImg?.src && prevImg.fileID === img.fileID) {
        return { ...img, src: prevImg.src }
      }
      if (!img.fileID && prevImg?.src === img.src) {
        return img
      }
      return img
    })
    return images ? { ...item, images } : item
  })

  return { ...next, photos, timeline }
}
