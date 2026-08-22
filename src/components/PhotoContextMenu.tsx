import { useEffect, useRef, useState, type ReactNode } from 'react'
import './PhotoContextMenu.css'

type Action = {
  label: string
  onClick: () => void
  danger?: boolean
}

type Props = {
  children: ReactNode
  actions: Action[]
  disabled?: boolean
}

export function PhotoContextMenu({ children, actions, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, { passive: true })
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close)
    }
  }, [open])

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  return (
    <div
      className="photo-context-host"
      onPointerDown={(e) => {
        if (disabled) return
        moved.current = false
        clearTimer()
        timer.current = setTimeout(() => {
          if (moved.current) return
          setPos({ x: e.clientX, y: e.clientY })
          setOpen(true)
          if (navigator.vibrate) navigator.vibrate(8)
        }, 480)
      }}
      onPointerMove={() => {
        moved.current = true
        clearTimer()
      }}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onContextMenu={(e) => {
        if (disabled) return
        e.preventDefault()
        setPos({ x: e.clientX, y: e.clientY })
        setOpen(true)
      }}
    >
      {children}
      {open ? (
        <div
          className="photo-context-menu"
          style={{ left: pos.x, top: pos.y }}
          onClick={(e) => e.stopPropagation()}
          role="menu"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={action.danger ? 'danger' : ''}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
