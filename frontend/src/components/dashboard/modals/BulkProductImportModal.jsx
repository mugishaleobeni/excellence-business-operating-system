import React, { useState } from 'react'
import { Upload, Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'

const CSV_TEMPLATE = [
  'title,sku,category,unit,purchasePriceRWF,sellingPriceRWF,wholesalePriceRWF,wholesaleMinQty,quantity,lowStockAlert,batchNumber,expiryDate,serialNumbers',
  'Samsung Galaxy A15,SAM-A15-128,Electronics,piece,185000,220000,205000,3,5,2,,,3589120001|3589120002',
  'Paracetamol 500mg Box,PHARM-PARA-500,Pharmacy,box,1200,2000,1600,10,40,10,BATCH-2026A,2027-06-30,',
  'Inyange Water 500ml Pack,INY-500ML,Fast Moving Consumer Goods,pack,3800,5000,4500,5,30,5,B-092,2027-01-15,'
].join('\n')

function parseCsvText(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const splitRow = (line) => {
    const out = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur.trim())
    return out
  }

  const headers = splitRow(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const idxOf = (...names) => headers.findIndex((h) => names.includes(h))

  const iTitle = idxOf('title', 'name', 'product', 'product name', 'item')
  const iSku = idxOf('sku', 'barcode', 'code')
  const iCat = idxOf('category', 'group')
  const iUnit = idxOf('unit')
  const iBuy = idxOf('purchasepricerwf', 'costprice', 'cost', 'buyprice', 'purchase price')
  const iSell = idxOf('sellingpricerwf', 'price', 'sellprice', 'selling price', 'retailprice')
  const iWhole = idxOf('wholesalepricerwf', 'wholesaleprice', 'wholesale')
  const iWholeMin = idxOf('wholesaleminqty', 'minwholesaleqty')
  const iQty = idxOf('quantity', 'stock', 'qty')
  const iAlert = idxOf('lowstockalert', 'minstock')
  const iBatch = idxOf('batchnumber', 'batch')
  const iExp = idxOf('expirydate', 'expiry')
  const iSerials = idxOf('serialnumbers', 'imei', 'serials')

  if (iTitle === -1) return []

  const rows = []
  for (let r = 1; r < lines.length; r++) {
    const cols = splitRow(lines[r])
    const title = (cols[iTitle] || '').trim()
    if (!title) continue
    rows.push({
      title,
      sku: iSku >= 0 ? cols[iSku] || '' : '',
      category: iCat >= 0 ? cols[iCat] || 'General' : 'General',
      unit: iUnit >= 0 ? cols[iUnit] || 'piece' : 'piece',
      purchasePriceRWF: iBuy >= 0 ? Number(String(cols[iBuy] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      sellingPriceRWF: iSell >= 0 ? Number(String(cols[iSell] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      wholesalePriceRWF: iWhole >= 0 ? Number(String(cols[iWhole] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      wholesaleMinQty: iWholeMin >= 0 ? Number(cols[iWholeMin] || 5) || 5 : 5,
      quantity: iQty >= 0 ? Number(String(cols[iQty] || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
      lowStockAlert: iAlert >= 0 ? Number(cols[iAlert] || 5) || 5 : 5,
      batchNumber: iBatch >= 0 ? cols[iBatch] || '' : '',
      expiryDate: iExp >= 0 ? (cols[iExp] || '').slice(0, 10) : '',
      serialNumbers: iSerials >= 0 && cols[iSerials] ? cols[iSerials].split('|').map((s) => s.trim()).filter(Boolean) : []
    })
  }
  return rows
}

export default function BulkProductImportModal({
  isOpen,
  onClose,
  activeArchId = 'buy-and-sell',
  activeBranchId = 'main',
  addToast,
  onImported
}) {
  const [parsedRows, setParsedRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [importing, setImporting] = useState(false)

  if (!isOpen) return null

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exbos-products-import-template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    setErrorMsg('')
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '')
      const rows = parseCsvText(text)
      if (rows.length === 0) {
        setErrorMsg('No valid product rows found. Ensure your CSV has a "title" or "name" column header.')
        setParsedRows([])
      } else {
        setParsedRows(rows.slice(0, 500))
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setImporting(true)
    setErrorMsg('')
    try {
      const res = await exbosApi.bulkImportProducts(activeArchId, {
        branchId: activeBranchId || 'main',
        items: parsedRows
      })
      const data = res?.data?.data || res?.data
      if (!res?.ok) {
        setErrorMsg(res?.data?.error || res?.error || 'Bulk import failed.')
        return
      }
      addToast?.({
        type: 'success',
        title: 'Bulk Products Imported',
        message: `${data?.createdCount || 0} created, ${data?.updatedCount || 0} updated in MongoDB.`
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exbos:offline-synced'))
      }
      onImported?.(data)
      setParsedRows([])
      setFileName('')
      onClose?.()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-[#06143D] border border-[#218DFF]/40 shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#9EDCFF]" />
            <div>
              <h3 className="font-orbitron text-sm font-bold">Bulk Excel / CSV Product Import</h3>
              <p className="text-[11px] text-slate-300">
                Upload up to 500 products with Retail/Wholesale prices, Batch/Expiry, and Serial/IMEI numbers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#030B24] border border-white/10 text-xs">
            <span className="text-slate-300">Need the exact column format? Download our ready-to-fill CSV template.</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Template
            </button>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-[#218DFF]/40 hover:border-[#9EDCFF] bg-[#030B24]/60 cursor-pointer transition">
            <Upload className="w-7 h-7 text-[#9EDCFF]" />
            <span className="text-xs font-bold text-white">
              {fileName ? `Selected: ${fileName}` : 'Click to choose a .CSV file from Excel / SmartStock'}
            </span>
            <span className="text-[11px] text-slate-400">Supports SKU deduplication (existing SKUs update stock &amp; price)</span>
            <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
          </label>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to import {parsedRows.length} product
                  {parsedRows.length === 1 ? '' : 's'}
                </span>
                <span className="text-[11px] text-slate-400">Previewing first {Math.min(5, parsedRows.length)}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-2.5 py-2">Product</th>
                      <th className="px-2.5 py-2">SKU</th>
                      <th className="px-2.5 py-2">Sell / Wholesale</th>
                      <th className="px-2.5 py-2">Qty</th>
                      <th className="px-2.5 py-2">Expiry / IMEI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedRows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="px-2.5 py-1.5 font-semibold text-white">{r.title}</td>
                        <td className="px-2.5 py-1.5 font-mono text-slate-300">{r.sku || 'Auto'}</td>
                        <td className="px-2.5 py-1.5 text-emerald-300">
                          {formatRWF(r.sellingPriceRWF)}
                          {r.wholesalePriceRWF > 0 ? ` / ${formatRWF(r.wholesalePriceRWF)}` : ''}
                        </td>
                        <td className="px-2.5 py-1.5">{r.quantity}</td>
                        <td className="px-2.5 py-1.5 text-slate-300">
                          {r.expiryDate || (r.serialNumbers.length > 0 ? `${r.serialNumbers.length} IMEI` : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-white/10 bg-[#040D29]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={importing || parsedRows.length === 0}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] disabled:opacity-40 text-white text-xs font-orbitron font-bold cursor-pointer"
          >
            {importing ? 'Importing...' : `Import ${parsedRows.length || ''} Products`}
          </button>
        </div>
      </div>
    </div>
  )
}
