import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useContent } from '../content/ContentContext'
import { formatDate } from '../lib/days'
import {
  ensureTimelineId,
  moveTimelineItem,
  newTimelineItem,
  placeTimelineByDate,
  sortTimelineByDate,
} from '../lib/timeline'
import type { AppContent, TimelineImage, TimelineItem } from '../data/types'
import './Timeline.css'

type Mode = 'list' | 'edit' | 'create'

function timelineAnchorId(id: string) {
  return `timeline-node-${id}`
}

function withTimeline(prev: AppContent, timeline: TimelineItem[]): AppContent {
  return { ...prev, timeline }
}

export function Timeline() {
  const { content, ready, cloudEnabled, saveContent, uploadImage } = useContent()
  const reduce = useReducedMotion()
  const fileRef = useRef<HTMLInputElement>(null)

  const items = useMemo(
    () => (content.timeline || []).map((item, index) => ensureTimelineId(item, index)),
    [content.timeline],
  )

  const [mode, setMode] = useState<Mode>('list')
  const [draft, setDraft] = useState<TimelineItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [showTop, setShowTop] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [localOrder, setLocalOrder] = useState<TimelineItem[] | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const localOrderRef = useRef<TimelineItem[] | null>(null)

  const displayItems = localOrder || items

  useEffect(() => {
    setLocalOrder(null)
    localOrderRef.current = null
  }, [content.timeline])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 360)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navItems = useMemo(() => {
    const seen = new Set<string>()
    return displayItems
      .map((item) => ({ id: item.id, date: item.date, title: item.title }))
      .filter((item) => {
        if (seen.has(item.date)) return false
        seen.add(item.date)
        return true
      })
  }, [displayItems])

  const jumpTo = useCallback(
    (id: string) => {
      const el = document.getElementById(timelineAnchorId(id))
      el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    },
    [reduce],
  )

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [reduce])

  async function persist(next: TimelineItem[], message: string) {
    setSaving(true)
    setError('')
    setStatus('')
    try {
      await saveContent(withTimeline(content, next))
      setLocalOrder(null)
      setStatus(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      throw err
    } finally {
      setSaving(false)
    }
  }

  function openCreate() {
    setError('')
    setStatus('')
    setDraft(newTimelineItem())
    setMode('create')
  }

  function openEdit(item: TimelineItem) {
    setError('')
    setStatus('')
    setDraft({ ...item, images: [...(item.images || [])] })
    setMode('edit')
  }

  function backToList() {
    setMode('list')
    setDraft(null)
    setError('')
  }

  async function onSaveDraft() {
    if (!draft) return
    const title = draft.title.trim()
    const text = draft.text.trim()
    if (!draft.date) {
      setError('日期要填一下。')
      return
    }
    if (!title && !text) {
      setError('标题或内容至少填一项。')
      return
    }
    const payload = ensureTimelineId(
      {
        ...draft,
        title: title || '未命名',
        text,
        images: draft.images || [],
      },
      0,
    )
    const next = placeTimelineByDate(items, payload)
    try {
      await persist(next, '已保存，并按日期放好了位置。')
      setMode('list')
      setDraft(null)
    } catch {
      // error already set
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('确定删除这条时间线吗？')) return
    try {
      await persist(
        items.filter((item) => item.id !== id),
        '已删除。',
      )
      if (draft?.id === id) backToList()
    } catch {
      // error already set
    }
  }

  async function onSortByDate() {
    try {
      await persist(sortTimelineByDate(items), '已按日期从早到晚整理。')
    } catch {
      // error already set
    }
  }

  async function onPickImage(file: File | undefined) {
    if (!file || !draft) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadImage(file, 'timeline')
      const image: TimelineImage = { src: uploaded.src, fileID: uploaded.fileID }
      setDraft((prev) => (prev ? { ...prev, images: [...(prev.images || []), image] } : prev))
      setStatus('配图已上传，记得点保存。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeDraftImage(index: number) {
    setDraft((prev) =>
      prev ? { ...prev, images: (prev.images || []).filter((_, i) => i !== index) } : prev,
    )
  }

  function onDragStart(id: string) {
    if (!cloudEnabled || mode !== 'list' || saving) return
    dragIdRef.current = id
    setDragId(id)
    setStatus('')
    setError('')
  }

  function onDragOver(targetId: string) {
    const fromId = dragIdRef.current
    if (!fromId || fromId === targetId) return
    setLocalOrder((prev) => {
      const next = moveTimelineItem(prev || items, fromId, targetId)
      localOrderRef.current = next
      return next
    })
  }

  async function onDragEnd() {
    const fromId = dragIdRef.current
    dragIdRef.current = null
    setDragId(null)
    if (!fromId) return
    const next = localOrderRef.current
    if (!next) return
    const same =
      next.length === items.length && next.every((item, index) => item.id === items[index]?.id)
    if (same) {
      setLocalOrder(null)
      localOrderRef.current = null
      return
    }
    try {
      await persist(next, '顺序已更新。')
    } catch {
      setLocalOrder(null)
      localOrderRef.current = null
    }
  }

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  return (
    <section className="page timeline-page">
      <header className="page-head">
        <h1>我们的时间线</h1>
        <p>日子叠在一起，就慢慢成了故事。</p>
      </header>

      {!cloudEnabled ? (
        <p className="timeline-banner warn">尚未配置云端，暂时不能增删改。配置后即可在此直接保存。</p>
      ) : null}

      {mode === 'list' ? (
        <>
          <div className="timeline-toolbar">
            <button type="button" className="timeline-btn ghost" disabled={!cloudEnabled || saving} onClick={onSortByDate}>
              按日期整理
            </button>
            <button type="button" className="timeline-btn primary" disabled={!cloudEnabled || saving} onClick={openCreate}>
              添加节点
            </button>
          </div>

          {navItems.length > 0 ? (
            <nav className="timeline-nav" aria-label="时间节点">
              <ol className="timeline-nav-track">
                {navItems.map((item, i) => (
                  <li key={item.id}>
                    {i > 0 ? <span className="timeline-nav-line" aria-hidden="true" /> : null}
                    <button
                      type="button"
                      className="timeline-nav-node"
                      onClick={() => jumpTo(item.id)}
                      title={item.title}
                    >
                      <span className="timeline-nav-dot" aria-hidden="true" />
                      <time dateTime={item.date}>{formatDate(item.date)}</time>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <ol className="timeline">
            {displayItems.map((item, index) => {
              const images = (item.images || []).filter((img) => img.src)
              const dragging = dragId === item.id
              return (
                <motion.li
                  key={item.id}
                  id={timelineAnchorId(item.id)}
                  data-timeline-id={item.id}
                  className={`timeline-item${index % 2 === 1 ? ' offset' : ''}${images.length ? ' has-photos' : ''}${dragging ? ' dragging' : ''}`}
                  initial={reduce ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.65, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    className="timeline-drag"
                    disabled={!cloudEnabled || saving}
                    aria-label="拖动调整顺序"
                    title="拖动调整顺序"
                    onPointerDown={(e) => {
                      if (!cloudEnabled || saving || e.button !== 0) return
                      e.preventDefault()
                      e.currentTarget.setPointerCapture(e.pointerId)
                      onDragStart(item.id)
                    }}
                    onPointerMove={(e) => {
                      if (!dragIdRef.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return
                      const under = document.elementFromPoint(e.clientX, e.clientY)
                      const target = under?.closest('[data-timeline-id]') as HTMLElement | null
                      const targetId = target?.dataset.timelineId
                      if (targetId) onDragOver(targetId)
                    }}
                    onPointerUp={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId)
                      }
                      onDragEnd()
                    }}
                    onPointerCancel={() => {
                      dragIdRef.current = null
                      localOrderRef.current = null
                      setDragId(null)
                      setLocalOrder(null)
                    }}
                  >
                    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                      <circle cx="7" cy="5" r="1.4" fill="currentColor" />
                      <circle cx="13" cy="5" r="1.4" fill="currentColor" />
                      <circle cx="7" cy="10" r="1.4" fill="currentColor" />
                      <circle cx="13" cy="10" r="1.4" fill="currentColor" />
                      <circle cx="7" cy="15" r="1.4" fill="currentColor" />
                      <circle cx="13" cy="15" r="1.4" fill="currentColor" />
                    </svg>
                  </button>

                  {images.length > 0 ? (
                    <div className={`timeline-photos count-${Math.min(images.length, 3)}`}>
                      {images.slice(0, 6).map((img, i) => (
                        <img key={`${img.fileID || img.src}-${i}`} src={img.src} alt="" loading="lazy" />
                      ))}
                    </div>
                  ) : null}

                  <div className="timeline-body">
                    <time dateTime={item.date}>{formatDate(item.date)}</time>
                    <h2>{item.title}</h2>
                    {item.text ? <p>{item.text}</p> : null}
                    <div className="timeline-item-actions">
                      <button
                        type="button"
                        className="timeline-btn ghost tiny"
                        disabled={!cloudEnabled || saving}
                        onClick={() => openEdit(item)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="timeline-btn danger tiny"
                        disabled={!cloudEnabled || saving}
                        onClick={() => onDelete(item.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ol>
        </>
      ) : null}

      {(mode === 'edit' || mode === 'create') && draft ? (
        <div className="timeline-editor">
          <div className="timeline-editor-head">
            <button type="button" className="timeline-btn ghost" onClick={backToList}>
              取消
            </button>
            <button
              type="button"
              className="timeline-btn primary"
              disabled={saving || !cloudEnabled}
              onClick={onSaveDraft}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>

          <label>
            <span>日期</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
            />
          </label>
          <label>
            <span>标题</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            />
          </label>
          <label>
            <span>内容</span>
            <textarea
              rows={6}
              value={draft.text}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
            />
          </label>

          <div className="timeline-editor-images">
            <span className="timeline-editor-label">配图（可选）</span>
            <div className="timeline-editor-thumbs">
              {(draft.images || []).map((img, imgIndex) => (
                <div key={`${img.fileID || img.src}-${imgIndex}`} className="timeline-editor-thumb">
                  {img.src ? <img src={img.src} alt="" /> : <span>无图</span>}
                  <button type="button" className="timeline-btn danger tiny" onClick={() => removeDraftImage(imgIndex)}>
                    删除
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onPickImage(e.target.files?.[0])}
            />
            <button
              type="button"
              className="timeline-btn ghost"
              disabled={uploading || !cloudEnabled}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? '上传中…' : '添加配图'}
            </button>
          </div>

          {mode === 'edit' ? (
            <button
              type="button"
              className="timeline-btn danger"
              disabled={!cloudEnabled || saving}
              onClick={() => onDelete(draft.id)}
            >
              删除这条
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="timeline-error">{error}</p> : null}
      {status ? <p className="timeline-status">{status}</p> : null}

      <button
        type="button"
        className={`timeline-top${showTop ? ' visible' : ''}`}
        onClick={scrollTop}
        aria-label="回到顶部"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M6 14.5 12 8.5l6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  )
}
