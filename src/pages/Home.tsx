import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { useContent } from '../content/ContentContext'
import { HomeIntroVideo } from '../components/HomeIntroVideo'
import { daysTogether, formatDate } from '../lib/days'
import './Home.css'

export function Home() {
  const { content, ready } = useContent()
  const { heroBg } = useAuth()
  const days = daysTogether(content.togetherSince)
  const reduce = useReducedMotion()

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  return (
    <section className="hero">
      <div className="hero-plane" aria-hidden="true">
        <img
          className="hero-photo"
          src={`${import.meta.env.BASE_URL}${heroBg}`}
          alt=""
        />
        <div className="hero-scrim" />
        <div className="hero-grain" />
        <div className="plane plane-a" />
        <div className="plane plane-b" />
        <span className="dial-ring ring-outer" />
        <span className="dial-ring ring-inner" />
      </div>

      <div className="hero-layout">
        <div className="hero-copy">
          <motion.h1
            className="brand-hero"
            initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="brand-line">slr 和 xxy</span>
            <span className="brand-sub">的小宇宙</span>
          </motion.h1>

          <motion.p
            className="tagline"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {content.site.tagline}
          </motion.p>

          <motion.div
            className="days"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="days-dial" aria-hidden="true" />
            <span className="days-num">{days}</span>
            <span className="days-meta">
              天
              <small>
                自 <time dateTime={content.togetherSince}>{formatDate(content.togetherSince)}</time>
              </small>
            </span>
          </motion.div>

          <motion.div
            className="cta"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link className="btn primary" to="/timeline">
              翻开故事
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <HomeIntroVideo
            src={`${import.meta.env.BASE_URL}media/intro.mp4`}
            poster={`${import.meta.env.BASE_URL}media/intro-poster.jpg`}
          />
        </motion.div>
      </div>
    </section>
  )
}
