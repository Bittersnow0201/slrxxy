import { motion, useReducedMotion } from 'motion/react'
import { useContent } from '../content/ContentContext'
import { formatDate } from '../lib/days'
import './Photos.css'

function photoSrc(src: string) {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('cloud://')) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

export function Photos() {
  const { content, ready } = useContent()
  const reduce = useReducedMotion()

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  return (
    <section className="page photos-page">
      <header className="page-head">
        <h1>相册</h1>
        <p>把想记住的光，留在这里。</p>
      </header>

      <div className="photo-grid">
        {content.photos.map((photo, index) => (
          <motion.figure
            key={`${photo.caption}-${photo.date}-${index}`}
            className={`photo-item tone-${(index % 4) + 1}`}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {photo.src ? (
              <img src={photoSrc(photo.src)} alt={photo.caption} loading="lazy" />
            ) : (
              <div className="photo-placeholder" role="img" aria-label={photo.caption}>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
            )}
            <figcaption>
              <span>{photo.caption}</span>
              <time dateTime={photo.date}>{formatDate(photo.date)}</time>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
