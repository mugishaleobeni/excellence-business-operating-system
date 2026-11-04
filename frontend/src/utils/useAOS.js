import { useEffect } from 'react'

/**
 * Lightweight IntersectionObserver-based AOS (Animate On Scroll) hook.
 * Automatically reveals elements with [data-aos] attributes as they enter the viewport.
 */
export function useAOS(deps = []) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = document.querySelectorAll('[data-aos]')

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('aos-animate'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-aos-delay')
            if (delay) {
              setTimeout(() => {
                entry.target.classList.add('aos-animate')
              }, Number(delay))
            } else {
              entry.target.classList.add('aos-animate')
            }
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, deps)
}

