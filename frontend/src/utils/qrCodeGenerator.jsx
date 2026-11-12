import React, { useState } from 'react'
import { QrCode, Copy, Check, Download, Printer } from 'lucide-react'

/**
 * Format standard scannable product information for any camera / QR code scanner
 */
export function formatProductQrData(product = {}, businessName = '') {
  if (!product) return 'ExBOS Product'
  
  const title = product.title || product.name || 'Unnamed Product'
  const sku = product.sku || product.barcode || 'N/A'
  const category = typeof product.category === 'object' ? (product.category?.name || 'General') : (product.category || 'General')
  const price = product.sellingPriceRWF !== undefined ? Number(product.sellingPriceRWF).toLocaleString() : (product.amountRWF ? Number(product.amountRWF).toLocaleString() : '0')
  const cost = product.unitCostRWF !== undefined || product.purchasePriceRWF !== undefined ? Number(product.unitCostRWF ?? product.purchasePriceRWF).toLocaleString() : null
  const stock = product.quantity !== undefined ? product.quantity : (product.currentStock || 0)
  const unit = product.unit || 'units'
  const biz = businessName || product.businessName || 'ExBOS Rwanda'

  let text = `ExBOS PRODUCT VERIFIED\n`
  text += `Name: ${title}\n`
  text += `SKU: ${sku}\n`
  text += `Category: ${category}\n`
  text += `Price: ${price} RWF\n`
  if (cost) {
    text += `Unit Cost: ${cost} RWF\n`
  }
  text += `Stock: ${stock} ${unit}\n`
  text += `Business: ${biz}`

  return text
}

/**
 * Build URL to backend vector QR Code endpoint
 */
export function getQrCodeSvgUrl(text, boxSize = 8, border = 2) {
  const enc = encodeURIComponent(String(text || '').trim())
  return `/api/v1/workspaces/qrcode?text=${enc}&box_size=${boxSize}&border=${border}&format=svg`
}

export function getQrCodePngUrl(text, boxSize = 8, border = 2) {
  const enc = encodeURIComponent(String(text || '').trim())
  return `/api/v1/workspaces/qrcode?text=${enc}&box_size=${boxSize}&border=${border}&format=png`
}

/**
 * Real Scannable Product QR Code Component
 */
export default function ProductQrCode({
  product = {},
  businessName = '',
  size = 140,
  showActions = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false)
  const qrDataText = formatProductQrData(product, businessName)
  const qrSvgUrl = getQrCodeSvgUrl(qrDataText, 6, 2)
  const qrPngUrl = getQrCodePngUrl(qrDataText, 10, 2)

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(qrDataText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.warn('Copy failed:', e)
    }
  }

  const handlePrintLabel = () => {
    const title = product.title || product.name || 'Product'
    const sku = product.sku || product.barcode || ''
    const price = product.sellingPriceRWF !== undefined ? Number(product.sellingPriceRWF).toLocaleString() : ''
    const biz = businessName || 'ExBOS Business'

    const printWindow = window.open('', '_blank', 'width=520,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ExBOS Print Label - ${title}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #000; padding: 20px; text-align: center; }
            .label-card { border: 2px dashed #000; border-radius: 12px; padding: 20px; max-width: 380px; margin: 0 auto; }
            .biz { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; font-weight: bold; margin-bottom: 4px; }
            .title { font-size: 18px; font-weight: bold; margin: 6px 0; color: #111; }
            .price { font-size: 20px; font-weight: 800; color: #000; margin: 8px 0; }
            .sku { font-family: monospace; font-size: 13px; letter-spacing: 2px; margin-top: 8px; font-weight: bold; }
            .qr-img { width: 160px; height: 160px; margin: 12px auto; display: block; }
            .note { font-size: 10px; color: #777; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="biz">${biz}</div>
            <div class="title">${title}</div>
            ${price ? `<div class="price">${price} RWF</div>` : ''}
            <img class="qr-img" src="${qrPngUrl}" alt="QR Code" />
            <div class="sku">${sku}</div>
            <div class="note">Scan with any phone camera or QR scanner for product verification</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-slate-900 shadow-md ${className}`}>
      {/* SVG QR Code */}
      <div
        className="relative flex items-center justify-center bg-white p-1 rounded-xl"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={qrSvgUrl}
          alt={`QR Code for ${product.title || 'Product'}`}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="eager"
        />
      </div>

      <div className="text-[10px] text-slate-500 font-medium tracking-wide mt-1.5 flex items-center gap-1">
        <QrCode className="w-3 h-3 text-[#218DFF]" />
        <span>Scannable with any phone camera</span>
      </div>

      {showActions && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200 w-full justify-center">
          <button
            type="button"
            onClick={handleCopyText}
            title="Copy scannable product info"
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Info'}</span>
          </button>

          <a
            href={qrPngUrl}
            download={`${(product.title || 'product').toLowerCase().replace(/\s+/g, '-')}-qrcode.png`}
            title="Download QR Code image"
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Save</span>
          </a>

          <button
            type="button"
            onClick={handlePrintLabel}
            title="Print scannable product label"
            className="px-2 py-1 rounded-lg bg-[#218DFF]/15 hover:bg-[#218DFF]/25 border border-[#218DFF]/30 active:scale-95 text-[10px] font-bold text-[#1045CA] flex items-center gap-1 transition-all cursor-pointer"
          >
            <Printer className="w-3 h-3 text-[#218DFF]" />
            <span>Print Label</span>
          </button>
        </div>
      )}
    </div>
  )
}

