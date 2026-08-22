import { useEffect, useRef, useState } from 'react'
import { useContent } from '../content/ContentContext'
import { useDraggableFab } from '../hooks/useDraggableFab'
import { sendAgentChat, type AgentChatMessage } from '../lib/agentApi'
import type { AgentContent } from '../data/types'
import './AgentChat.css'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const AVATAR = `${import.meta.env.BASE_URL}media/agent-chick.png`

export function AgentChat() {
  const { content, ready, cloudEnabled, saveContent } = useContent()
  const agent = content.agent
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [draftAgent, setDraftAgent] = useState<AgentContent>(agent)
  const [savingPersona, setSavingPersona] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const drag = useDraggableFab(66)

  const [activeAgent, setActiveAgent] = useState<AgentContent>(agent)

  useEffect(() => {
    setDraftAgent(agent)
    setActiveAgent(agent)
  }, [agent])

  useEffect(() => {
    if (!open) return
    if (messages.length === 0 && activeAgent.greeting) {
      setMessages([{ id: 'greet', role: 'assistant', content: activeAgent.greeting }])
    }
  }, [open, activeAgent.greeting, messages.length])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  async function onSend() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setError('')

    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    const prior = messages.filter((m) => m.id !== 'greet')
    const nextUi = [...messages, userMsg]
    setMessages(nextUi)
    setBusy(true)

    const apiMessages: AgentChatMessage[] = [
      { role: 'system', content: activeAgent.persona },
      ...prior.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ]

    try {
      const reply = await sendAgentChat(apiMessages)
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : '对话失败')
    } finally {
      setBusy(false)
    }
  }

  async function onSavePersona() {
    setSavingPersona(true)
    setError('')
    try {
      if (cloudEnabled) {
        await saveContent({ ...content, agent: draftAgent })
      } else {
        setActiveAgent(draftAgent)
      }
      setActiveAgent(draftAgent)
      setSettingsOpen(false)
      setMessages([{ id: 'greet', role: 'assistant', content: draftAgent.greeting }])
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存人设失败')
    } finally {
      setSavingPersona(false)
    }
  }

  function onClearChat() {
    setMessages([{ id: 'greet', role: 'assistant', content: activeAgent.greeting }])
    setError('')
  }

  if (!ready) return null

  return (
    <>
      <button
        type="button"
        ref={drag.ref}
        className={`agent-fab${open ? ' is-open' : ''}${drag.style ? ' is-dragged' : ''}`}
        style={drag.style}
        onClick={() => {
          if (drag.moved.current) {
            drag.moved.current = false
            return
          }
          setOpen((v) => !v)
        }}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
        aria-label={open ? `关闭${activeAgent.name}` : `打开${activeAgent.name}`}
        title={`${activeAgent.name}（可拖动）`}
      >
        <img src={AVATAR} alt="" draggable={false} />
      </button>

      {open ? (
        <section className="agent-panel" aria-label={`${activeAgent.name}对话`}>
          <header className="agent-panel-head">
            <div className="agent-panel-title">
              <img src={AVATAR} alt="" className="agent-panel-avatar" />
              <div>
                <strong>{activeAgent.name}</strong>
                <p>你们的小宠物，想聊就聊</p>
              </div>
            </div>
            <div className="agent-panel-actions">
              <button type="button" className="agent-icon-btn" onClick={() => setSettingsOpen((v) => !v)}>
                人设
              </button>
              <button type="button" className="agent-icon-btn" onClick={onClearChat}>
                清空
              </button>
              <button type="button" className="agent-icon-btn" onClick={() => setOpen(false)} aria-label="关闭">
                关闭
              </button>
            </div>
          </header>

          {settingsOpen ? (
            <div className="agent-settings">
              <label>
                <span>名字</span>
                <input
                  value={draftAgent.name}
                  onChange={(e) => setDraftAgent((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label>
                <span>开场白</span>
                <input
                  value={draftAgent.greeting}
                  onChange={(e) => setDraftAgent((prev) => ({ ...prev, greeting: e.target.value }))}
                />
              </label>
              <label>
                <span>人设</span>
                <textarea
                  rows={5}
                  value={draftAgent.persona}
                  onChange={(e) => setDraftAgent((prev) => ({ ...prev, persona: e.target.value }))}
                />
              </label>
              <button type="button" className="agent-send" disabled={savingPersona} onClick={onSavePersona}>
                {savingPersona ? '保存中…' : cloudEnabled ? '保存人设' : '应用人设（仅本机）'}
              </button>
            </div>
          ) : null}

          <div className="agent-messages" ref={listRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`agent-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {busy ? <div className="agent-bubble assistant is-typing">{activeAgent.name}在想…</div> : null}
          </div>

          {error ? <p className="agent-error">{error}</p> : null}

          <form
            className="agent-composer"
            onSubmit={(e) => {
              e.preventDefault()
              void onSend()
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`跟${activeAgent.name}说点什么…`}
              disabled={busy}
            />
            <button type="submit" className="agent-send" disabled={busy || !input.trim()}>
              发送
            </button>
          </form>
        </section>
      ) : null}
    </>
  )
}
