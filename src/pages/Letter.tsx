import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useContent } from '../content/ContentContext'
import type { AppContent, LetterContent } from '../data/types'
import './Letter.css'

type Mode = 'list' | 'view' | 'edit' | 'create'

function newLetterDraft(): LetterContent {
  return {
    id: `letter-${Date.now()}`,
    from: 'slr',
    to: 'xxy',
    title: '写给你',
    body: '',
    updatedAt: Date.now(),
  }
}

function withSyncedLetters(prev: AppContent, letters: LetterContent[]): AppContent {
  const next = letters.length > 0 ? letters : [newLetterDraft()]
  return {
    ...prev,
    letters: next,
    letter: next[0],
  }
}

export function Letter() {
  const { content, ready, cloudEnabled, saveContent } = useContent()
  const reduce = useReducedMotion()
  const letters = content.letters?.length ? content.letters : [content.letter]

  const [mode, setMode] = useState<Mode>('list')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<LetterContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (mode === 'list') return
    const stillThere = letters.some((item) => item.id === activeId)
    if (!stillThere && mode === 'view') {
      setMode('list')
      setActiveId(null)
    }
  }, [letters, activeId, mode])

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  const active = letters.find((item) => item.id === activeId) || null

  function openView(id: string) {
    setError('')
    setStatus('')
    setActiveId(id)
    setMode('view')
  }

  function openCreate() {
    setError('')
    setStatus('')
    const created = newLetterDraft()
    setDraft(created)
    setActiveId(created.id)
    setMode('create')
  }

  function openEdit(letter: LetterContent) {
    setError('')
    setStatus('')
    setDraft({ ...letter })
    setActiveId(letter.id)
    setMode('edit')
  }

  function backToList() {
    setMode('list')
    setActiveId(null)
    setDraft(null)
    setError('')
  }

  async function persist(nextLetters: LetterContent[], message: string) {
    setSaving(true)
    setError('')
    setStatus('')
    try {
      await saveContent(withSyncedLetters(content, nextLetters))
      setStatus(message)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function onSaveDraft() {
    if (!draft) return
    if (!draft.title.trim() || !draft.body.trim()) {
      setError('标题和正文都要写一点哦。')
      return
    }

    const payload: LetterContent = { ...draft, updatedAt: Date.now() }
    const exists = letters.some((item) => item.id === payload.id)
    const next = exists
      ? letters.map((item) => (item.id === payload.id ? payload : item))
      : [payload, ...letters]

    try {
      await persist(next, '已保存。')
      setActiveId(payload.id)
      setDraft(null)
      setMode('view')
    } catch {
      // error already set
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('确定删除这封信吗？')) return
    const next = letters.filter((item) => item.id !== id)
    try {
      await persist(next.length ? next : [newLetterDraft()], '已删除。')
      backToList()
    } catch {
      // error already set
    }
  }

  return (
    <section className="page letter-page">
      <header className="page-head">
        <h1>写给你</h1>
        <p>想写多少封都行，就在这里慢慢收着。</p>
      </header>

      {!cloudEnabled ? (
        <p className="letter-banner warn">尚未配置云端，暂时不能增删改。配置后即可在此直接保存。</p>
      ) : null}

      {mode === 'list' ? (
        <>
          <div className="letter-toolbar">
            <button type="button" className="letter-btn primary" disabled={!cloudEnabled} onClick={openCreate}>
              写一封新的
            </button>
          </div>

          <div className="letter-list">
            {letters.map((item, index) => (
              <motion.article
                key={item.id}
                className="letter-card"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <button type="button" className="letter-card-main" onClick={() => openView(item.id)}>
                  <h2>{item.title || '未命名信件'}</h2>
                  <p>
                    {item.from} 写给 {item.to}
                  </p>
                  <p className="letter-preview">{item.body.replace(/\s+/g, ' ').trim().slice(0, 72) || '还没有正文'}</p>
                </button>
                <div className="letter-card-actions">
                  <button type="button" className="letter-btn ghost" disabled={!cloudEnabled} onClick={() => openEdit(item)}>
                    编辑
                  </button>
                  <button
                    type="button"
                    className="letter-btn danger"
                    disabled={!cloudEnabled || letters.length <= 1}
                    onClick={() => onDelete(item.id)}
                  >
                    删除
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </>
      ) : null}

      {mode === 'view' && active ? (
        <motion.article
          className="letter-sheet"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="letter-view-head">
            <button type="button" className="letter-btn ghost" onClick={backToList}>
              返回列表
            </button>
            <div className="letter-card-actions">
              <button type="button" className="letter-btn ghost" disabled={!cloudEnabled} onClick={() => openEdit(active)}>
                编辑
              </button>
              <button
                type="button"
                className="letter-btn danger"
                disabled={!cloudEnabled || letters.length <= 1}
                onClick={() => onDelete(active.id)}
              >
                删除
              </button>
            </div>
          </div>
          <h2 className="letter-view-title">{active.title}</h2>
          <p className="letter-view-meta">
            {active.from} 写给 {active.to}
          </p>
          <div className="letter-body">
            {active.body.split('\n').map((line, index) =>
              line.trim() === '' ? <br key={index} /> : <p key={index}>{line}</p>,
            )}
          </div>
        </motion.article>
      ) : null}

      {(mode === 'edit' || mode === 'create') && draft ? (
        <div className="letter-editor">
          <div className="letter-view-head">
            <button type="button" className="letter-btn ghost" onClick={mode === 'create' ? backToList : () => openView(draft.id)}>
              取消
            </button>
            <button type="button" className="letter-btn primary" disabled={saving || !cloudEnabled} onClick={onSaveDraft}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>

          <label>
            <span>标题</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            />
          </label>
          <div className="letter-editor-row">
            <label>
              <span>来自</span>
              <input
                value={draft.from}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, from: e.target.value } : prev))}
              />
            </label>
            <label>
              <span>写给</span>
              <input
                value={draft.to}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, to: e.target.value } : prev))}
              />
            </label>
          </div>
          <label>
            <span>正文</span>
            <textarea
              rows={14}
              value={draft.body}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, body: e.target.value } : prev))}
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="letter-error">{error}</p> : null}
      {status ? <p className="letter-status">{status}</p> : null}
    </section>
  )
}
