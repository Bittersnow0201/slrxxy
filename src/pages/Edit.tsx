import { useEffect, useRef, useState } from 'react'
import { useContent } from '../content/ContentContext'
import type { AppContent, LetterContent, PhotoItem, TimelineItem } from '../data/types'
import { ensureTimelineId, newTimelineItem, placeTimelineByDate } from '../lib/timeline'
import './Edit.css'

type Tab = 'basic' | 'timeline' | 'photos' | 'letter'

export function Edit() {
  const { ready, content, cloudEnabled, source, saveContent, uploadPhoto, uploadImage, refresh } =
    useContent()
  const [tab, setTab] = useState<Tab>('basic')
  const [draft, setDraft] = useState<AppContent>(content)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const timelineFileRef = useRef<HTMLInputElement>(null)
  const [timelineUploadIndex, setTimelineUploadIndex] = useState<number | null>(null)
  const [newCaption, setNewCaption] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setDraft(content)
  }, [content])

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  async function onSave() {
    setError('')
    setStatus('')
    setSaving(true)
    try {
      await saveContent(draft)
      setStatus('已保存到云端。对方刷新后就能看到。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function onReload() {
    setError('')
    setStatus('正在拉取最新内容…')
    await refresh()
    setStatus('已从云端刷新')
  }

  function updateTimeline(index: number, patch: Partial<TimelineItem>) {
    setDraft((prev) => {
      const current = ensureTimelineId(prev.timeline[index], index)
      const nextItem = { ...current, ...patch }
      if (patch.date && patch.date !== current.date) {
        return { ...prev, timeline: placeTimelineByDate(prev.timeline.map(ensureTimelineId), nextItem) }
      }
      return {
        ...prev,
        timeline: prev.timeline.map((item, i) => (i === index ? nextItem : ensureTimelineId(item, i))),
      }
    })
  }

  function addTimeline() {
    setDraft((prev) => ({
      ...prev,
      timeline: placeTimelineByDate(
        prev.timeline.map(ensureTimelineId),
        newTimelineItem({ title: '新的一天', text: '写一点想记住的事。' }),
      ),
    }))
  }

  function removeTimeline(index: number) {
    setDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index),
    }))
  }

  function removeTimelineImage(itemIndex: number, imageIndex: number) {
    setDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.map((item, i) => {
        if (i !== itemIndex) return item
        return {
          ...item,
          images: (item.images || []).filter((_, j) => j !== imageIndex),
        }
      }),
    }))
  }

  function updatePhoto(index: number, patch: Partial<PhotoItem>) {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  function removePhoto(index: number) {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  function lettersOf(content: AppContent): LetterContent[] {
    return content.letters?.length ? content.letters : [content.letter]
  }

  function setLetters(next: LetterContent[]) {
    const letters = next.length > 0 ? next : lettersOf(draft)
    setDraft((prev) => ({
      ...prev,
      letters,
      letter: letters[0],
    }))
  }

  function updateLetter(index: number, patch: Partial<LetterContent>) {
    const current = lettersOf(draft)
    setLetters(current.map((item, i) => (i === index ? { ...item, ...patch, updatedAt: Date.now() } : item)))
  }

  function addLetter() {
    setLetters([
      {
        id: `letter-${Date.now()}`,
        from: 'slr',
        to: 'xxy',
        title: '写给你',
        body: '',
        updatedAt: Date.now(),
      },
      ...lettersOf(draft),
    ])
  }

  function removeLetter(index: number) {
    const current = lettersOf(draft)
    if (current.length <= 1) return
    setLetters(current.filter((_, i) => i !== index))
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const item = await uploadPhoto(file, { caption: newCaption, date: newDate })
      setDraft((prev) => ({
        ...prev,
        photos: [item, ...prev.photos.filter((p) => p.src)],
      }))
      setNewCaption('')
      setStatus('照片已上传，记得点「保存到云端」。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onPickTimelineImage(file: File | undefined) {
    if (!file || timelineUploadIndex === null) return
    const index = timelineUploadIndex
    setError('')
    setUploading(true)
    try {
      const uploaded = await uploadImage(file, 'timeline')
      setDraft((prev) => ({
        ...prev,
        timeline: prev.timeline.map((item, i) => {
          if (i !== index) return item
          return {
            ...item,
            images: [...(item.images || []), { src: uploaded.src, fileID: uploaded.fileID }],
          }
        }),
      }))
      setStatus('时间线配图已上传，记得点「保存到云端」。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      setTimelineUploadIndex(null)
      if (timelineFileRef.current) timelineFileRef.current.value = ''
    }
  }

  return (
    <section className="page edit-page">
      <header className="page-head">
        <h1>一起编辑</h1>
        <p>改完后点保存，两个人刷新就能同步。</p>
      </header>

      <div className={`edit-banner${cloudEnabled ? ' ok' : ' warn'}`}>
        {cloudEnabled
          ? `云端已连接（当前内容来自${source === 'cloud' ? '云端' : '本地默认'}）`
          : '尚未配置云端。请按 docs/CLOUDBASE.md 填写 VITE_CLOUDBASE_ENV 后重新发布。'}
      </div>

      <div className="edit-tabs" role="tablist" aria-label="编辑分区">
        {(
          [
            ['basic', '基本'],
            ['timeline', '时间线'],
            ['photos', '相册'],
            ['letter', '信件'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="edit-panel">
          <label>
            <span>站点名称</span>
            <input
              value={draft.site.brand}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, site: { ...prev.site, brand: e.target.value } }))
              }
            />
          </label>
          <label>
            <span>首页短句</span>
            <textarea
              rows={3}
              value={draft.site.tagline}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, site: { ...prev.site, tagline: e.target.value } }))
              }
            />
          </label>
          <label>
            <span>页脚</span>
            <input
              value={draft.site.footer}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, site: { ...prev.site, footer: e.target.value } }))
              }
            />
          </label>
          <label>
            <span>在一起的日期</span>
            <input
              type="date"
              value={draft.togetherSince}
              onChange={(e) => setDraft((prev) => ({ ...prev, togetherSince: e.target.value }))}
            />
          </label>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="edit-panel">
          <input
            ref={timelineFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => onPickTimelineImage(e.target.files?.[0])}
          />
          {draft.timeline.map((item, index) => (
            <article key={item.id || `edit-timeline-${index}`} className="edit-card">
              <label>
                <span>日期</span>
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => updateTimeline(index, { date: e.target.value })}
                />
              </label>
              <label>
                <span>标题</span>
                <input
                  value={item.title}
                  onChange={(e) => updateTimeline(index, { title: e.target.value })}
                />
              </label>
              <label>
                <span>内容</span>
                <textarea
                  rows={3}
                  value={item.text}
                  onChange={(e) => updateTimeline(index, { text: e.target.value })}
                />
              </label>
              <div className="edit-timeline-images">
                <span className="edit-sublabel">配图（可选）</span>
                <div className="edit-thumb-row">
                  {(item.images || []).map((img, imgIndex) => (
                    <div key={`${img.fileID || img.src}-${imgIndex}`} className="edit-thumb-wrap">
                      {img.src ? (
                        <img className="edit-thumb" src={img.src} alt="" />
                      ) : (
                        <div className="edit-thumb empty">无图</div>
                      )}
                      <button
                        type="button"
                        className="danger tiny"
                        onClick={() => removeTimelineImage(index, imgIndex)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="secondary"
                  disabled={uploading || !cloudEnabled}
                  onClick={() => {
                    setTimelineUploadIndex(index)
                    timelineFileRef.current?.click()
                  }}
                >
                  {uploading && timelineUploadIndex === index ? '上传中…' : '添加配图'}
                </button>
              </div>
              <button type="button" className="danger" onClick={() => removeTimeline(index)}>
                删除这条
              </button>
            </article>
          ))}
          <button type="button" className="secondary" onClick={addTimeline}>
            添加大事记
          </button>
        </div>
      )}

      {tab === 'photos' && (
        <div className="edit-panel">
          <div className="edit-card upload-card">
            <label>
              <span>照片说明</span>
              <input
                value={newCaption}
                placeholder="例如：周末的阳光"
                onChange={(e) => setNewCaption(e.target.value)}
              />
            </label>
            <label>
              <span>日期</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => onPickPhoto(e.target.files?.[0])}
            />
            <button
              type="button"
              className="secondary"
              disabled={uploading || !cloudEnabled}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? '上传中…' : '从手机选图 / 拍照'}
            </button>
          </div>

          {draft.photos.map((photo, index) => (
            <article key={index} className="edit-card">
              {photo.src ? (
                <img className="edit-thumb" src={photo.src} alt={photo.caption} />
              ) : (
                <div className="edit-thumb empty">暂无图片</div>
              )}
              <label>
                <span>说明</span>
                <input
                  value={photo.caption}
                  onChange={(e) => updatePhoto(index, { caption: e.target.value })}
                />
              </label>
              <label>
                <span>日期</span>
                <input
                  type="date"
                  value={photo.date}
                  onChange={(e) => updatePhoto(index, { date: e.target.value })}
                />
              </label>
              <button type="button" className="danger" onClick={() => removePhoto(index)}>
                删除
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === 'letter' && (
        <div className="edit-panel">
          {lettersOf(draft).map((item, index) => (
            <article key={item.id || index} className="edit-card">
              <label>
                <span>标题</span>
                <input value={item.title} onChange={(e) => updateLetter(index, { title: e.target.value })} />
              </label>
              <div className="edit-row">
                <label>
                  <span>来自</span>
                  <input value={item.from} onChange={(e) => updateLetter(index, { from: e.target.value })} />
                </label>
                <label>
                  <span>写给</span>
                  <input value={item.to} onChange={(e) => updateLetter(index, { to: e.target.value })} />
                </label>
              </div>
              <label>
                <span>正文</span>
                <textarea
                  rows={10}
                  value={item.body}
                  onChange={(e) => updateLetter(index, { body: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="danger"
                disabled={lettersOf(draft).length <= 1}
                onClick={() => removeLetter(index)}
              >
                删除这封
              </button>
            </article>
          ))}
          <button type="button" className="secondary" onClick={addLetter}>
            再写一封
          </button>
        </div>
      )}

      {error ? <p className="edit-error">{error}</p> : null}
      {status ? <p className="edit-status">{status}</p> : null}

      <div className="edit-actions">
        <button type="button" className="ghost" onClick={onReload}>
          刷新云端
        </button>
        <button type="button" className="primary" disabled={saving || !cloudEnabled} onClick={onSave}>
          {saving ? '保存中…' : '保存到云端'}
        </button>
      </div>
    </section>
  )
}
