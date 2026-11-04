/**
 * EXCELLENCE BOS — Currency Formatting & Number-to-Words Engine
 * Supports English and Kinyarwanda monetary word conversion (RWF).
 */

export function parseNumericInput(raw) {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw
  if (!raw) return 0
  const cleaned = String(raw).replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function formatWithCommas(value) {
  const num = parseNumericInput(value)
  if (!value && value !== 0) return ''
  return Math.round(num).toLocaleString('en-US')
}

export function formatRWF(value, hidePrivacy = false, currency = 'RWF') {
  if (hidePrivacy) return `••••••• ${currency}`
  const num = parseNumericInput(value)
  return `${Math.round(num).toLocaleString('en-US')} ${currency}`
}

const EN_ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
]

const EN_TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
]

function convertHundredsEn(n) {
  let str = ''
  if (n >= 100) {
    str += EN_ONES[Math.floor(n / 100)] + ' hundred'
    n %= 100
    if (n > 0) str += ' and '
  }
  if (n >= 20) {
    str += EN_TENS[Math.floor(n / 10)]
    if (n % 10 > 0) str += '-' + EN_ONES[n % 10]
  } else if (n > 0) {
    str += EN_ONES[n]
  }
  return str
}

export function numberToWordsEnglish(amount, currencyName = 'Rwandan francs') {
  const num = Math.floor(Math.abs(parseNumericInput(amount)))
  if (num === 0) return `Zero ${currencyName}`

  const scales = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' },
    { value: 1, label: '' }
  ]

  let remaining = num
  const parts = []

  for (const scale of scales) {
    if (remaining >= scale.value) {
      const count = Math.floor(remaining / scale.value)
      remaining %= scale.value
      const chunkText = convertHundredsEn(count)
      parts.push(scale.label ? `${chunkText} ${scale.label}` : chunkText)
    }
  }

  const sentence = parts.join(', ')
  const capitalized = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  return `${capitalized} ${num === 1 ? 'Rwandan franc' : currencyName}`
}

/**
 * Kinyarwanda number-to-words converter for RWF amounts
 * Example: 1,000,000 -> "Miliyoni imwe y'amafaranga y'u Rwanda"
 */
const RW_UNITS = ['', 'rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu', 'gatandatu', 'karindwi', 'umunani', 'icyenda']
const RW_HUNDREDS = [
  '', 'ijana', 'magana abiri', 'magana atatu', 'magana ane', 'magana atanu',
  'magana atandatu', 'magana arindwi', 'magana inani', 'magana cyenda'
]
const RW_TENS = [
  '', 'icumi', 'makumyabiri', 'mirongo itatu', 'mirongo ine', 'mirongo itanu',
  'mirongo itandatu', 'mirongo irindwi', 'mirongo inani', 'mirongo cyenda'
]
const RW_THOUSAND_ONES = ['', 'kimwe', 'bibiri', 'bitatu', 'bine', 'bitanu', 'bitandatu', 'birindwi', 'umunani', 'icyenda']
const RW_MILLION_ONES = ['', 'imwe', 'ebyiri', 'eshatu', 'enye', 'eshanu', 'esheshatu', 'indwi', 'umunani', 'icyenda']

function convertUnderThousandRw(n, unitSet = RW_UNITS) {
  if (n === 0) return ''
  const parts = []
  const h = Math.floor(n / 100)
  const rem = n % 100
  const t = Math.floor(rem / 10)
  const u = rem % 10

  if (h > 0) parts.push(RW_HUNDREDS[h])
  if (t > 0) parts.push(RW_TENS[t])
  if (u > 0) parts.push(unitSet[u])

  return parts.join(' na ')
}

export function numberToWordsKinyarwanda(amount) {
  const num = Math.floor(Math.abs(parseNumericInput(amount)))
  if (num === 0) return "Zeroby'amafaranga y'u Rwanda"

  let remaining = num
  const segments = []

  if (remaining >= 1_000_000_000) {
    const b = Math.floor(remaining / 1_000_000_000)
    remaining %= 1_000_000_000
    const bWords = b <= 9 ? RW_MILLION_ONES[b] : convertUnderThousandRw(b, RW_MILLION_ONES)
    segments.push(`miliyari ${bWords}`)
  }

  if (remaining >= 1_000_000) {
    const m = Math.floor(remaining / 1_000_000)
    remaining %= 1_000_000
    const mWords = m <= 9 ? RW_MILLION_ONES[m] : convertUnderThousandRw(m, RW_MILLION_ONES)
    segments.push(`miliyoni ${mWords}`)
  }

  if (remaining >= 1_000) {
    const k = Math.floor(remaining / 1_000)
    remaining %= 1_000
    if (k === 1) {
      segments.push('igihumbi kimwe')
    } else if (k <= 9) {
      segments.push(`ibihumbi ${RW_THOUSAND_ONES[k]}`)
    } else {
      segments.push(`ibihumbi ${convertUnderThousandRw(k, RW_THOUSAND_ONES)}`)
    }
  }

  if (remaining > 0) {
    segments.push(convertUnderThousandRw(remaining, RW_UNITS))
  }

  const joined = segments.join(' na ')
  const capitalized = joined.charAt(0).toUpperCase() + joined.slice(1)
  const connector = num === 1_000_000 ? "y'amafaranga y'u Rwanda" : "by'amafaranga y'u Rwanda"
  return `${capitalized} ${connector}`
}

export function amountToWords(amount, language = 'en') {
  const num = parseNumericInput(amount)
  if (!num || num <= 0) return ''
  return language === 'rw' ? numberToWordsKinyarwanda(num) : numberToWordsEnglish(num)
}

