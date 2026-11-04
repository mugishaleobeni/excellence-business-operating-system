import React, {
  useState,
  useEffect,
  useRef,
  forwardRef
} from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  })

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return reduced
}

function buildStyleFromVariant(variant, transition, isSvgPath) {
  if (!variant || typeof variant !== 'object') return {}
  const st = {}
  const transforms = []

  if (variant.opacity !== undefined) st.opacity = variant.opacity
  if (variant.filter !== undefined) st.filter = variant.filter
  if (variant.boxShadow !== undefined) st.boxShadow = variant.boxShadow
  if (variant.borderColor !== undefined) st.borderColor = variant.borderColor
  if (variant.backgroundColor !== undefined) st.backgroundColor = variant.backgroundColor

  if (variant.x !== undefined) {
    const val = typeof variant.x === 'number' ? `${variant.x}px` : variant.x
    transforms.push(`translateX(${val})`)
  }
  if (variant.y !== undefined) {
    const val = typeof variant.y === 'number' ? `${variant.y}px` : variant.y
    transforms.push(`translateY(${val})`)
  }
  if (variant.scale !== undefined) {
    transforms.push(`scale(${variant.scale})`)
  }
  if (variant.rotate !== undefined) {
    const val = typeof variant.rotate === 'number' ? `${variant.rotate}deg` : variant.rotate
    transforms.push(`rotate(${val})`)
  }

  if (transforms.length > 0) {
    st.transform = transforms.join(' ')
  }

  if (isSvgPath && variant.pathLength !== undefined) {
    st.strokeDasharray = '1'
    st.strokeDashoffset = `${Math.max(0, 1 - Number(variant.pathLength))}`
  }

  const dur = transition?.duration ?? 0.6
  const delay = transition?.delay ?? 0
  const ease =
    transition?.ease === 'easeOut'
      ? 'cubic-bezier(0.22, 1, 0.36, 1)'
      : 'cubic-bezier(0.22, 1, 0.36, 1)'

  st.transition = `transform ${dur}s ${ease} ${delay}s, opacity ${dur}s ${ease} ${delay}s, filter ${dur}s ${ease} ${delay}s, stroke-dashoffset ${dur}s ${ease} ${delay}s, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease`

  return st
}

function createMotionComponent(Tag) {
  const isSvgPath = Tag === 'path' || Tag === 'circle'

  const MotionComp = forwardRef(function MotionElement(
    {
      initial,
      animate,
      exit,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      transition,
      style,
      onMouseEnter,
      onMouseLeave,
      onPointerDown,
      onPointerUp,
      children,
      ...rest
    },
    externalRef
  ) {
    const innerRef = useRef(null)
    const reduced = useReducedMotion()
    const [inView, setInView] = useState(!whileInView)
    const [hovered, setHovered] = useState(false)
    const [tapped, setTapped] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      const raf = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
      if (!whileInView) return undefined
      const node = innerRef.current
      if (!node || typeof IntersectionObserver === 'undefined') {
        setInView(true)
        return undefined
      }
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setInView(true)
              if (viewport?.once !== false) {
                obs.disconnect()
              }
            } else if (viewport?.once === false) {
              setInView(false)
            }
          })
        },
        { threshold: viewport?.amount ?? 0.15 }
      )
      obs.observe(node)
      return () => obs.disconnect()
    }, [whileInView, viewport?.once, viewport?.amount])

    const setRefs = (el) => {
      innerRef.current = el
      if (typeof externalRef === 'function') externalRef(el)
      else if (externalRef) externalRef.current = el
    }

    let activeVariant = {}
    if (reduced) {
      activeVariant = { ...(whileInView || animate || {}) }
    } else if (!mounted || (whileInView && !inView)) {
      activeVariant = { ...(initial || {}) }
    } else {
      activeVariant = {
        ...(initial || {}),
        ...(animate || {}),
        ...(whileInView && inView ? whileInView : {})
      }
      if (hovered && whileHover) {
        activeVariant = { ...activeVariant, ...whileHover }
      }
      if (tapped && whileTap) {
        activeVariant = { ...activeVariant, ...whileTap }
      }
    }

    const computedStyle = buildStyleFromVariant(activeVariant, transition, isSvgPath)
    const extraProps = isSvgPath && (initial?.pathLength !== undefined || whileInView?.pathLength !== undefined || animate?.pathLength !== undefined)
      ? { pathLength: 1 }
      : {}

    return (
      <Tag
        ref={setRefs}
        style={{ ...computedStyle, ...style }}
        onMouseEnter={(e) => {
          if (whileHover) setHovered(true)
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          if (whileHover) setHovered(false)
          if (whileTap) setTapped(false)
          onMouseLeave?.(e)
        }}
        onPointerDown={(e) => {
          if (whileTap) setTapped(true)
          onPointerDown?.(e)
        }}
        onPointerUp={(e) => {
          if (whileTap) setTapped(false)
          onPointerUp?.(e)
        }}
        {...extraProps}
        {...rest}
      >
        {children}
      </Tag>
    )
  })

  return MotionComp
}

export const motion = {
  div: createMotionComponent('div'),
  section: createMotionComponent('section'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  p: createMotionComponent('p'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
  img: createMotionComponent('img'),
  svg: createMotionComponent('svg'),
  path: createMotionComponent('path'),
  circle: createMotionComponent('circle')
}

export function AnimatePresence({ children }) {
  return <>{children}</>
}

