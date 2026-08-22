import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { useContent } from '../content/ContentContext'
import { formatDate } from '../lib/days'
import { createTimelineFromPhoto } from '../lib/photoLink'
import type { AppContent, PhotoItem } from '../data/types'
import './Photos.css'

type Mode = 'list' | 'create' | 'edit'

function photoSrc(src: string) {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('cloud://')) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

function photoKey(photo: PhotoItem, index: number) {
  return photo.fileID || `${photo.src || 'empty'}-${photo.date}-${photo.caption}-${index}`
}

function withPhotos(prev: AppContent, photos: PhotoItem[]): AppContent {
  return { ...prev, photos }
}

export function Photos() {
  const { content, ready, cloudEnabled, saveContent, uploadPhoto } = useContent()
  const reduce = useReducedMotion()
  const fileRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('list')
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const photos = content.photos || []
  const viewablePhotos = useMemo(() => photos.filter((p) => p.src), [photos])

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  function resetForm() {
    setCaption('')
    setDate('')
    setPendingFile(null)
    setPreviewUrl('')
    setEditIndex(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function openCreate() {
    setError('')
    setStatus('')
    resetForm()
    setMode('create')
  }

  function openEdit(index: number) {
    const photo = photos[index]
    if (!photo) return
    setError('')
    setStatus('')
    setEditIndex(index)
    setCaption(photo.caption || '')
    setDate(photo.date || '')
    setPendingFile(null)
    setPreviewUrl(photo.src ? photoSrc(photo.src) : '')
    setMode('edit')
  }

  function backToList() {
    setMode('list')
    resetForm()
    setError('')
  }

  function onPickFile(file: File | undefined) {
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError('')
  }

  async function persist(next: PhotoItem[], message: string) {
    setSaving(true)
    setError('')
    setStatus('')
    try {
      await saveContent(withPhotos(content, next))
      setStatus(message)
      setMode('list')
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function onSave() {
    const nextCaption = caption.trim()

    if (mode === 'create' && !pendingFile) {
      setError('先选一张照片。')
      return
    }

    setUploading(true)
    setError('')
    try {
      const nextDate = date.trim()

      if (mode === 'create') {
        const item = await uploadPhoto(pendingFile!, {
          caption: nextCaption,
          date: nextDate,
        })
        const next = [item, ...photos.filter((p) => p.src)]
        await persist(next, '已添加照片。')
        return
      }

      if (mode === 'edit' && editIndex !== null) {
        const current = photos[editIndex]
        if (!current) return
        let nextItem: PhotoItem = {
          ...current,
          caption: nextCaption,
          date: nextDate,
        }
        if (pendingFile) {
          nextItem = await uploadPhoto(pendingFile, {
            caption: nextItem.caption,
            date: nextDate,
          })
        }
        const next = photos.map((item, i) => (i === editIndex ? nextItem : item))
        await persist(next, '已更新。')
      }
    } catch (err) {
      if (!(err instanceof Error && err.message === '保存失败')) {
        setError(err instanceof Error ? err.message : '操作失败')
      }
    } finally {
      setUploading(false)
    }
  }

  async function onAddToTimeline(index: number) {
    const photo = photos[index]
    if (!photo?.src) return
    if (photo.linkedTimelineId) {
      setStatus('这张照片已经关联过时间线了。')
      return
    }
    if (!window.confirm('把这张照片加到时间线？会引用同一张图，不会重复上传。')) return
    setSaving(true)
    setError('')
    try {
      const next = createTimelineFromPhoto(content, index)
      await saveContent(next)
      setStatus('已加到时间线，可以去时间线里补充文字。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  function openLightbox(index: number) {
    const photo = photos[index]
    if (!photo?.src) return
    const viewIndex = viewablePhotos.findIndex(
      (p) => (p.fileID && p.fileID === photo.fileID) || p.src === photo.src,
    )
    if (viewIndex >= 0) setLightboxIndex(viewIndex)
  }

  async function onDelete(index: number) {
    const photo = photos[index]
    if (!photo) return
    if (!window.confirm(`确定删除「${photo.caption || '这张照片'}」吗？`)) return
    try {
      await persist(
        photos.filter((_, i) => i !== index),
        '已删除。',
      )
    } catch {
      // error already set
    }
  }

  return (
    <section className="page photos-page">
      <header className="page-head">
        <h1>相册</h1>
        <p>我们珍贵的回忆</p>
      </header>

      {!cloudEnabled ? (
        <p className="photos-banner warn">尚未配置云端，暂时不能增删改。配置后即可在此直接保存。</p>
      ) : null}

      {mode === 'list' ? (
        <>
          <div className="photos-toolbar">
            <button type="button" className="photos-btn primary" disabled={!cloudEnabled || saving} onClick={openCreate}>
              添加照片
            </button>
          </div>

          {photos.length === 0 ? (
            <p className="photos-empty">还没有照片，点上面加一张吧。</p>
          ) : (
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <motion.figure
                  key={photoKey(photo, index)}
                  className={`photo-item tone-${(index % 4) + 1}`}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.65, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  {photo.src ? (
                    <button type="button" className="photo-thumb-btn" onClick={() => openLightbox(index)}>
                      <img src={photoSrc(photo.src)} alt={photo.caption} loading="lazy" />
                    </button>
                  ) : (
                    <div className="photo-placeholder" role="img" aria-label={photo.caption}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  )}
                  {photo.caption || photo.date ? (
                    <figcaption>
                      {photo.caption ? <span>{photo.caption}</span> : null}
                      {photo.date ? <time dateTime={photo.date}>{formatDate(photo.date)}</time> : null}
                    </figcaption>
                  ) : null}
                  <div className="photo-item-actions">
                    {photo.linkedTimelineId ? (
                      <Link to="/timeline" className="photos-btn ghost tiny">
                        已在时间线
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="photos-btn ghost tiny"
                        disabled={!cloudEnabled || saving || !photo.src}
                        onClick={() => void onAddToTimeline(index)}
                      >
                        加到时间线
                      </button>
                    )}
                    <button
                      type="button"
                      className="photos-btn ghost tiny"
                      disabled={!cloudEnabled || saving}
                      onClick={() => openEdit(index)}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="photos-btn danger tiny"
                      disabled={!cloudEnabled || saving}
                      onClick={() => onDelete(index)}
                    >
                      删除
                    </button>
                  </div>
                </motion.figure>
              ))}
            </div>
          )}
        </>
      ) : null}

      {(mode === 'create' || mode === 'edit') && (
        <div className="photos-editor">
          <div className="photos-editor-head">
            <button type="button" className="photos-btn ghost" onClick={backToList}>
              取消
            </button>
            <button
              type="button"
              className="photos-btn primary"
              disabled={saving || uploading || !cloudEnabled}
              onClick={() => void onSave()}
            >
              {uploading || saving ? '保存中…' : '保存'}
            </button>
          </div>

          <div className="photos-editor-preview">
            {previewUrl ? (
              <img src={previewUrl} alt="" />
            ) : (
              <div className="photo-placeholder">
                <span>选图</span>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="photos-btn ghost"
            disabled={uploading || !cloudEnabled}
            onClick={() => fileRef.current?.click()}
          >
            {mode === 'create' ? '从相册选图' : '更换照片'}
          </button>

          <label>
            <span>说明</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="例如：周末的阳光" />
          </label>
          <label>
            <span>日期（可选，不选则不显示）</span>
            <div className="photos-date-row">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              {date ? (
                <button type="button" className="photos-btn ghost tiny" onClick={() => setDate('')}>
                  清除日期
                </button>
              ) : null}
            </div>
          </label>

          {mode === 'edit' && editIndex !== null ? (
            <button
              type="button"
              className="photos-btn danger"
              disabled={!cloudEnabled || saving}
              onClick={() => onDelete(editIndex)}
            >
              删除这张
            </button>
          ) : null}
        </div>
      )}

      {error ? <p className="photos-error">{error}</p> : null}
      {status ? <p className="photos-status">{status}</p> : null}

      {lightboxIndex !== null ? (
        <PhotoLightbox
          photos={viewablePhotos}
          index={lightboxIndex}
          srcFor={photoSrc}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </section>
  )
}
