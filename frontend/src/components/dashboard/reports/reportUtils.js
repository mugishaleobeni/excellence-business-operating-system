/**
 * ExBOS Reports Dashboard Utility Functions
 * Date filtering, export to CSV/PDF, and currency formatting
 */

/**
 * Checks if a given item date falls within the selected date filter
 */
export function isDateInFilter(dateStr, filter, customStart, customEnd) {
  if (!dateStr) return true
  const itemDate = new Date(dateStr)
  if (isNaN(itemDate.getTime())) return true

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (filter) {
    case 'Today': {
      return itemDate >= todayStart && itemDate <= todayEnd
    }
    case 'Yesterday': {
      const yestStart = new Date(todayStart)
      yestStart.setDate(yestStart.getDate() - 1)
      const yestEnd = new Date(todayEnd)
      yestEnd.setDate(yestEnd.getDate() - 1)
      return itemDate >= yestStart && itemDate <= yestEnd
    }
    case '7 Days': {
      const past7 = new Date(todayStart)
      past7.setDate(past7.getDate() - 6)
      return itemDate >= past7 && itemDate <= todayEnd
    }
    case '30 Days': {
      const past30 = new Date(todayStart)
      past30.setDate(past30.getDate() - 29)
      return itemDate >= past30 && itemDate <= todayEnd
    }
    case 'This Month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return itemDate >= startOfMonth && itemDate <= endOfMonth
    }
    case 'Custom': {
      if (!customStart && !customEnd) return true
      const start = customStart ? new Date(customStart) : new Date(0)
      const end = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date(8640000000000000)
      return itemDate >= start && itemDate <= end
    }
    default:
      return true
  }
}

/**
 * Downloads a structured Excel-compatible CSV with UTF-8 BOM
 */
export function exportToCsv(filename, columns, rows, summaryTotals = null) {
  let csvContent = '\uFEFF' // UTF-8 BOM for Excel compatibility

  // Header row
  const headerLine = columns.map(c => `"${(c.header || c.label || '').replace(/"/g, '""')}"`).join(',')
  csvContent += headerLine + '\r\n'

  // Data rows
  rows.forEach(row => {
    const line = columns.map(c => {
      let val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor || c.key]
      if (val === undefined || val === null) val = ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
    csvContent += line + '\r\n'
  })

  // Summary row if provided
  if (summaryTotals && Array.isArray(summaryTotals)) {
    csvContent += '\r\n'
    const totalLine = summaryTotals.map(t => `"${String(t || '').replace(/"/g, '""')}"`).join(',')
    csvContent += totalLine + '\r\n'
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Downloads a clean formatted text-based PDF/Report statement
 */
export function exportToTextPdf(filename, title, period, businessName, summaryCards, columns, rows) {
  let content = `================================================================================\n`
  content += `EXCELLENCE BOS — ${businessName ? businessName.toUpperCase() : 'ENTERPRISE'}\n`
  content += `REPORT: ${title.toUpperCase()}\n`
  content += `PERIOD: ${period} | GENERATED: ${new Date().toLocaleString()}\n`
  content += `================================================================================\n\n`

  if (summaryCards && summaryCards.length > 0) {
    content += `SUMMARY METRICS:\n`
    content += `--------------------------------------------------------------------------------\n`
    summaryCards.forEach(card => {
      content += `${card.title.padEnd(30)}: ${String(card.value).padStart(20)}\n`
    })
    content += `--------------------------------------------------------------------------------\n\n`
  }

  content += `DETAILED RECORDS (${rows.length} entries):\n`
  content += `--------------------------------------------------------------------------------\n`
  const colHeaders = columns.map(c => (c.header || c.label || '').padEnd(16)).join(' ')
  content += colHeaders + '\n'
  content += `--------------------------------------------------------------------------------\n`

  rows.forEach(r => {
    const line = columns.map(c => {
      let val = typeof c.accessor === 'function' ? c.accessor(r) : r[c.accessor || c.key]
      if (val === undefined || val === null) val = '—'
      return String(val).slice(0, 15).padEnd(16)
    }).join(' ')
    content += line + '\n'
  })
  content += `================================================================================\n`
  content += `Verified by Excellence Business Operating System (ExBOS)\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.txt`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

