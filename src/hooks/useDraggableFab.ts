import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'slrxxy-agent-fab-pos'

type Pos = { x: number; y: number }

function readPos(): Pos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Pos) : null
  } catch {
    return null
  }
}

function writePos(pos: Pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // ignore
  }
}

export function useDraggableFab(size = 66) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    const saved = readPos()
    if (saved) setPos(saved)
  }, [])

  const clamp = useCallback(
    (x: number, y: number): Pos => {
      const pad = 12
      const maxX = window.innerWidth - size - pad
      const maxY = window.innerHeight - size - pad
      return {
        x: Math.min(Math.max(pad, x), maxX),
        y: Math.min(Math.max(pad, y), maxY),
      }
    },
    [size],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return
      moved.current = false
      const rect = el.getBoundingClientRect()
      const startX = pos?.x ?? rect.left
      const startY = pos?.y ?? rect.top
      drag.current = { x: e.clientX, y: e.clientY, px: startX, py: startY }
      el.setPointerCapture(e.pointerId)
    },
    [pos],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
      const next = clamp(drag.current.px + dx, drag.current.py + dy)
      setPos(next)
    },
    [clamp],
  )

  const onPointerUp = useCallback(() => {
    if (!drag.current) return
    drag.current = null
    if (!moved.current) return
    const el = ref.current
    const rect = el?.getBoundingClientRect()
    const final = clamp(pos?.x ?? rect?.left ?? 16, pos?.y ?? rect?.top ?? 16)
    setPos(final)
    writePos(final)
  }, [clamp, pos])

  const style: React.CSSProperties | undefined = pos
    ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
    : undefined

  return {
    ref,
    style,
    moved,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }
}
