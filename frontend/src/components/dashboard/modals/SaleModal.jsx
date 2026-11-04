import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingBag, X, Package, ChevronDown, Search, Check, Info, TrendingUp, AlertTriangle, CheckCircle2, Eye, Send, Download } from "lucide-react";
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from "../../../utils/currencyWords";
import CustomSelect from "../../common/CustomSelect";
import SendDocumentModal from "../documents/SendDocumentModal";
import DocumentPreviewModal from "../documents/DocumentPreviewModal";
import { downloadDocumentFile } from "../documents/documentUtils";

export default function SaleModal({
  isOpen,
  onClose,
  recordedProducts = [],
  existingCustomers = [],
  activeArchId = "buy-and-sell",
  currentArch = { shortName: "Retail" },
  activePage = "Sales",
  onSaveSale
}) {
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [saleUnitPrice, setSaleUnitPrice] = useState("");
  const [saleCustomerName, setSaleCustomerName] = useState("");
  const [saleCustomerPhone, setSaleCustomerPhone] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState("Cash");
  const [salePaymentStatus, setSalePaymentStatus] = useState("Paid in Full");
  const [saleProductDropdownOpen, setSaleProductDropdownOpen] = useState(false);
  const [saleProductSearch, setSaleProductSearch] = useState("");
  const [saleUpdateCatalogPrice, setSaleUpdateCatalogPrice] = useState(false);
  const [savedSaleDoc, setSavedSaleDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const saleProductDropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSaleProductId("");
      setSaleQuantity("1");
      setSaleUnitPrice("");
      setSaleCustomerName("");
      setSaleCustomerPhone("");
      setSalePaymentMethod("Cash");
      setSalePaymentStatus("Paid in Full");
      setSaleProductDropdownOpen(false);
      setSaleProductSearch("");
      setSavedSaleDoc(null);
      setPreviewOpen(false);
      setSendOpen(false);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (saleProductDropdownRef.current && !saleProductDropdownRef.current.contains(e.target)) {
        setSaleProductDropdownOpen(false);
      }
    };
    if (saleProductDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [saleProductDropdownOpen]);

  const saleItemPickerConfig = useMemo(() => {
    switch (activeArchId) {
      case "make-and-sell":
        return {
          label: "Select Finished Goods to Sell",
          placeholder: "-- Select finished bakery or manufactured batch --",
          searchPlaceholder: "Search finished goods...",
          emptyTitle: "No finished goods recorded in stock",
          emptySub: "Record finished goods in Stock first to sell."
        };
      case "agriculture":
      case "agriculture-livestock":
        return {
          label: "Select Farm Product / Harvest to Sell",
          placeholder: "-- Select harvested crops, animal products, or livestock --",
          searchPlaceholder: "Search farm outputs...",
          emptyTitle: "No farm stock available",
          emptySub: "Log harvests or animal products in Farm Inventory first."
        };
      case "food-hospitality":
        return {
          label: "Select Menu Dish / Beverage to Sell",
          placeholder: "-- Select dish or beverage --",
          searchPlaceholder: "Search menu dishes...",
          emptyTitle: "No menu items recorded in stock",
          emptySub: "Register dishes in Kitchen Menu / Inventory first."
        };
      default:
        return {
          label: "Select Recorded Product to Sell",
          placeholder: "-- Select a product from inventory --",
          searchPlaceholder: "Search products by name or SKU...",
          emptyTitle: "No products recorded in stock",
          emptySub: "Record products in the Products module first to sell."
        };
    }
  }, [activeArchId]);

  const selectedSaleProduct = useMemo(() => {
    return (recordedProducts || []).find((p) => p.id === saleProductId) || null;
  }, [recordedProducts, saleProductId]);

  const filteredSaleProducts = useMemo(() => {
    const list = recordedProducts || [];
    if (!saleProductSearch.trim()) return list;
    const q = saleProductSearch.toLowerCase();
    return list.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [recordedProducts, saleProductSearch]);

  const handleSelectProduct = (prod) => {
    setSaleProductId(prod.id);
    setSaleUnitPrice(prod.sellingPriceRWF ? String(prod.sellingPriceRWF) : (prod.amountRWF ? String(prod.amountRWF) : ""));
    setSaleProductDropdownOpen(false);
    setSaleProductSearch("");
  };

  const handleSelectSaleProduct = (prodId) => {
    const prod = (recordedProducts || []).find((p) => p.id === prodId);
    if (prod) {
      handleSelectProduct(prod);
    }
  };

  const qtyNum = Number(saleQuantity) || 0;
  const unitPriceNum = parseNumericInput(saleUnitPrice) || 0;
  const unitCostNum = Number(selectedSaleProduct?.purchasePriceRWF ?? selectedSaleProduct?.unitCostRWF) || 0;
  const totalSaleAmount = qtyNum * unitPriceNum;
  const totalCostAmount = qtyNum * unitCostNum;
  const totalProfit = totalSaleAmount - totalCostAmount;
  const profitMarginPct = totalSaleAmount > 0 ? Math.round((totalProfit / totalSaleAmount) * 100) : 0;
  const isOutOfStock = selectedSaleProduct && (Number(selectedSaleProduct.quantity) || 0) <= 0;

  const saleAvailableStock = Number(selectedSaleProduct?.quantity ?? selectedSaleProduct?.currentStock) || 0;
  const saleUnit = selectedSaleProduct?.unit || 'piece';
  const saleUnitCost = unitCostNum;
  const saleOriginalCatalogPrice = Number(selectedSaleProduct?.sellingPriceRWF ?? selectedSaleProduct?.amountRWF) || 0;
  const saleQtyNum = qtyNum;
  const salePriceNum = unitPriceNum;
  const isSalePriceChanged = Boolean(
    selectedSaleProduct &&
    salePriceNum > 0 &&
    salePriceNum !== saleOriginalCatalogPrice
  );
  const saleTotalAmount = totalSaleAmount;
  const saleTotalProfit = totalProfit;
  const saleProfitMarginPct = profitMarginPct;

  const handleCreateSale = (e) => {
    e.preventDefault();
    if (!saleProductId || !selectedSaleProduct) return;
    if (qtyNum <= 0 || unitPriceNum <= 0) return;

    const effectiveUnit = selectedSaleProduct.unit || "piece";
    const custName = saleCustomerName.trim() || "Walk-in Client";
    const custPhone = saleCustomerPhone.trim();

    const salePayload = {
      title: `${qtyNum} ${effectiveUnit} × ${selectedSaleProduct.title}`,
      subPage: activePage || "All Sales",
      category: custPhone ? `${custName} (${custPhone})` : custName,
      account: salePaymentMethod,
      productId: selectedSaleProduct.id,
      productTitle: selectedSaleProduct.title,
      quantity: qtyNum,
      unit: effectiveUnit,
      unitPriceRWF: unitPriceNum,
      unitCostRWF: unitCostNum,
      amountRWF: totalSaleAmount,
      profitRWF: totalProfit,
      customer: custPhone ? `${custName} (${custPhone})` : custName,
      customerName: custName,
      customerPhone: custPhone,
      paymentMethod: salePaymentMethod,
      status: salePaymentStatus,
      type: "in",
      updateCatalogPrice: Boolean(saleUpdateCatalogPrice),
      newSellingPriceRWF: unitPriceNum,
      date: new Date().toISOString().split("T")[0]
    };

    if (onSaveSale) {
      onSaveSale(salePayload, selectedSaleProduct);
    }

    const isPaid = salePaymentStatus === "Paid in Full";
    const isPartial = salePaymentStatus === "Part-paid";
    const paidAmt = isPaid ? totalSaleAmount : (isPartial ? Math.round(totalSaleAmount / 2) : 0);
    const outstandingAmt = Math.max(0, totalSaleAmount - paidAmt);
    const invId = `INV-${Math.floor(100 + Math.random() * 900)}`;

    const newInvoiceDoc = {
      id: invId,
      type: "Invoice",
      title: `Commercial Tax Invoice #${invId}`,
      recipientName: custName,
      recipientPhone: custPhone,
      recipientEmail: "",
      amount: totalSaleAmount,
      paidAmount: paidAmt,
      outstandingAmount: outstandingAmt,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: outstandingAmt === 0 ? "Paid" : (paidAmt > 0 ? "Partial" : "Unpaid"),
      items: [
        {
          name: selectedSaleProduct.title,
          quantity: qtyNum,
          unit: effectiveUnit,
          unitPrice: unitPriceNum,
          total: totalSaleAmount
        }
      ],
      notes: `Sale recorded via ${salePaymentMethod}. Payment status: ${salePaymentStatus}.`
    };

    try {
      const existing = JSON.parse(localStorage.getItem("exbos_business_documents") || "[]");
      localStorage.setItem("exbos_business_documents", JSON.stringify([newInvoiceDoc, ...existing]));
    } catch {}

    setSavedSaleDoc(newInvoiceDoc);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
                  <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/15 p-5 sm:p-6 shrink-0 bg-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
                    <ShoppingBag className="w-5 h-5 text-[#9EDCFF]" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                      New sales
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Record a customer sale, auto-fill price &amp; track profit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                  }}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body or Success Invoice Actions */}
              {savedSaleDoc ? (
                <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white">
                      Sale Recorded Successfully
                    </h3>
                    <p className="text-xs text-slate-300">
                      Commercial Tax Invoice <span className="font-mono text-[#9EDCFF] font-bold">#{savedSaleDoc.id}</span> generated and synced with your ledger.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Customer:</span>
                      <strong className="text-white">{savedSaleDoc.recipientName}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Billed:</span>
                      <strong className="font-orbitron text-white text-sm">{formatRWF(savedSaleDoc.amount)}</strong>
                    </div>
                    {savedSaleDoc.outstandingAmount > 0 && (
                      <div className="flex justify-between items-center text-amber-300 pt-1.5 border-t border-white/10">
                        <span className="font-bold">Outstanding Balance:</span>
                        <strong className="font-orbitron font-bold text-sm">{formatRWF(savedSaleDoc.outstandingAmount)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: [View Invoice] [Send Invoice] [Download PDF] */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-2">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-4 h-4 text-[#218DFF]" />
                      <span>View Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSendOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadDocumentFile(savedSaleDoc)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="pt-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setSavedSaleDoc(null);
                        onClose();
                      }}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
                    >
                      Done &amp; Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleCreateSale} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                {/* 1. Select Recorded Product (Custom Dropdown Design) */}
                <div className="space-y-1.5 relative" ref={saleProductDropdownRef}>
                  <label className="block text-xs font-semibold text-slate-200">
                    {saleItemPickerConfig.label} <span className="text-rose-400">*</span>
                  </label>
                  
                  {/* Custom Dropdown Trigger Button matching existing design */}
                  <button
                    type="button"
                    onClick={() => setSaleProductDropdownOpen((prev) => !prev)}
                    style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-[#218DFF] focus:outline-none text-left"
                  >
                    {selectedSaleProduct ? (
                      <div className="flex items-center gap-2 truncate">
                        <Package className="w-4 h-4 text-[#218DFF] shrink-0" />
                        <span className="font-bold text-white truncate">{selectedSaleProduct.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono shrink-0">
                          {saleAvailableStock} {saleUnit} left
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] font-orbitron font-bold shrink-0">
                          {formatRWF(selectedSaleProduct.sellingPriceRWF || selectedSaleProduct.unitCostRWF || 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>{saleItemPickerConfig.placeholder}</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#218DFF] shrink-0 transition-transform duration-200 ${
                        saleProductDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Custom Dropdown Menu Panel */}
                  {saleProductDropdownOpen && (
                    <div className="spring-dropdown-panel absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[#06143b] border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(33,141,255,0.35)] z-50 p-2.5 max-h-72 flex flex-col space-y-2 backdrop-blur-xl">
                      {recordedProducts.length > 3 && (
                        <div className="relative shrink-0">
                          <Search className="w-3.5 h-3.5 text-[#218DFF] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={saleProductSearch}
                            onChange={(e) => setSaleProductSearch(e.target.value)}
                            placeholder={saleItemPickerConfig.searchPlaceholder}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#040C26] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      <div className="overflow-y-auto space-y-1 pr-1 max-h-56">
                        {filteredSaleProducts.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            No matching products found.
                          </div>
                        ) : (
                          filteredSaleProducts.map((p) => {
                            const isSelected = p.id === saleProductId
                            const pStock = Number(p.quantity) || 0
                            const pPrice = Number(p.sellingPriceRWF) || Number(p.unitCostRWF) || 0
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  handleSelectSaleProduct(p.id)
                                  setSaleProductDropdownOpen(false)
                                }}
                                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] border-[#9EDCFF]/60 text-white shadow-sapphire-glow'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-[#218DFF]/50 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-[#218DFF] shrink-0" />
                                    <span className="font-bold text-xs text-white truncate">{p.title}</span>
                                    {p.category && (
                                      <span className="text-[10px] text-slate-400 font-normal truncate">({p.category})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                                    <span className={pStock <= (Number(p.lowStockAlert) || 5) ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                                      Stock: {pStock} {p.unit || 'units'}
                                    </span>
                                    <span>•</span>
                                    <span>Cost: {formatRWF(p.purchasePriceRWF || p.unitCostRWF || 0)}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-orbitron font-extrabold text-xs text-[#9EDCFF]">
                                    {formatRWF(pPrice)}
                                  </div>
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                                      <Check className="w-3 h-3" /> Selected
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stock & Cost info pill if product selected */}
                  {selectedSaleProduct && (
                    <div className="flex flex-wrap items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#218DFF]" />
                        <span>In Stock: <strong className="text-white">{saleAvailableStock} {saleUnit}</strong></span>
                      </span>
                      <span>Unit Cost: <strong className="text-slate-200">{formatRWF(saleUnitCost)}</strong></span>
                      <span>Catalog Price: <strong className="text-[#9EDCFF]">{formatRWF(saleOriginalCatalogPrice)}</strong></span>
                    </div>
                  )}
                </div>

                {/* 2. Quantity & Selling Price per Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Quantity to sell <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(e.target.value)}
                        placeholder="e.g. 5"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full pl-3.5 pr-20 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9EDCFF] uppercase pointer-events-none">
                        {saleUnit}
                      </span>
                    </div>
                    {selectedSaleProduct && saleQtyNum > saleAvailableStock && (
                      <p className="text-[10px] text-amber-400 font-medium">
                        ⚠️ Note: {saleQtyNum} exceeds current stock ({saleAvailableStock} {saleUnit}).
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Selling price per unit <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={saleUnitPrice === '' ? '' : formatWithCommas(saleUnitPrice)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          setSaleUnitPrice(raw === '' ? '' : Number(raw))
                        }}
                        placeholder="0"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full pl-3.5 pr-14 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        RWF
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Price Changed Alert & Option to update catalog price or keep existing */}
                {isSalePriceChanged && (
                  <div className="p-3.5 rounded-2xl bg-[#071644] border-2 border-[#218DFF]/60 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-xs text-[#9EDCFF] font-bold">
                      <Info className="w-4 h-4 text-[#218DFF] shrink-0" />
                      <span>
                        Price adjusted from catalog ({formatRWF(saleOriginalCatalogPrice)}) to {formatRWF(salePriceNum)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                      <span className="text-slate-300 text-[11px]">
                        Update product catalog price for future sales?
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saleUpdateCatalogPrice}
                          onChange={(e) => setSaleUpdateCatalogPrice(e.target.checked)}
                          className="w-4 h-4 rounded text-[#218DFF] focus:ring-0 cursor-pointer accent-[#218DFF]"
                        />
                        <span className={`text-xs font-bold ${saleUpdateCatalogPrice ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {saleUpdateCatalogPrice ? 'Yes, update catalog' : 'No, keep catalog'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 4. Live Profit & Revenue Summary Card */}
                {saleTotalAmount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">Total Sale Amount:</span>
                      <span className="font-orbitron font-extrabold text-base text-white">
                        {formatRWF(saleTotalAmount)}
                      </span>
                    </div>

                    {/* Amount in words */}
                    <p className="text-[10px] text-[#9EDCFF] font-medium italic truncate">
                      {numberToWordsEnglish(saleTotalAmount)}
                    </p>

                    {/* Expected Profit Banner */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Expected Profit:</span>
                      </span>
                      <span className="font-orbitron font-extrabold text-sm text-emerald-400">
                        {saleTotalProfit >= 0 ? '+' : ''}{formatRWF(saleTotalProfit)} ({saleProfitMarginPct}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. Customer Details: Name & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={saleCustomerName}
                      onChange={(e) => setSaleCustomerName(e.target.value)}
                      placeholder="e.g. Patrick Mugabo or Walk-in Client"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Customer Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={saleCustomerPhone}
                      onChange={(e) => setSaleCustomerPhone(e.target.value)}
                      placeholder="e.g. +250 788 123 456"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 6. Payment Method & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Payment Method
                    </label>
                    <CustomSelect
                      value={salePaymentMethod}
                      onChange={setSalePaymentMethod}
                      options={[
                        "MTN MoMo Business",
                        "Cash",
                        "Airtel Money",
                        "Bank Transfer (BK / BPR)"
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Payment Status
                    </label>
                    <select
                      value={salePaymentStatus}
                      onChange={(e) => setSalePaymentStatus(e.target.value)}
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Paid in Full" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Paid in Full</option>
                      <option value="Unpaid (Credit Book / Debt)" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Unpaid (Credit Book / Debt)</option>
                      <option value="Part-paid" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Part-paid</option>
                    </select>
                  </div>
                </div>

                {/* Credit / Outstanding Debt Warning Banner */}
                {salePaymentStatus !== 'Paid in Full' && (
                  <div className="p-3.5 rounded-2xl bg-[#0d2354] border-2 border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)] flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-amber-300 flex items-center gap-2">
                        <span>Notice: Credit Book &amp; Debt Ledger Sync</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono text-amber-300 uppercase">
                          {salePaymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        Because this sale is not paid in full ({salePaymentStatus}), the system will automatically add{' '}
                        <strong className="text-white font-semibold">
                          {saleCustomerName.trim() || 'this customer'}
                        </strong>{' '}
                        to{' '}
                        <strong className="text-amber-300 font-semibold">
                          "Who Owes You Money" (Customer Debt Ledger)
                        </strong>{' '}
                        with an outstanding balance of{' '}
                        <strong className="text-white font-orbitron font-bold">
                          {formatRWF(saleTotalAmount)}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                )}

                </div>

                {/* Modal Footer Actions (Pinned at Bottom) */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/15 shrink-0 bg-[#040C26]/90">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Check className="w-4 h-4 text-[#9EDCFF]" />
                    <span>
                      {saleTotalAmount > 0 ? `Record Sale (${formatRWF(saleTotalAmount)})` : 'Record Sale'}
                    </span>
                  </button>
                </div>
              </form>
              )}
            </div>

      {/* Linked Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        document={savedSaleDoc}
        onOpenSendModal={() => {
          setPreviewOpen(false);
          setSendOpen(true);
        }}
      />

      {/* Linked Document Sending Modal */}
      <SendDocumentModal
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        document={savedSaleDoc}
      />
    </div>
  );
}
