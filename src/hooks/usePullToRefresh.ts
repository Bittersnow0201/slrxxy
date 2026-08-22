import { useEffect, useRef, useState } from 'react'

type Options = {
  onRefresh: () => Promise<void>
  disabled?: boolean
}

export function usePullToRefresh({ onRefresh, disabled }: Options) {
  const [pulling, setPulling] = useState(false)
  const [distance, setDistance] = useState(0)
  const startY = useRef(0)
  const active = useRef(false)

  useEffect(() => {
    if (disabled) return

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 4) return
      startY.current = e.touches[0].clientY
      active.current = true
    }

    const onMove = (e: TouchEvent) => {
      if (!active.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY <= 4) {
        setPulling(true)
        setDistance(Math.min(dy * 0.45, 72))
        if (dy > 12) e.preventDefault()
      }
    }

    const onEnd = async () => {
      if (!active.current) return
      active.current = false
      if (distance > 52) {
        await onRefresh()
      }
      setPulling(false)
      setDistance(0)
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [disabled, distance, onRefresh])

  return { pulling, distance }
}
