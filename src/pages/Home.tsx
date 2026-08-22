import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { useContent } from '../content/ContentContext'
import { HomeIntroVideo } from '../components/HomeIntroVideo'
import { pickDailySpotlight } from '../lib/dailySpotlight'
import { daysTogether, formatDate } from '../lib/days'
import { dismissMilestone, findMilestone, isMilestoneDismissed } from '../lib/milestones'
import './Home.css'

function photoSrc(src: string) {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('cloud://')) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

export function Home() {
  const { content, ready } = useContent()
  const { heroBg } = useAuth()
  const days = daysTogether(content.togetherSince)
  const reduce = useReducedMotion()

  const milestone = useMemo(() => findMilestone(days), [days])
  const [dismissTick, setDismissTick] = useState(0)
  const showMilestone = milestone && !isMilestoneDismissed(milestone.days)
  void dismissTick

  const spotlight = useMemo(() => (ready ? pickDailySpotlight(content) : null), [content, ready])

  if (!ready) {
    return <div className="page auth-loading" aria-busy="true" />
  }

  function onDismissMilestone() {
    if (!milestone) return
    dismissMilestone(milestone.days)
    setDismissTick((n) => n + 1)
  }

  return (
    <section className="hero">
      <div className="hero-plane" aria-hidden="true">
        <img className="hero-photo" src={`${import.meta.env.BASE_URL}${heroBg}`} alt="" />
        <div className="hero-scrim" />
      </div>

      <div className="hero-layout">
        <div className="hero-copy">
          <motion.h1
            className="brand-hero"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {content.site.brand.endsWith('的小宇宙') ? (
              <>
                <span className="brand-line">{content.site.brand.replace(/的小宇宙$/, '')}</span>
                <span className="brand-sub">的小宇宙</span>
              </>
            ) : (
              <span className="brand-line">{content.site.brand}</span>
            )}
          </motion.h1>

          <motion.p
            className="tagline"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {content.site.tagline}
          </motion.p>

          <motion.div
            className={`days${showMilestone ? ' has-milestone' : ''}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="days-num">{days}</span>
            <span className="days-meta">
              天
              <small>
                自 <time dateTime={content.togetherSince}>{formatDate(content.togetherSince)}</time>
              </small>
            </span>
            {showMilestone ? (
              <div className="milestone-toast" role="status">
                <p>{milestone.message}</p>
                <button type="button" onClick={onDismissMilestone} aria-label="关闭">
                  ×
                </button>
              </div>
            ) : null}
          </motion.div>

          {spotlight ? (
            <motion.div
              className="daily-spotlight"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="daily-spotlight-label">今日一点</p>
              <div className="daily-spotlight-track">
                {spotlight.kind === 'timeline' ? (
                  <Link to="/timeline" className="daily-spotlight-card">
                    <time dateTime={spotlight.item.date}>{formatDate(spotlight.item.date)}</time>
                    <strong>{spotlight.item.title}</strong>
                    {spotlight.item.text ? <span>{spotlight.item.text}</span> : null}
                  </Link>
                ) : (
                  <Link to="/photos" className="daily-spotlight-card photo">
                    {spotlight.item.src ? (
                      <img src={photoSrc(spotlight.item.src)} alt="" loading="lazy" />
                    ) : null}
                    <div>
                      {spotlight.item.caption ? <strong>{spotlight.item.caption}</strong> : null}
                      {spotlight.item.date ? (
                        <time dateTime={spotlight.item.date}>{formatDate(spotlight.item.date)}</time>
                      ) : null}
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          ) : null}

          <motion.div
            className="cta"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link className="btn primary" to="/timeline">
              翻开故事
            </Link>
          </motion.div>
        </div>

        <div className="hero-video-wrap">
          <HomeIntroVideo
            src={`${import.meta.env.BASE_URL}media/intro.mp4`}
            poster={`${import.meta.env.BASE_URL}media/intro-poster.jpg`}
          />
        </div>
      </div>
    </section>
  )
}
