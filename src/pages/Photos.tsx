import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { BottomSheet } from '../components/BottomSheet'
import { LazyImage } from '../components/LazyImage'
import { PhotoContextMenu } from '../components/PhotoContextMenu'
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
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
    setPendingFiles([])
    setPreviewUrls([])
    setPendingFile(null)
    setPreviewUrl('')
    setEditIndex(null)
    setUploadProgress({ done: 0, total: 0 })
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

  function onPickFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return

    if (mode === 'edit') {
      const file = files[0]
      setPendingFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
      return
    }

    setPendingFiles(files)
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)))
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
    const nextDate = date.trim()

    if (mode === 'create' && pendingFiles.length === 0) {
      setError('先选至少一张照片。')
      return
    }

    setUploading(true)
    setError('')
    try {
      if (mode === 'create') {
        const newItems: PhotoItem[] = []
        setUploadProgress({ done: 0, total: pendingFiles.length })
        for (let i = 0; i < pendingFiles.length; i += 1) {
          const item = await uploadPhoto(pendingFiles[i], {
            caption: pendingFiles.length === 1 ? nextCaption : '',
            date: nextDate,
          })
          newItems.push(item)
          setUploadProgress({ done: i + 1, total: pendingFiles.length })
        }
        const next = [...newItems, ...photos]
        await persist(next, `已添加 ${newItems.length} 张照片。`)
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

  const sheetOpen = mode === 'create' || mode === 'edit'
  const sheetTitle = mode === 'create' ? '添加照片' : '编辑照片'

  return (
    <section className="page photos-page">
      <header className="page-head">
        <h1>相册</h1>
        <p>我们珍贵的回忆</p>
      </header>

      {!cloudEnabled ? (
        <p className="photos-banner warn">尚未配置云端，暂时不能增删改。配置后即可在此直接保存。</p>
      ) : null}

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
              <PhotoContextMenu
                disabled={!photo.src}
                actions={[
                  { label: '查看大图', onClick: () => openLightbox(index) },
                  {
                    label: photo.linkedTimelineId ? '已在时间线' : '加到时间线',
                    onClick: () => void onAddToTimeline(index),
                  },
                  { label: '编辑', onClick: () => openEdit(index) },
                  { label: '删除', onClick: () => void onDelete(index), danger: true },
                ]}
              >
                {photo.src ? (
                  <LazyImage
                    className="photo-thumb-btn"
                    src={photoSrc(photo.src)}
                    alt={photo.caption}
                    onClick={() => openLightbox(index)}
                  />
                ) : (
                  <div className="photo-placeholder" role="img" aria-label={photo.caption}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                  </div>
                )}
              </PhotoContextMenu>
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

      <BottomSheet open={sheetOpen} title={sheetTitle} onClose={backToList}>
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
              {uploading || saving
                ? uploadProgress.total > 0
                  ? `上传 ${uploadProgress.done}/${uploadProgress.total}…`
                  : '保存中…'
                : '保存'}
            </button>
          </div>

          {mode === 'create' ? (
            <>
              <button
                type="button"
                className="photos-pick-zone"
                disabled={uploading || !cloudEnabled}
                onClick={() => fileRef.current?.click()}
              >
                <span className="photos-pick-icon" aria-hidden="true">
                  +
                </span>
                <strong>{previewUrls.length > 0 ? '继续添加照片' : '点这里选择照片'}</strong>
                <small>支持一次选多张</small>
              </button>
              {previewUrls.length > 0 ? (
                <div className="photos-batch-preview">
                  {previewUrls.map((url) => (
                    <img key={url} src={url} alt="" />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="photos-editor-preview">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="" />
                  <button
                    type="button"
                    className="photos-btn ghost"
                    disabled={uploading || !cloudEnabled}
                    onClick={() => fileRef.current?.click()}
                  >
                    更换照片
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="photos-pick-zone compact"
                  disabled={uploading || !cloudEnabled}
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="photos-pick-icon" aria-hidden="true">
                    +
                  </span>
                  <strong>点这里更换照片</strong>
                </button>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={mode === 'create'}
            hidden
            onChange={(e) => onPickFiles(e.target.files)}
          />

          {mode === 'create' && pendingFiles.length > 1 ? (
            <p className="photos-batch-hint">已选 {pendingFiles.length} 张，将使用相同日期批量添加。</p>
          ) : null}

          {mode === 'create' && pendingFiles.length <= 1 ? (
            <label>
              <span>说明（可选）</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="例如：周末的阳光" />
            </label>
          ) : null}

          {mode === 'edit' ? (
            <label>
              <span>说明</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="例如：周末的阳光" />
            </label>
          ) : null}

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
      </BottomSheet>

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
