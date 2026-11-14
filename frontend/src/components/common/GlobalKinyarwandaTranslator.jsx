import { useEffect, useRef } from 'react'
import { useExbos } from '../../context/ExbosContext'
import { translateToKinyarwanda } from '../../utils/kinyarwandaDict'

const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label']

/**
 * Global, reversible Kinyarwanda page translator.
 * - When language === 'rw', translates matching UI text nodes & attributes across all pages.
 * - When language === 'en', restores original English strings from WeakMaps cleanly.
 */
export default function GlobalKinyarwandaTranslator() {
  const { language } = useExbos()
  const origTextMapRef = useRef(new WeakMap())
  const origAttrMapRef = useRef(new WeakMap())
  const isApplyingRef = useRef(false)

  useEffect(() => {
    document.documentElement.lang = language === 'rw' ? 'rw' : 'en'

    const origTextMap = origTextMapRef.current
    const origAttrMap = origAttrMapRef.current

    const processTextNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return
      const parentTag = node.parentElement?.tagName
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'TEXTAREA') return

      const currentVal = node.nodeValue || ''
      if (!currentVal.trim()) return

      if (language === 'rw') {
        const baseText = origTextMap.has(node) ? origTextMap.get(node) : currentVal
        const translated = translateToKinyarwanda(baseText)
        if (translated !== baseText) {
          if (!origTextMap.has(node)) {
            origTextMap.set(node, baseText)
          }
          if (currentVal !== translated) {
            node.nodeValue = translated
          }
        }
      } else if (origTextMap.has(node)) {
        const original = origTextMap.get(node)
        if (currentVal !== original) {
          node.nodeValue = original
        }
        origTextMap.delete(node)
      }
    }

    const processElementAttrs = (el) => {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return
      ATTRS_TO_TRANSLATE.forEach((attr) => {
        if (!el.hasAttribute(attr)) return
        const cur = el.getAttribute(attr) || ''
        let attrStore = origAttrMap.get(el)
        if (language === 'rw') {
          const base = attrStore && attrStore[attr] !== undefined ? attrStore[attr] : cur
          const translated = translateToKinyarwanda(base)
          if (translated !== base) {
            if (!attrStore) {
              attrStore = {}
              origAttrMap.set(el, attrStore)
            }
            if (attrStore[attr] === undefined) attrStore[attr] = base
            if (cur !== translated) el.setAttribute(attr, translated)
          }
        } else if (attrStore && attrStore[attr] !== undefined) {
          if (cur !== attrStore[attr]) el.setAttribute(attr, attrStore[attr])
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

    if (language !== 'rw') {
      return undefined
    }

    let rafId = null
    const pendingRoots = new Set()
    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return
      mutations.forEach((m) => {
        if (m.type === 'characterData' && m.target) {
          pendingRoots.add(m.target)
        } else if (m.type === 'childList') {
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
      characterData: true
    })

    return () => {
      observer.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [language])

  return null
}

