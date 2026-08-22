import { useCallback, useEffect, useRef, useState } from 'react'
import type { PhotoItem } from '../data/types'
import { formatDate } from '../lib/days'
import './PhotoLightbox.css'

type Props = {
  photos: PhotoItem[]
  index: number
  srcFor: (src: string) => string
  onClose: () => void
  onIndexChange: (index: number) => void
}

const SWIPE_THRESHOLD = 56
const DISMISS_THRESHOLD = 90

export function PhotoLightbox({ photos, index, srcFor, onClose, onIndexChange }: Props) {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(index - 1)
  }, [hasPrev, index, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1)
  }, [hasNext, index, onIndexChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [goNext, goPrev, onClose])

  if (!photo?.src) return null

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    const start = touchRef.current
    if (!start) return
    const t = e.touches[0]
    const dy = t.clientY - start.y
    if (dy > 0) setDragY(dy)
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchRef.current
    touchRef.current = null
    setDragging(false)

    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y

    if (dy > DISMISS_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onClose()
      setDragY(0)
      return
    }

    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext()
      else goPrev()
    }

    setDragY(0)
  }

  const opacity = Math.max(0.35, 1 - dragY / 280)

  return (
    <div
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="照片预览"
      style={{ '--lb-opacity': opacity } as React.CSSProperties}
      onClick={onClose}
    >
      <div
        className="photo-lightbox-panel"
        style={{ transform: `translateY(${dragY}px)` }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        {hasPrev ? (
          <button type="button" className="photo-lightbox-nav prev" onClick={goPrev} aria-label="上一张">
            ‹
          </button>
        ) : null}
        {hasNext ? (
          <button type="button" className="photo-lightbox-nav next" onClick={goNext} aria-label="下一张">
            ›
          </button>
        ) : null}

        <img
          className={`photo-lightbox-img${dragging ? ' dragging' : ''}`}
          src={srcFor(photo.src)}
          alt={photo.caption || ''}
          draggable={false}
        />

        {(photo.caption || photo.date) && (
          <figcaption className="photo-lightbox-cap">
            {photo.caption ? <span>{photo.caption}</span> : null}
            {photo.date ? <time dateTime={photo.date}>{formatDate(photo.date)}</time> : null}
          </figcaption>
        )}

        {photos.length > 1 ? (
          <p className="photo-lightbox-count">
            {index + 1} / {photos.length}
          </p>
        ) : null}
      </div>
    </div>
  )
}
