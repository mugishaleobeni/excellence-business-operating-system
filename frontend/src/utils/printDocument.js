/**
 * ExBOS Universal Document & Report Printing Engine
 * Prints ONLY the clean, official business document or audited report,
 * completely isolating print output from the web application page, sidebars, and modals.
 */
import { formatRWF } from './currencyWords'

/**
 * Universal print executor.
 * Mounts clean HTML directly into a dedicated isolated print container (#exbos-print-mount),
 * sets print document metadata, suppresses the entire React application (#root) and all modals
 * during print preview, triggers the native browser print dialog, and gracefully cleans up.
 */
export function executePrintHtml(htmlContent, documentTitle = 'ExBOS Document') {
  // Ensure dedicated print mount exists on body outside of #root
  let mount = document.getElementById('exbos-print-mount')
  if (!mount) {
    mount = document.createElement('div')
    mount.id = 'exbos-print-mount'
    document.body.appendChild(mount)
  }

  // Populate mount with the document content wrapped in root container
  mount.innerHTML = `
    <div class="exbos-print-document-root">
      ${htmlContent}
    </div>
  `

  const prevTitle = document.title
  if (documentTitle) {
    document.title = documentTitle
  }

  // Activate print isolation mode on document
  document.body.classList.add('exbos-printing')
  document.documentElement.classList.add('exbos-printing')

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    document.body.classList.remove('exbos-printing')
    document.documentElement.classList.remove('exbos-printing')
    if (documentTitle && prevTitle) {
      document.title = prevTitle
    }
    if (mount) {
      mount.innerHTML = ''
    }
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup, { once: true })

  // Trigger print dialog after DOM paint
  setTimeout(() => {
    try {
      window.focus()
      window.print()
    } catch (e) {
      console.warn('Window print error:', e)
    } finally {
      // Safety fallback cleanup in case afterprint does not fire in some browsers/cancellations
      setTimeout(cleanup, 2500)
    }
  }, 120)
}

/**
 * Print an official Business Document (Invoice, Receipt, Quotation, Purchase Order, Statement)
 */
export function printBusinessDocument(docItem, businessInfo = {}) {
  if (!docItem) return

  const docType = docItem.type || 'Official Document'
  const docId = docItem.id || 'DOC-001'
  const docDate = docItem.date || new Date().toISOString().slice(0, 10)
  const dueDate = docItem.dueDate || docItem.deliveryDate || docItem.validUntil
  const bName = businessInfo.businessName || 'Excellence BOS Enterprise'
  const bAddress = businessInfo.address || 'Kigali, Rwanda'
  const bPhone = businessInfo.phone || '+250 788 000 000'
  const bEmail = businessInfo.email || 'billing@exbosbusiness.rw'
  const bTaxId = businessInfo.taxId || 'TIN-109283741'
  const paymentInstructions = businessInfo.paymentInstructions || 'Bank of Kigali (BK): 00040-0694820-22 | MTN MoMo Business: *182*8*1*880099#'
  const signatoryName = businessInfo.signatoryName || 'Authorized Signatory'
  const signatoryTitle = businessInfo.signatoryTitle || 'Management & Finance'

  const totalAmount = Number(docItem.amount || 0)
  const paidAmount = Number(docItem.paidAmount || (docItem.status === 'Paid' ? totalAmount : 0))
  const outstanding = Number(docItem.outstandingAmount ?? Math.max(0, totalAmount - paidAmount))

  let statusClass = 'tag-default'
  if (docItem.status === 'Paid' || outstanding === 0) statusClass = 'tag-paid'
  else if (docItem.status === 'Partial' || (paidAmount > 0 && outstanding > 0)) statusClass = 'tag-partial'
  else if (docItem.status === 'Unpaid' || docItem.status === 'Overdue') statusClass = 'tag-unpaid'

  const items = docItem.items && docItem.items.length > 0
    ? docItem.items
    : [{ name: docItem.title || 'Commercial Goods / Services', quantity: 1, unit: 'pcs', unitPrice: totalAmount, total: totalAmount }]

  const html = `
    <div style="max-width: 100%; margin: 0 auto; color: #0f172a;">
      <!-- Letterhead Header -->
      <table style="margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px;">
        <tr>
          <td style="vertical-align: top; width: 60%; padding: 0;">
            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 4px;">
              ${businessInfo.tagline || 'Excellence Business Operating System'}
            </div>
            <h1 style="font-size: 18pt; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              ${bName}
            </h1>
            <div class="subtext" style="line-height: 1.4;">
              <div>${bAddress}</div>
              <div>Phone: ${bPhone} | Email: ${bEmail}</div>
              <div style="font-weight: 600; color: #334155; margin-top: 2px;">TIN / Tax Number: ${bTaxId}</div>
            </div>
          </td>
          <td style="vertical-align: top; width: 40%; text-align: right; padding: 0;">
            <div style="display: inline-block; background: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 12pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
              ${docType}
            </div>
            <div style="margin-top: 10px; font-size: 10pt; line-height: 1.5;">
              <div><strong>Doc #:</strong> <span class="mono">${docId}</span></div>
              <div><strong>Date:</strong> <span class="mono">${docDate}</span></div>
              ${dueDate ? `<div><strong style="color: #92400e;">Due Date:</strong> <span class="mono" style="color: #92400e; font-weight: bold;">${dueDate}</span></div>` : ''}
              <div style="margin-top: 4px;">
                <span class="tag ${statusClass}">${docItem.status || (outstanding > 0 ? 'Balance Due' : 'Paid in Full')}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Recipient / Bill To Box -->
      <table style="margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 12px 16px; width: 60%;">
            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
              ${docType.includes('Purchase Order') || docType.includes('Supplier') ? 'Vendor / Supplier:' : 'Bill To / Customer:'}
            </div>
            <div style="font-size: 12pt; font-weight: 700; color: #0f172a;">
              ${docItem.recipientName || 'Valued Client'}
            </div>
            <div class="subtext" style="margin-top: 2px;">
              ${docItem.recipientPhone ? `Phone: ${docItem.recipientPhone}` : ''}
              ${docItem.recipientEmail ? ` | Email: ${docItem.recipientEmail}` : ''}
            </div>
          </td>
          <td style="padding: 12px 16px; width: 40%; text-align: right; vertical-align: middle;">
            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b;">
              Total Amount Payable
            </div>
            <div style="font-size: 15pt; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${formatRWF(totalAmount, false)}
            </div>
          </td>
        </tr>
      </table>

      <!-- Line Items Table -->
      <table style="margin-bottom: 20px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            <th style="text-align: left; border-top-left-radius: 4px; width: 45%;">Item Description</th>
            <th class="text-center" style="width: 15%;">Quantity</th>
            <th class="text-right" style="width: 20%;">Unit Price (RWF)</th>
            <th class="text-right" style="border-top-right-radius: 4px; width: 20%;">Total (RWF)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => {
            const lineTotal = it.total || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))
            const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
            return `
              <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0;">
                <td style="font-weight: 600; color: #1e293b;">${it.name || it.product || 'Standard Product'}</td>
                <td class="text-center mono">${it.quantity || 1} ${it.unit || 'pcs'}</td>
                <td class="text-right mono">${formatRWF(it.unitPrice || 0, false)}</td>
                <td class="text-right mono" style="font-weight: 700;">${formatRWF(lineTotal, false)}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- Totals & Balances -->
      <table style="margin-bottom: 24px;">
        <tr>
          <td style="width: 55%; vertical-align: top; padding-right: 20px;">
            <div style="background: #f1f5f9; border-left: 3px solid #2563eb; padding: 10px 14px; border-radius: 4px;">
              <div style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase; color: #1e40af; margin-bottom: 3px;">
                Official Payment Instructions
              </div>
              <div style="font-size: 9pt; color: #334155; line-height: 1.45; word-break: break-word;">
                ${paymentInstructions}
              </div>
            </div>
            ${docItem.notes ? `
              <div style="margin-top: 10px; font-size: 8.5pt; color: #64748b; font-style: italic;">
                <strong>Notes / Terms:</strong> ${docItem.notes}
              </div>
            ` : ''}
          </td>
          <td style="width: 45%; vertical-align: top;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #64748b; padding: 4px 0;">Subtotal</td>
                <td class="text-right mono" style="font-weight: 600; padding: 4px 0;">${formatRWF(totalAmount, false)}</td>
              </tr>
              ${docItem.paidAmount !== undefined ? `
                <tr>
                  <td style="color: #059669; padding: 4px 0;">Amount Paid / Deposit</td>
                  <td class="text-right mono" style="font-weight: bold; color: #059669; padding: 4px 0;">${formatRWF(paidAmount, false)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 2px solid #0f172a;">
                <td style="font-size: 11pt; font-weight: 800; padding: 8px 0; color: #0f172a;">
                  ${outstanding > 0 ? 'Balance Due' : 'Total Settled'}
                </td>
                <td class="text-right mono" style="font-size: 12pt; font-weight: 800; padding: 8px 0; color: ${outstanding > 0 ? '#b45309' : '#059669'};">
                  ${formatRWF(outstanding > 0 ? outstanding : totalAmount, false)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Signatory & Audit Stamp -->
      <table style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #cbd5e1;">
        <tr>
          <td style="width: 50%; vertical-align: bottom;">
            <div style="font-size: 8pt; text-transform: uppercase; color: #94a3b8; font-weight: bold;">
              Generated via
            </div>
            <div style="font-size: 11pt; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px;">
              EXCELLENCE BOS
            </div>
            <div style="font-size: 8pt; color: #64748b;">
              Audited Business Operating System · Digital Ledger Verified
            </div>
          </td>
          <td style="width: 50%; vertical-align: bottom; text-align: right;">
            <div style="display: inline-block; text-align: center; min-width: 180px;">
              <div style="border-bottom: 1px solid #475569; width: 100%; margin-bottom: 6px;"></div>
              <div style="font-weight: 700; color: #0f172a; font-size: 9.5pt;">${signatoryName}</div>
              <div class="subtext">${signatoryTitle}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `

  executePrintHtml(html, `${docType} - ${docId} (${bName})`)
}

/**
 * Print an official Business Report Statement (Sales Report, Stock Report, P&L, Cash Movement, Debts)
 */
export function printReportDocument({
  title = 'Business Performance Report',
  period = 'Selected Period',
  businessName = 'ExBOS Business Enterprise',
  summaryCards = [],
  columns = [],
  rows = []
}) {
  const html = `
    <div style="max-width: 100%; margin: 0 auto; color: #0f172a;">
      <!-- Report Header -->
      <table style="margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 14px;">
        <tr>
          <td style="vertical-align: top; width: 65%;">
            <div style="font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 2px;">
              Verified Audited Statement
            </div>
            <h1 style="font-size: 17pt; font-weight: 800; color: #0f172a;">
              ${title}
            </h1>
            <div style="font-size: 11pt; font-weight: 600; color: #334155; margin-top: 2px;">
              ${businessName}
            </div>
          </td>
          <td style="vertical-align: top; width: 35%; text-align: right;">
            <div style="font-size: 9pt; color: #64748b;">
              <div><strong>Reporting Period:</strong></div>
              <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">${period}</div>
              <div style="font-size: 8pt; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Summary Metrics Grid -->
      ${summaryCards && summaryCards.length > 0 ? `
        <table style="margin-bottom: 22px; width: 100%;">
          <tr>
            ${summaryCards.map((card) => `
              <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; width: ${Math.floor(100 / summaryCards.length)}%; vertical-align: top;">
                <div style="font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                  ${card.title || card.label}
                </div>
                <div style="font-size: 13pt; font-weight: 800; color: #0f172a; margin-top: 2px;">
                  ${card.value}
                </div>
                ${card.subtitle ? `<div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">${card.subtitle}</div>` : ''}
              </td>
            `).join('')}
          </tr>
        </table>
      ` : ''}

      <!-- Detailed Records Table -->
      <table style="margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff;">
            ${columns.map((col, idx) => `
              <th style="padding: 7px 10px; font-size: 9pt; text-align: ${col.align || (col.key?.includes('amount') || col.key?.includes('total') || col.key?.includes('balance') || col.key?.includes('paid') ? 'right' : 'left')};">
                ${col.header || col.label}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? `
            <tr>
              <td colspan="${columns.length}" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">
                No records recorded for this period.
              </td>
            </tr>
          ` : rows.map((r, rIdx) => {
            const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
            return `
              <tr style="background: ${bg}; border-bottom: 1px solid #e2e8f0;">
                ${columns.map((col) => {
                  let val = typeof col.accessor === 'function' ? col.accessor(r) : r[col.accessor || col.key]
                  if (val === undefined || val === null) val = '—'
                  const isNum = typeof val === 'number' || (!isNaN(val) && String(val).trim() !== '' && typeof val !== 'boolean')
                  const isRight = col.align === 'right' || col.key?.includes('amount') || col.key?.includes('total') || col.key?.includes('balance') || col.key?.includes('paid') || col.key?.includes('Valuation')
                  const formatted = (isNum && !col.key?.includes('quantity') && !col.key?.includes('date') && !col.key?.includes('id'))
                    ? formatRWF(Number(val), false)
                    : val
                  return `
                    <td style="padding: 6px 10px; font-size: 9pt; text-align: ${isRight ? 'right' : (col.align || 'left')};" class="${isRight ? 'mono' : ''}">
                      ${formatted}
                    </td>
                  `
                }).join('')}
              </tr>
            `
          }).join('')}
        </tbody>
      </table>

      <!-- Verification Footer -->
      <table style="margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 12px;">
        <tr>
          <td style="font-size: 8pt; color: #64748b;">
            Official report generated via <strong>Excellence Business Operating System (ExBOS)</strong>. Validated against transaction ledgers.
          </td>
          <td style="font-size: 8pt; color: #64748b; text-align: right;">
            Page 1 of 1 · Verified Business Statement
          </td>
        </tr>
      </table>
    </div>
  `

  executePrintHtml(html, `${title} - ${businessName}`)
}

