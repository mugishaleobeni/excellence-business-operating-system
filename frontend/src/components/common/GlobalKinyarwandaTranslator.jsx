import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useExbos } from '../../context/ExbosContext'
import { translateToKinyarwanda } from '../../utils/kinyarwandaDict'

const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label']

/**
 * Global, reversible Kinyarwanda page translator.
 * - When language === 'rw', translates UI text nodes & attributes across all public pages and dashboard views.
 * - Tracks { orig, trans } per DOM node so when React updates a reused text node in place (e.g. switching
 *   dashboard modules or subpages), the new text is immediately detected and translated.
 * - When language === 'en', restores original English strings cleanly.
 */
export default function GlobalKinyarwandaTranslator() {
  const { language, activeBranchId } = useExbos()
  const location = useLocation()
  const origTextMapRef = useRef(new WeakMap())
  const origAttrMapRef = useRef(new WeakMap())
  const isApplyingRef = useRef(false)

  useEffect(() => {
    document.documentElement.lang = language === 'rw' ? 'rw' : 'en'

    const origTextMap = origTextMapRef.current
    const origAttrMap = origAttrMapRef.current

    const processTextNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return
      const parentEl = node.parentElement
      const parentTag = parentEl?.tagName
      if (
        parentTag === 'SCRIPT' ||
        parentTag === 'STYLE' ||
        parentTag === 'TEXTAREA' ||
        parentTag === 'CODE' ||
        parentTag === 'PRE' ||
        parentEl?.closest('[data-no-translate="true"]')
      ) {
        return
      }

      const currentVal = node.nodeValue || ''
      if (!currentVal.trim()) return

      const saved = origTextMap.get(node)

      if (language === 'rw') {
        // If React updated this text node to a new value different from our last translation, use currentVal
        const baseText = saved && currentVal === saved.trans ? saved.orig : currentVal
        const translated = translateToKinyarwanda(baseText)
        if (translated !== baseText) {
          origTextMap.set(node, { orig: baseText, trans: translated })
          if (currentVal !== translated) {
            node.nodeValue = translated
          }
        }
      } else if (saved) {
        if (currentVal === saved.trans && currentVal !== saved.orig) {
          node.nodeValue = saved.orig
        }
        origTextMap.delete(node)
      }
    }

    const processElementAttrs = (el) => {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return
      ATTRS_TO_TRANSLATE.forEach((attr) => {
        if (!el.hasAttribute(attr)) return
        const cur = el.getAttribute(attr) || ''
        if (!cur.trim()) return
        let attrStore = origAttrMap.get(el)
        const saved = attrStore ? attrStore[attr] : undefined

        if (language === 'rw') {
          const base = saved && cur === saved.trans ? saved.orig : cur
          const translated = translateToKinyarwanda(base)
          if (translated !== base) {
            if (!attrStore) {
              attrStore = {}
              origAttrMap.set(el, attrStore)
            }
            attrStore[attr] = { orig: base, trans: translated }
            if (cur !== translated) el.setAttribute(attr, translated)
          }
        } else if (saved) {
          if (cur === saved.trans && cur !== saved.orig) {
            el.setAttribute(attr, saved.orig)
          }
          delete attrStore[attr]
        }
      })
    }

    const walkSubtree = (root) => {
      if (!root || isApplyingRef.current) return
      isApplyingRef.current = true
      try {
        if (root.nodeType === Node.TEXT_NODE) {
          processTextNode(root)
          return
        }
        if (root.nodeType === Node.ELEMENT_NODE) {
          processElementAttrs(root)
          const elWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
          let el = elWalker.nextNode()
          while (el) {
            processElementAttrs(el)
            el = elWalker.nextNode()
          }
        }
        const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        let txt = textWalker.nextNode()
        while (txt) {
          processTextNode(txt)
          txt = textWalker.nextNode()
        }
      } finally {
        isApplyingRef.current = false
      }
    }

    walkSubtree(document.body)
    const delayedTimer = setTimeout(() => walkSubtree(document.body), 120)

    if (language !== 'rw') {
      return () => clearTimeout(delayedTimer)
    }

    let rafId = null
    const pendingRoots = new Set()
    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return
      mutations.forEach((m) => {
        if (m.type === 'characterData' && m.target) {
          pendingRoots.add(m.target)
        } else if (m.type === 'attributes' && m.target) {
          pendingRoots.add(m.target)
        } else if (m.type === 'childList') {
          if (m.target) pendingRoots.add(m.target)
          m.addedNodes.forEach((n) => pendingRoots.add(n))
        }
      })
      if (pendingRoots.size > 0 && rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          const batch = Array.from(pendingRoots)
          pendingRoots.clear()
          batch.forEach((node) => walkSubtree(node))
        })
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS_TO_TRANSLATE
    })

    return () => {
      clearTimeout(delayedTimer)
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [language, location.pathname, location.search, activeBranchId])

  return null
}

