/**
 * ExBOS Documents & Sharing Utility Library
 * Secure links, document generation, communication formatters, and default templates
 */
import { formatRWF } from '../../../utils/currencyWords'

export const DEFAULT_DOCUMENT_TEMPLATE = {
  businessName: 'Excellence BOS Enterprise',
  tagline: 'Professional Multi-Architecture SME System',
  logo: '',
  email: 'billing@exbosbusiness.rw',
  phone: '+250 788 000 000',
  address: 'KG 11 Ave, Nyarugenge Commercial Hub, Kigali, Rwanda',
  taxId: 'TIN-109283741',
  headerNote: 'Official Business Document · Excellence BOS Verified',
  footerNote: 'Thank you for your business. Payment is due according to agreed credit terms. Goods once sold in good condition are subject to standard warranty.',
  paymentInstructions: 'Bank of Kigali (BK): 00040-0694820-22 | MTN MoMo Business: *182*8*1*880099# | Airtel Money: 0730000000',
  signatoryName: 'Jean-Claude Nshuti',
  signatoryTitle: 'Managing Director & Authorized Signatory'
}

/**
 * Generate a unique tokenized secure view link
 */
export function generateSecureLink(docId) {
  const token = Math.random().toString(36).substring(2, 10)
  return `https://exbos.rw/d/sec-${(docId || 'DOC').toLowerCase()}-${token}`
}

/**
 * Format WhatsApp message with document details and secure access link
 */
export function formatWhatsAppMessage(doc, businessInfo, secureLink) {
  const type = doc.type || 'Document'
  const recipient = doc.recipientName || 'Valued Partner'
  const bName = businessInfo?.businessName || 'ExBOS Business'
  const amountStr = formatRWF(doc.amount || 0)
  const balanceStr = doc.outstandingAmount > 0 ? formatRWF(doc.outstandingAmount) : '0 RWF'

  let text = `Hello *${recipient}*,\n\n`
  text += `Here is your official *${type} (${doc.id})* from *${bName}*.\n\n`
  text += `• *Document*: ${type} #${doc.id}\n`
  text += `• *Total Amount*: ${amountStr}\n`

  if (doc.outstandingAmount > 0) {
    text += `• *Outstanding Balance*: ${balanceStr}\n`
    if (doc.dueDate) text += `• *Due Date*: ${doc.dueDate}\n`
  }

  text += `\n📄 View, verify, or download your official document here:\n${secureLink}\n\n`
  text += `_Payment Instructions:_ ${businessInfo?.paymentInstructions || 'Direct Cash / MTN MoMo Business / Bank Transfer'}\n\n`
  text += `Thank you for partnering with *${bName}*.`

  return text
}

/**
 * Format Payment Reminder message for unpaid invoices
 */
export function formatPaymentReminderMessage(invoice, businessInfo, secureLink) {
  const recipient = invoice.recipientName || 'Valued Customer'
  const bName = businessInfo?.businessName || 'ExBOS Business'
  const outstandingStr = formatRWF(invoice.outstandingAmount || invoice.amount || 0)

  let text = `*PAYMENT REMINDER — ${bName.toUpperCase()}*\n\n`
  text += `Dear *${recipient}*,\n\n`
  text += `This is a friendly reminder regarding unpaid *Invoice #${invoice.id}*.\n\n`
  text += `• *Invoice ID*: ${invoice.id}\n`
  text += `• *Outstanding Balance*: *${outstandingStr}*\n`
  if (invoice.dueDate) text += `• *Payment Due Date*: ${invoice.dueDate}\n`

  text += `\n🔗 View invoice statement online:\n${secureLink}\n\n`
  text += `_Payment Channels:_ ${businessInfo?.paymentInstructions || 'MTN MoMo Business / Bank Transfer'}\n\n`
  text += `If payment has already been sent, please kindly ignore this reminder.\n\n`
  text += `Best regards,\n*${bName}*`

  return text
}

/**
 * Download document as printable/viewable PDF text file
 */
export function downloadDocumentFile(doc, template = DEFAULT_DOCUMENT_TEMPLATE) {
  let content = `================================================================================\n`
  content += `${(template.businessName || 'EXCELLENCE BOS ENTERPRISE').toUpperCase()}\n`
  content += `${template.address || 'Kigali, Rwanda'}\n`
  content += `Phone: ${template.phone || 'N/A'} | Email: ${template.email || 'N/A'} | TIN: ${template.taxId || 'N/A'}\n`
  content += `================================================================================\n\n`

  content += `DOCUMENT: ${(doc.type || 'OFFICIAL DOCUMENT').toUpperCase()}\n`
  content += `NUMBER:   ${doc.id}\n`
  content += `DATE:     ${doc.date || new Date().toISOString().slice(0, 10)}\n`
  if (doc.dueDate) content += `DUE DATE: ${doc.dueDate}\n`
  if (doc.validUntil) content += `VALID UNTIL: ${doc.validUntil}\n`
  content += `STATUS:   ${doc.status || 'Active'}\n\n`

  content += `RECIPIENT:\n`
  content += `Name:     ${doc.recipientName || 'Customer / Partner'}\n`
  if (doc.recipientPhone) content += `Phone:    ${doc.recipientPhone}\n`
  if (doc.recipientEmail) content += `Email:    ${doc.recipientEmail}\n`
  content += `--------------------------------------------------------------------------------\n\n`

  content += `LINE ITEMS:\n`
  content += `Item Description'.padEnd(36)} Qty   Unit Price       Total Amount\n`
  content += `--------------------------------------------------------------------------------\n`

  const items = doc.items && doc.items.length > 0
    ? doc.items
    : [{ name: doc.title || 'Standard Commercial Order', quantity: 1, unit: 'pcs', unitPrice: doc.amount, total: doc.amount }]

  items.forEach((it) => {
    const nameStr = String(it.name || it.product || 'Item').padEnd(36).slice(0, 36)
    const qtyStr = String(it.quantity || 1).padStart(5)
    const priceStr = formatRWF(it.unitPrice || 0, false).padStart(16)
    const totalStr = formatRWF(it.total || ((it.quantity || 1) * (it.unitPrice || 0)), false).padStart(18)
    content += `${nameStr} ${qtyStr} ${priceStr} ${totalStr}\n`
  })

  content += `--------------------------------------------------------------------------------\n`
  content += `TOTAL AMOUNT:          ${formatRWF(doc.amount || 0, false).padStart(49)}\n`
  if (doc.paidAmount !== undefined) {
    content += `AMOUNT PAID:           ${formatRWF(doc.paidAmount || 0, false).padStart(49)}\n`
    content += `OUTSTANDING BALANCE:   ${formatRWF(doc.outstandingAmount || 0, false).padStart(49)}\n`
  }
  content += `================================================================================\n\n`

  if (doc.notes) {
    content += `NOTES & SPECIAL CONDITIONS:\n${doc.notes}\n\n`
  }

  content += `PAYMENT INSTRUCTIONS:\n${template.paymentInstructions || 'Direct Cash / Bank / MoMo'}\n\n`
  content += `AUTHORIZED SIGNATURE:\n${template.signatoryName || 'Authorized Signatory'} — ${template.signatoryTitle || 'Management'}\n\n`
  content += `--------------------------------------------------------------------------------\n`
  content += `${template.footerNote || 'Thank you for your business.'}\n`
  content += `Generated via Excellence Business Operating System (ExBOS)\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${doc.id}_${(doc.type || 'Document')}.txt`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

