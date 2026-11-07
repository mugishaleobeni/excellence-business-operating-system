import React, { useState, useEffect, useMemo } from 'react'
import { useExbos } from '../../../context/ExbosContext'
import { CheckCircle2 } from 'lucide-react'
import { DEFAULT_DOCUMENT_TEMPLATE, downloadDocumentFile } from './documentUtils'

// Subviews
import DocumentsOverview from './DocumentsOverview'
import InvoicesView from './InvoicesView'
import ReceiptsView from './ReceiptsView'
import QuotationsView from './QuotationsView'
import PurchaseOrdersView from './PurchaseOrdersView'
import StatementsView from './StatementsView'
import SentHistoryView from './SentHistoryView'
import DocumentTemplatesView from './DocumentTemplatesView'
import ShareAndExportView from './ShareAndExportView'

// Modals
import CreateDocumentModal from './CreateDocumentModal'
import SendDocumentModal from './SendDocumentModal'
import DocumentPreviewModal from './DocumentPreviewModal'
import PaymentReminderModal from './PaymentReminderModal'

export default function DocumentsAndSharingPanel({
  activePage = 'Overview',
  activeArchId = 'buy-and-sell'
}) {
  const { user, hideFinancials, demoWorkspaces = {}, updateDemoWorkspace } = useExbos()

  const workspace = demoWorkspaces?.[activeArchId] || {}
  const records = workspace.records || {}
  const customers = records['Customers'] || []
  const suppliers = records['Suppliers'] || []
  const inventory = records['Inventory'] || records['Products'] || []
  const sales = records['Sales'] || []
  const purchases = records['Purchases'] || []

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('')
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Document Template State (persisted)
  const [template, setTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_document_template')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      ...DEFAULT_DOCUMENT_TEMPLATE,
      businessName: user?.businessName || workspace.name || 'ExBOS Business Enterprise'
    }
  })

  // Sent History & Documents Store (backed by workspace.records in MongoDB)
  const documents = Array.isArray(records['Documents']) ? records['Documents'] : []
  const sentHistory = Array.isArray(records['SentHistory']) ? records['SentHistory'] : []

  const setDocuments = (updater) => {
    const nextDocs = typeof updater === 'function' ? updater(documents) : updater
    try {
      localStorage.setItem('exbos_business_documents', JSON.stringify(nextDocs))
    } catch {}
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          Documents: nextDocs
        }
      })
    }
  }

  const setSentHistory = (updater) => {
    const nextHistory = typeof updater === 'function' ? updater(sentHistory) : updater
    try {
      localStorage.setItem('exbos_sent_history', JSON.stringify(nextHistory))
    } catch {}
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          SentHistory: nextHistory
        }
      })
    }
  }

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createInitialType, setCreateInitialType] = useState('Invoice')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)

  // Document actions
  const handleDocumentCreated = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev])
    showToast(`✓ Created ${newDoc.type} #${newDoc.id} for ${newDoc.recipientName}.`)
    setSelectedDoc(newDoc)
    setPreviewModalOpen(true)
  }

  const handleDocumentSentSuccess = (sentEntry) => {
    const nextHistory = [sentEntry, ...sentHistory]
    const nextDocs = documents.map((d) => {
      if (d.id === sentEntry.documentId && d.status === 'Draft') {
        return { ...d, status: 'Sent' }
      }
      return d
    })
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          Documents: nextDocs,
          SentHistory: nextHistory
        }
      })
    }
    showToast(`✓ Document #${sentEntry.documentId} shared via ${sentEntry.method}. Logged in Sent History.`)
  }

  const handleReminderSent = ({ invoiceId, recipient, method }) => {
    const nextDocs = documents.map((d) => {
      if (d.id === invoiceId) {
        return { ...d, lastReminderSentAt: new Date().toISOString() }
      }
      return d
    })
    const reminderEntry = {
      id: `SH-${Date.now().toString().slice(-4)}`,
      documentId: invoiceId,
      documentTitle: `Payment Reminder #${invoiceId}`,
      recipient,
      contact: method,
      method,
      status: 'Opened Externally',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      link: `https://exbos.rw/d/sec-${invoiceId.toLowerCase()}`
    }
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          Documents: nextDocs,
          SentHistory: [reminderEntry, ...sentHistory]
        }
      })
    }
    showToast(`✓ Payment reminder sent to ${recipient}. Accidental duplicate prevention active for 24h.`)
  }

  const handleConvertToInvoice = (quote) => {
    const invId = `INV-${Math.floor(100 + Math.random() * 900)}`
    const newInvoice = {
      ...quote,
      id: invId,
      type: 'Invoice',
      title: `Commercial Tax Invoice #${invId}`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Unpaid',
      paidAmount: 0,
      outstandingAmount: quote.amount,
      notes: `Converted from Quotation #${quote.id}.`
    }
    // Update quotation status to accepted
    setDocuments((prev) => [
      newInvoice,
      ...prev.map((d) => (d.id === quote.id ? { ...d, status: 'Accepted' } : d))
    ])
    showToast(`✓ Quotation #${quote.id} converted to Commercial Invoice #${invId}.`)
    setSelectedDoc(newInvoice)
    setPreviewModalOpen(true)
  }

  const handleSaveTemplate = (updatedTemplate) => {
    setTemplate(updatedTemplate)
    try {
      localStorage.setItem('exbos_document_template', JSON.stringify(updatedTemplate))
    } catch {}
    showToast('✓ Business document template updated successfully.')
  }

  const handleResetTemplate = () => {
    setTemplate(DEFAULT_DOCUMENT_TEMPLATE)
    try {
      localStorage.removeItem('exbos_document_template')
    } catch {}
    showToast('✓ Restored default professional template.')
  }

  const handleDownloadDoc = (doc) => {
    downloadDocumentFile(doc, template)
    showToast(`✓ Downloaded ${doc.id} as printable document file.`)
  }

  // Open modals helper
  const openCreateForType = (type) => {
    setCreateInitialType(type)
    setCreateModalOpen(true)
  }

  const openPreview = (doc) => {
    setSelectedDoc(doc)
    setPreviewModalOpen(true)
  }

  const openSend = (doc) => {
    setSelectedDoc(doc)
    setSendModalOpen(true)
  }

  const openReminder = (inv) => {
    setSelectedDoc(inv)
    setReminderModalOpen(true)
  }

  // Normalize subpage
  const normalizedPage = useMemo(() => {
    const p = (activePage || '').toLowerCase()
    if (p.includes('share') || p.includes('export')) return 'Share & Export'
    if (p.includes('recent')) return 'Sent History'
    if (p.includes('invoice')) return 'Invoices'
    if (p.includes('receipt')) return 'Receipts'
    if (p.includes('quotation')) return 'Quotations'
    if (p.includes('purchase') || p.includes('order')) return 'Purchase Orders'
    if (p.includes('statement')) return 'Statements'
    if (p.includes('history') || p.includes('sent')) return 'Sent History'
    if (p.includes('template')) return 'Templates'
    return 'Overview'
  }, [activePage])

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Subpage View Rendering */}
      {normalizedPage === 'Overview' && (
        <DocumentsOverview
          documents={documents}
          sentHistory={sentHistory}
          hideFinancials={hideFinancials}
          onCreateClick={() => {
            setCreateInitialType(null)
            setCreateModalOpen(true)
          }}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Invoices' && (
        <InvoicesView
          documents={documents}
          hideFinancials={hideFinancials}
          onCreateInvoice={() => openCreateForType('Invoice')}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onOpenReminderModal={openReminder}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Receipts' && (
        <ReceiptsView
          documents={documents}
          hideFinancials={hideFinancials}
          onCreateReceipt={() => openCreateForType('Receipt')}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Quotations' && (
        <QuotationsView
          documents={documents}
          hideFinancials={hideFinancials}
          onCreateQuotation={() => openCreateForType('Quotation')}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onConvertToInvoice={handleConvertToInvoice}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Purchase Orders' && (
        <PurchaseOrdersView
          documents={documents}
          hideFinancials={hideFinancials}
          onCreatePO={() => openCreateForType('Purchase Order')}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Statements' && (
        <StatementsView
          customers={customers}
          suppliers={suppliers}
          documents={documents}
          sales={sales}
          purchases={purchases}
          hideFinancials={hideFinancials}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Sent History' && (
        <SentHistoryView
          sentHistory={sentHistory}
          documents={documents}
          onOpenPreviewModal={openPreview}
          onOpenSendModal={openSend}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Share & Export' && (
        <ShareAndExportView
          documents={documents}
          sentHistory={sentHistory}
          onOpenSendModal={openSend}
          onOpenPreviewModal={openPreview}
          onDownloadDoc={handleDownloadDoc}
        />
      )}

      {normalizedPage === 'Templates' && (
        <DocumentTemplatesView
          template={template}
          onSaveTemplate={handleSaveTemplate}
          onResetTemplate={handleResetTemplate}
        />
      )}

      {/* Modals */}
      <CreateDocumentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialType={createInitialType}
        customers={customers}
        suppliers={suppliers}
        inventory={inventory}
        onDocumentCreated={handleDocumentCreated}
      />

      <SendDocumentModal
        isOpen={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false)
          setSelectedDoc(null)
        }}
        document={selectedDoc}
        businessInfo={template}
        onSentSuccess={handleDocumentSentSuccess}
      />

      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false)
          setSelectedDoc(null)
        }}
        document={selectedDoc}
        businessInfo={template}
        onOpenSendModal={openSend}
      />

      <PaymentReminderModal
        isOpen={reminderModalOpen}
        onClose={() => {
          setReminderModalOpen(false)
          setSelectedDoc(null)
        }}
        invoice={selectedDoc}
        businessInfo={template}
        onReminderSent={handleReminderSent}
      />
    </div>
  )
}

