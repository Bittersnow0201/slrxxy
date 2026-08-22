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
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const touchRef = useRef<{ x: number; y: number; dist?: number; startScale?: number } | null>(null)
  const imgWrapRef = useRef<HTMLDivElement>(null)

  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1
  const zoomed = scale > 1.05

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
      onIndexChange(index - 1)
    }
  }, [hasPrev, index, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
      onIndexChange(index + 1)
    }
  }, [hasNext, index, onIndexChange])

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    setDragY(0)
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (!zoomed && e.key === 'ArrowLeft') goPrev()
      if (!zoomed && e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [goNext, goPrev, onClose, zoomed])

  if (!photo?.src) return null

  function dist(touches: React.TouchList) {
    const a = touches[0]
    const b = touches[1]
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      touchRef.current = { x: 0, y: 0, dist: dist(e.touches), startScale: scale }
      return
    }
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchMove(e: React.TouchEvent) {
    const start = touchRef.current
    if (!start) return

    if (e.touches.length === 2 && start.dist && start.startScale) {
      const next = Math.min(4, Math.max(1, (dist(e.touches) / start.dist) * start.startScale))
      setScale(next)
      return
    }

    if (zoomed || e.touches.length !== 1) return
    const t = e.touches[0]
    const dy = t.clientY - start.y
    if (dy > 0) setDragY(dy)
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchRef.current
    touchRef.current = null

    if (scale < 1.05) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }

    if (!start || zoomed) {
      setDragY(0)
      return
    }

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

  function onDoubleClick() {
    if (scale > 1.2) {
      setScale(1)
      setOffset({ x: 0, y: 0 })
    } else {
      setScale(2.2)
    }
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
      >
        <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        {!zoomed && hasPrev ? (
          <button type="button" className="photo-lightbox-nav prev" onClick={goPrev} aria-label="上一张">
            ‹
          </button>
        ) : null}
        {!zoomed && hasNext ? (
          <button type="button" className="photo-lightbox-nav next" onClick={goNext} aria-label="下一张">
            ›
          </button>
        ) : null}

        <div
          ref={imgWrapRef}
          className="photo-lightbox-zoom"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onDoubleClick={onDoubleClick}
        >
          <img
            className="photo-lightbox-img"
            src={srcFor(photo.src)}
            alt={photo.caption || ''}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          />
        </div>

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
