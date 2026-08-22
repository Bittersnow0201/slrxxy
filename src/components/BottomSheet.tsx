import { useEffect, type ReactNode } from 'react'
import './BottomSheet.css'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="bottom-sheet-root" role="presentation">
      <button type="button" className="bottom-sheet-backdrop" aria-label="关闭" onClick={onClose} />
      <div className="bottom-sheet-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="bottom-sheet-handle" aria-hidden="true" />
        {title ? <h2 className="bottom-sheet-title">{title}</h2> : null}
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>
  )
}
