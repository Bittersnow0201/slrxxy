import { useEffect, useRef, useState, type RefObject } from 'react'

type Options = {
  onRefresh: () => Promise<void>
  disabled?: boolean
  indicatorRef: RefObject<HTMLDivElement | null>
}

const THRESHOLD = 52
const MAX_PULL = 72

export function usePullToRefresh({ onRefresh, disabled, indicatorRef }: Options) {
  const [refreshing, setRefreshing] = useState(false)
  const onRefreshRef = useRef(onRefresh)
  const refreshingRef = useRef(false)
  const distanceRef = useRef(0)

  onRefreshRef.current = onRefresh

  function paintIndicator(distance: number, label: string) {
    const el = indicatorRef.current
    if (!el) return
    el.style.transform = `translate3d(0, calc(-100% + ${distance}px), 0)`
    el.style.opacity = distance > 0 ? String(Math.min(1, distance / 48)) : '0'
    const text = el.querySelector<HTMLElement>('.pull-indicator-text')
    if (text) text.textContent = label
    el.classList.toggle('is-active', distance > 0)
  }

  function resetIndicator() {
    paintIndicator(0, '下拉刷新')
    indicatorRef.current?.classList.remove('is-refreshing')
  }

  useEffect(() => {
    if (disabled) return

    let active = false
    let startY = 0

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || window.scrollY > 4) return
      startY = e.touches[0].clientY
      active = true
      distanceRef.current = 0
    }

    const onMove = (e: TouchEvent) => {
      if (!active || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY
      if (dy <= 0) {
        distanceRef.current = 0
        paintIndicator(0, '下拉刷新')
        return
      }
      if (window.scrollY > 4) {
        active = false
        return
      }

      const distance = Math.min(dy * 0.38, MAX_PULL)
      distanceRef.current = distance
      paintIndicator(distance, distance > THRESHOLD ? '松开刷新' : '下拉刷新')

      if (dy > 10) e.preventDefault()
    }

    const onEnd = () => {
      if (!active) return
      active = false

      if (distanceRef.current > THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true
        setRefreshing(true)
        indicatorRef.current?.classList.add('is-refreshing')
        paintIndicator(MAX_PULL, '同步中…')

        void onRefreshRef
          .current()
          .finally(() => {
            refreshingRef.current = false
            setRefreshing(false)
            resetIndicator()
          })
        return
      }

      distanceRef.current = 0
      resetIndicator()
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
  }, [disabled, indicatorRef])

  return { refreshing }
}
