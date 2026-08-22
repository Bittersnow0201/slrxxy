import { useState } from 'react'
import './LazyImage.css'

type Props = {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
}

export function LazyImage({ src, alt = '', className = '', onClick }: Props) {
  const [loaded, setLoaded] = useState(false)

  const img = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`lazy-image${loaded ? ' is-loaded' : ''}`}
      onLoad={() => setLoaded(true)}
    />
  )

  if (onClick) {
    return (
      <button type="button" className={`lazy-image-wrap${className ? ` ${className}` : ''}`} onClick={onClick}>
        <span className="lazy-image-shimmer" aria-hidden="true" />
        {img}
      </button>
    )
  }

  return (
    <div className={`lazy-image-wrap${className ? ` ${className}` : ''}`}>
      <span className="lazy-image-shimmer" aria-hidden="true" />
      {img}
    </div>
  )
}
