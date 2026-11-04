import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { ArrowUpRight } from 'lucide-react'

/**
 * PYLARIX Liquid Sapphire Themes for CardNav (Default White/Light Mode)
 */
const THEMES = {
  light: {
    '--cn-panel': 'rgba(255, 255, 255, 0.94)',
    '--cn-solid': '#ffffff',
    '--cn-edge': 'rgba(16, 69, 202, 0.16)',
    '--cn-highlight': 'rgba(255, 255, 255, 0.98)',
    '--cn-shadow':
      '0 24px 48px -20px rgba(7, 21, 68, 0.22), 0 6px 16px -8px rgba(16, 69, 202, 0.12)',
    '--cn-text': '#071544',
    '--cn-muted': 'rgba(7, 21, 68, 0.65)',
    '--cn-hover': 'rgba(33, 141, 255, 0.10)',
    '--cn-ring': 'rgba(33, 141, 255, 0.55)',
    '--cn-tile': 'linear-gradient(180deg, #ffffff 0%, #f0f6ff 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(33, 141, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 1), 0 6px 16px -6px rgba(7, 21, 68, 0.12)',
    '--cn-cta': 'linear-gradient(135deg, #218DFF 0%, #1045CA 60%, #0A2786 100%)',
    '--cn-cta-ink': '#ffffff',
    '--cn-cta-shadow':
      'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 8px 20px -6px rgba(16, 69, 202, 0.4)',
    '--cn-cta-hover': 'brightness(1.08)'
  },
  dark: {
    '--cn-panel': 'rgba(7, 21, 68, 0.88)',
    '--cn-solid': '#071544',
    '--cn-edge': 'rgba(158, 220, 255, 0.22)',
    '--cn-highlight': 'rgba(158, 220, 255, 0.16)',
    '--cn-shadow':
      '0 24px 48px -18px rgba(3, 9, 31, 0.88), 0 6px 18px -6px rgba(16, 69, 202, 0.45)',
    '--cn-text': '#eaf2ff',
    '--cn-muted': 'rgba(158, 220, 255, 0.72)',
    '--cn-hover': 'rgba(33, 141, 255, 0.16)',
    '--cn-ring': 'rgba(158, 220, 255, 0.65)',
    '--cn-tile':
      'linear-gradient(165deg, rgba(10, 39, 134, 0.72) 0%, rgba(7, 21, 68, 0.92) 60%, rgba(3, 9, 31, 0.96) 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(158, 220, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 8px 20px -6px rgba(3, 9, 31, 0.7)',
    '--cn-cta': 'linear-gradient(135deg, #218DFF 0%, #1045CA 55%, #0A2786 100%)',
    '--cn-cta-ink': '#ffffff',
    '--cn-cta-shadow':
      'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 10px 24px -6px rgba(33, 141, 255, 0.55)',
    '--cn-cta-hover': 'brightness(1.1)'
  }
}

const NARROW = 640
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const easeOut = (t) => 1 - (1 - t) ** 3

export default function CardNav({
  logo,
  logoAlt = 'EXCELLENCE BOS',
  logoHref = '/',
  items = [],
  cta,
  menuTranslation,
  theme = 'light',
  surface = 'glass',
  openOn = 'click',
  cardEffect = 'rise',
  stagger = 0.12,
  bounce = 0.2,
  speed = 1,
  cardHeight = 156,
  maxWidth = 960,
  accentColor,
  menuLabel = true,
  intro = true,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  onNavigate,
  ariaLabel = 'Mobile Navigation',
  className = '',
  style
}) {
  const contentId = useId()
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const contentRef = useRef(null)
  const menuRef = useRef(null)
  const cardRefs = useRef([])
  const engineRef = useRef(null)
  const leaveRef = useRef(0)
  const barRef = useRef(null)
  const introRef = useRef(intro)

  const [openState, setOpenState] = useState(defaultOpen)
  const [narrow, setNarrow] = useState(true)
  const [shown, setShown] = useState(defaultOpen)

  const controlled = openProp !== undefined
  const hasCta = Boolean(cta)
  const open = controlled ? openProp : openState

  const settings = {
    open,
    cardEffect,
    stagger: clamp(stagger, 0, 0.3),
    bounce: clamp(bounce, 0, 1),
    speed: clamp(speed, 0.2, 3)
  }
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const palette = THEMES[theme] ?? THEMES.light
  const vars = {
    ...palette,
    '--cn-max': `${maxWidth}px`,
    '--cn-bar': '64px',
    '--cn-inset': '8px',
    '--cn-gap': '10px',
    '--cn-radius': '20px',
    '--cn-logo': '40px',
    '--cn-card': `${cardHeight}px`
  }

  if (surface === 'glass') {
    vars['--cn-blur'] = 'blur(22px) saturate(1.65)'
  } else {
    vars['--cn-panel'] = palette['--cn-solid']
    vars['--cn-blur'] = 'none'
  }
  if (accentColor) {
    vars['--cn-cta'] = accentColor
  }

  const setOpen = (next) => {
    if (next === open) return
    if (!controlled) setOpenState(next)
    onOpenChange?.(next)
  }
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  // Spring physics engine for panel height & staggered card rise
  useEffect(() => {
    const panel = panelRef.current
    const content = contentRef.current
    if (!panel || !content) return undefined

    const reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const state = {
      p: settingsRef.current.open ? 1 : 0,
      v: 0,
      height: content.offsetHeight,
      bar: 64
    }
    let raf = 0
    let last = 0

    const render = () => {
      const s = settingsRef.current
      state.bar =
        parseFloat(getComputedStyle(panel).getPropertyValue('--cn-bar')) || 64
      panel.style.height = `${state.bar + Math.max(0, state.p) * state.height}px`
      const cards = cardRefs.current.filter((c) => c !== null)
      const count = cards.length
      const lag = count > 1 ? Math.min(s.stagger, 0.7 / (count - 1)) : 0
      const span = 1 - lag * (count - 1)

      cards.forEach((card, index) => {
        const local = clamp((state.p - index * lag) / Math.max(span, 0.05), 0, 1)
        const e = easeOut(local)
        if (s.cardEffect === 'unfold') {
          card.style.transform = `translateY(${(1 - e) * -10}px) rotateX(${(1 - e) * -72}deg)`
          card.style.opacity = `${clamp(local * 1.8, 0, 1)}`
          card.style.filter = ''
        } else if (s.cardEffect === 'fade') {
          card.style.transform = `translateY(${(1 - e) * 6}px)`
          card.style.opacity = `${e}`
          card.style.filter = e < 0.999 ? `blur(${(1 - e) * 6}px)` : ''
        } else {
          card.style.transform = `translateY(${(1 - e) * 26}px) scale(${0.97 + 0.03 * e})`
          card.style.opacity = `${e}`
          card.style.filter = ''
        }
      })
    }

    const tick = (now) => {
      raf = 0
      const s = settingsRef.current
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const target = s.open ? 1 : 0
      if (reduce) {
        state.p = target
        state.v = 0
      } else {
        const k = 160 * s.speed * s.speed
        const zeta = s.open ? 1 - 0.68 * s.bounce : 1
        const steps = Math.ceil(dt / (1 / 240))
        const h = dt / steps
        for (let i = 0; i < steps; i++) {
          state.v +=
            (-k * (state.p - target) - 2 * zeta * Math.sqrt(k) * state.v) * h
          state.p += state.v * h
        }
      }
      const done =
        Math.abs(state.p - target) < 0.0005 && Math.abs(state.v) < 0.002
      if (done) {
        state.p = target
        state.v = 0
      }
      render()
      if (done && target === 0) setShown(false)
      if (!done) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }

    engineRef.current = {
      wake,
      refresh: () => {
        state.height = content.offsetHeight
        render()
      }
    }

    render()
    const observer = new ResizeObserver(() => {
      state.height = content.offsetHeight
      render()
    })
    observer.observe(content)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      engineRef.current = null
    }
  }, [items.length, hasCta, narrow])

  useLayoutEffect(() => {
    if (open) setShown(true)
    engineRef.current?.refresh()
    engineRef.current?.wake()
  }, [open])

  useEffect(() => {
    engineRef.current?.refresh()
  })

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const measure = () => setNarrow(root.offsetWidth < NARROW)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setOpenRef.current(false)
    }
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpenRef.current(false)
      menuRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(leaveRef.current), [])

  // Intro clip-path & child entrance animation
  useLayoutEffect(() => {
    const panel = panelRef.current
    const bar = barRef.current
    if (!panel || !bar || !introRef.current) return
    introRef.current = false
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const width = panel.offsetWidth
    const height = panel.offsetHeight
    const radius = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 20
    panel.animate?.(
      [
        {
          clipPath: `inset(0px ${Math.max(0, (width - height) / 2)}px round ${height / 2}px)`,
          opacity: 0
        },
        { clipPath: `inset(0px 0px round ${radius}px)`, opacity: 1 }
      ],
      { duration: 760, easing: EASE_OUT, fill: 'backwards' }
    )
    Array.from(bar.children).forEach((child, index) => {
      child.animate?.(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 520, delay: 180 + index * 65, easing: EASE_OUT, fill: 'backwards' }
      )
    })
  }, [])

  const handleLinkActivate = (href, link, item, e) => {
    e.preventDefault()
    setOpen(false)
    if (onNavigate && href) {
      onNavigate(href, link, item)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`cn-root ${open ? 'cn-is-open' : ''} ${shown || open ? 'cn-is-shown' : ''} ${
        narrow ? 'cn-is-narrow' : ''
      } ${className}`}
      style={{ ...vars, ...style }}
    >
      <nav ref={panelRef} className="cn-panel" aria-label={ariaLabel}>
        {/* 3-Column Bar: Left = Get Started CTA | Center = Logo | Right = Menu Button */}
        <div ref={barRef} className="cn-bar">
          {/* Left: Get Started Button */}
          <div className="cn-left-slot">
            {cta && (
              <a
                href={cta.href || '/register'}
                onClick={(e) => {
                  cta.onClick?.(e)
                  handleLinkActivate(cta.href || '/register', cta, null, e)
                }}
                className="cn-cta-bar font-orbitron"
              >
                {cta.label}
              </a>
            )}
          </div>

          {/* Center: Logo */}
          <a
            href={logoHref}
            onClick={(e) => handleLinkActivate(logoHref, null, null, e)}
            className="cn-logo"
            aria-label={logoAlt}
          >
            {typeof logo === 'string' ? (
              <img src={logo} alt={logoAlt} draggable={false} />
            ) : (
              logo
            )}
          </a>

          {/* Right: Menu / Close Button */}
          <div className="cn-right-slot">
            <button
              ref={menuRef}
              type="button"
              className="cn-menu-btn"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpen(!open)}
            >
              <span className="cn-burger" aria-hidden="true">
                <span className="cn-line-top" />
                <span className="cn-line-bottom" />
              </span>
              {menuLabel && (
                <span className="cn-menu-label">
                  <span className="cn-word-open" aria-hidden={open}>
                    Menu
                  </span>
                  <span className="cn-word-close" aria-hidden={!open}>
                    Close
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Staggered Cards + Translation Inside Menu */}
        <div
          ref={contentRef}
          id={contentId}
          className="cn-content"
          aria-hidden={!open}
        >
          <div className="cn-cards">
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                className="cn-card"
                style={
                  item.bgColor
                    ? { background: item.bgColor, color: item.textColor }
                    : undefined
                }
              >
                <div className="cn-card-head">
                  <span className="cn-card-label font-orbitron">{item.label}</span>
                  {item.description && (
                    <p className="cn-card-desc">{item.description}</p>
                  )}
                </div>
                <ul className="cn-card-links">
                  {(item.links ?? []).map((link, linkIndex) => (
                    <li key={`${link.label}-${linkIndex}`}>
                      <a
                        href={link.href || '#'}
                        tabIndex={open ? undefined : -1}
                        onClick={(e) => handleLinkActivate(link.href, link, item, e)}
                        className="cn-link"
                      >
                        <span className="cn-arrow" aria-hidden="true">
                          <ArrowUpRight className="cn-arrow-out" size={14} strokeWidth={2.2} />
                          <ArrowUpRight className="cn-arrow-in" size={14} strokeWidth={2.2} />
                        </span>
                        <span>{link.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Translation Language Card Displayed Inside Menu */}
          {menuTranslation && (
            <div
              ref={(el) => {
                cardRefs.current[items.length] = el
              }}
              className="cn-card"
            >
              {menuTranslation({ closeMenu: () => setOpen(false) })}
            </div>
          )}
        </div>

        <span className="cn-rim" />
      </nav>
    </div>
  )
}
