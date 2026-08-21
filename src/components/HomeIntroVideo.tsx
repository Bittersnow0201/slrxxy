import { useEffect, useRef, useState } from 'react'

type HomeIntroVideoProps = {
  src: string
  poster?: string
}

export function HomeIntroVideo({ src, poster }: HomeIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [needsTap, setNeedsTap] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.setAttribute('muted', '')

    async function tryPlay() {
      if (!video || cancelled) return
      try {
        await video.play()
        if (!cancelled) setNeedsTap(false)
      } catch {
        if (!cancelled) setNeedsTap(true)
      }
    }

    const onCanPlay = () => {
      void tryPlay()
    }
    const onError = () => {
      if (!cancelled) setFailed(true)
    }
    const onEnded = () => {
      try {
        video.pause()
        if (video.duration && Number.isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.05)
        }
      } catch {
        // ignore
      }
    }

    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('loadeddata', onCanPlay)
    video.addEventListener('error', onError)
    video.addEventListener('ended', onEnded)
    void tryPlay()

    return () => {
      cancelled = true
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onCanPlay)
      video.removeEventListener('error', onError)
      video.removeEventListener('ended', onEnded)
    }
  }, [src])

  async function onTapPlay() {
    const video = videoRef.current
    if (!video) return
    try {
      video.muted = true
      await video.play()
      setNeedsTap(false)
    } catch {
      setNeedsTap(true)
    }
  }

  return (
    <div className={`hero-video-slot${failed ? ' is-failed' : ''}`}>
      <video
        ref={videoRef}
        className="hero-video"
        src={src}
        poster={poster}
        muted
        playsInline
        autoPlay
        preload="auto"
        controls={false}
      />
      {needsTap && !failed ? (
        <button type="button" className="hero-video-play" onClick={onTapPlay}>
          轻触播放
        </button>
      ) : null}
      {failed ? <div className="hero-video-fallback">视频暂无法播放</div> : null}
    </div>
  )
}
