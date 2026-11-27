/**
 * Zero-config static undefined-identifier checker for ExBOS frontend (.js / .jsx).
 * Uses @babel/parser & @babel/traverse (already installed via @vitejs/plugin-react)
 * to catch ReferenceError bugs (e.g. forgotten context destructuring or typos)
 * BEFORE Vite builds or deploys.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'navigator', 'location', 'history', 'screen', 'performance',
  'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'crypto', 'fetch',
  'Headers', 'Request', 'Response', 'URL', 'URLSearchParams', 'Blob', 'File',
  'FileReader', 'FormData', 'AbortController', 'CustomEvent', 'Event', 'MessageChannel', 'BroadcastChannel',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'AudioContext',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'queueMicrotask',
  'console', 'alert', 'confirm', 'prompt', 'atob', 'btoa', 'Image', 'Audio', 'HTMLElement',
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'BigInt', 'Function',
  'Date', 'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect', 'JSON', 'Math', 'Intl',
  'Infinity', 'NaN', 'undefined', 'globalThis', 'isNaN', 'isFinite', 'parseInt', 'parseFloat',
  'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int32Array', 'Float32Array', 'Float64Array', 'ArrayBuffer', 'DataView',
  'process', 'module', 'exports', 'require', '__dirname', '__filename', 'Buffer',
  'React', 'JSX', 'arguments', 'self', 'Node', 'NodeFilter', 'TreeWalker', 'DOMParser',
  'XMLSerializer', 'CSS', 'getComputedStyle', 'matchMedia', 'BarcodeDetector'
])

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8')
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'classProperties', 'topLevelAwait']
  })
  const errors = []
  traverse(ast, {
    ReferencedIdentifier(p) {
      const name = p.node.name
      if (BROWSER_GLOBALS.has(name)) return
      if (p.scope.hasBinding(name)) return
      // Ignore JSX intrinsic lowercase HTML/SVG tags (e.g. <div>, <svg>)
      if (p.parent.type === 'JSXOpeningElement' || p.parent.type === 'JSXClosingElement') {
        if (/^[a-z]/.test(name)) return
      }
      // Ignore typeof checks
      if (p.parent.type === 'UnaryExpression' && p.parent.operator === 'typeof') return
      errors.push({
        file: filePath,
        line: p.node.loc?.start?.line || 0,
        col: p.node.loc?.start?.column || 0,
        name
      })
    }
  })
  return errors
}

const args = process.argv.slice(2)
const targets = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(jsx|js)$/.test(entry.name)) targets.push(full)
  }
}

if (args.length > 0) {
  for (const a of args) targets.push(path.resolve(process.cwd(), a))
} else {
  walk(path.resolve(process.cwd(), 'src'))
}

let totalErrors = 0
for (const f of targets) {
  try {
    const errs = checkFile(f)
    for (const e of errs) {
      console.error(`UNDEF: ${path.relative(process.cwd(), e.file)}:${e.line}:${e.col} -> '${e.name}' is not defined`)
      totalErrors++
    }
  } catch (parseErr) {
    console.error(`PARSE ERROR: ${path.relative(process.cwd(), f)} -> ${parseErr.message}`)
    totalErrors++
  }
}

if (totalErrors > 0) {
  console.error(`\nFound ${totalErrors} undefined reference(s). Build blocked.`)
  process.exit(1)
}
console.log(`check-undef: verified ${targets.length} file(s) with 0 undefined references.`)
