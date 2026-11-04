import React, { useState, useEffect, useMemo, useRef } from "react";
import { Truck, Package, ChevronDown, Search, Plus, Calendar, Phone, MapPin, AlertTriangle, Check, X } from "lucide-react";
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from "../../../utils/currencyWords";
import CustomSelect from "../../common/CustomSelect";

export default function PurchaseModal({
  isOpen,
  onClose,
  recordedProducts = [],
  existingSuppliers = [],
  activeArchId = "buy-and-sell",
  activeModule = "Purchases",
  currentArch = { shortName: "Retail" },
  activePage = "Purchases",
  onSavePurchase
}) {
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseItemTitle, setPurchaseItemTitle] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("10");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseUnit, setPurchaseUnit] = useState("piece");
  const [purchaseExpiryDate, setPurchaseExpiryDate] = useState("");
  const [purchaseSupplierName, setPurchaseSupplierName] = useState("");
  const [purchaseSupplierPhone, setPurchaseSupplierPhone] = useState("");
  const [purchaseSupplierLocation, setPurchaseSupplierLocation] = useState("");
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState("Paid in Full");
  const [purchaseAmountPaid, setPurchaseAmountPaid] = useState("");
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("MTN MoMo Business");
  const [purchaseAutoRestock, setPurchaseAutoRestock] = useState(true);

  const purchaseQuantity = purchaseQty;
  const setPurchaseQuantity = setPurchaseQty;
  const purchaseUnitCost = purchaseCost;
  const setPurchaseUnitCost = setPurchaseCost;
  const purchasePaidAmount = purchaseAmountPaid;
  const setPurchasePaidAmount = setPurchaseAmountPaid;

  const purchaseItemPickerConfig = useMemo(() => {
    switch (activeArchId) {
      case 'make-and-sell':
        return {
          label: 'Raw Material to Purchase',
          placeholder: '-- Select raw material or enter ingredient/input --',
          searchPlaceholder: 'Search raw materials (flour, butter, yeast)...',
          badge: 'Raw Material'
        };
      case 'agriculture':
      case 'agriculture-livestock':
        return {
          label: 'Feed, Farm Inputs, or Animals to Purchase',
          placeholder: '-- Select feed type, fertilizer, seeds or livestock --',
          searchPlaceholder: 'Search animal feed, seeds, vet medicine, fertilizer...',
          badge: 'Farm Input / Feed'
        };
      case 'food-hospitality':
        return {
          label: 'Kitchen Ingredients & Supplies to Purchase',
          placeholder: '-- Select kitchen ingredient or room supplies --',
          searchPlaceholder: 'Search ingredients, vegetables, meat, beverages...',
          badge: 'Kitchen Ingredient'
        };
      default:
        return {
          label: 'Select Product / Inventory Item to Purchase',
          placeholder: '-- Select product to restock or enter description --',
          searchPlaceholder: 'Search products by name or SKU...',
          badge: 'Product'
        };
    }
  }, [activeArchId]);

  const [purchaseProductDropdownOpen, setPurchaseProductDropdownOpen] = useState(false);
  const [purchaseProductSearch, setPurchaseProductSearch] = useState("");
  const [purchaseSupplierDropdownOpen, setPurchaseSupplierDropdownOpen] = useState(false);
  const [purchaseSupplierSearch, setPurchaseSupplierSearch] = useState("");

  const purchaseProductDropdownRef = useRef(null);
  const purchaseSupplierDropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setPurchaseProductId("");
      setPurchaseItemTitle("");
      setPurchaseQty("10");
      setPurchaseCost("");
      setPurchaseUnit("piece");
      setPurchaseExpiryDate("");
      setPurchaseSupplierName("");
      setPurchaseSupplierPhone("");
      setPurchaseSupplierLocation("");
      setPurchasePaymentStatus("Paid in Full");
      setPurchaseAmountPaid("");
      setPurchasePaymentMethod("MTN MoMo Business");
      setPurchaseProductDropdownOpen(false);
      setPurchaseSupplierDropdownOpen(false);
    }
  }, [isOpen]);

  // Click outside handlers
  useEffect(() => {
    const handleOutside = (e) => {
      if (purchaseProductDropdownRef.current && !purchaseProductDropdownRef.current.contains(e.target)) {
        setPurchaseProductDropdownOpen(false);
      }
      if (purchaseSupplierDropdownRef.current && !purchaseSupplierDropdownRef.current.contains(e.target)) {
        setPurchaseSupplierDropdownOpen(false);
      }
    };
    if (purchaseProductDropdownOpen || purchaseSupplierDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [purchaseProductDropdownOpen, purchaseSupplierDropdownOpen]);

  const selectedPurchaseProduct = useMemo(() => {
    return (recordedProducts || []).find((p) => p.id === purchaseProductId) || null;
  }, [recordedProducts, purchaseProductId]);

  const filteredPurchaseProducts = useMemo(() => {
    const list = recordedProducts || [];
    if (!purchaseProductSearch.trim()) return list;
    const q = purchaseProductSearch.toLowerCase();
    return list.filter((p) => (p.title && p.title.toLowerCase().includes(q)) || (p.sku && p.sku.toLowerCase().includes(q)));
  }, [recordedProducts, purchaseProductSearch]);

  const filteredSuppliers = useMemo(() => {
    const list = existingSuppliers || [];
    if (!purchaseSupplierSearch.trim()) return list;
    const q = purchaseSupplierSearch.toLowerCase();
    return list.filter((s) => (s.title && s.title.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q)));
  }, [existingSuppliers, purchaseSupplierSearch]);

  const handleSelectProduct = (prod) => {
    setPurchaseProductId(prod.id);
    setPurchaseItemTitle(prod.title);
    setPurchaseCost(prod.purchasePriceRWF ? String(prod.purchasePriceRWF) : (prod.unitCostRWF ? String(prod.unitCostRWF) : ""));
    setPurchaseUnit(prod.unit || "piece");
    setPurchaseProductDropdownOpen(false);
  };

  const handleSelectPurchaseProduct = (prodId) => {
    const prod = (recordedProducts || []).find((p) => p.id === prodId);
    if (prod) {
      handleSelectProduct(prod);
    }
  };

  const handleSelectSupplier = (sup) => {
    setPurchaseSupplierName(sup.supplierName || sup.name || sup.title || "");
    setPurchaseSupplierPhone(sup.phone && sup.phone !== "—" ? sup.phone : "");
    setPurchaseSupplierLocation(sup.location || "");
    setPurchaseSupplierDropdownOpen(false);
  };

  const purchaseQtyNum = Number(purchaseQty) || 0;
  const purchaseCostNum = parseNumericInput(purchaseCost) || 0;
  const purchaseTotalAmount = purchaseQtyNum * purchaseCostNum;

  const purchasePaidAmountNum = useMemo(() => {
    if (purchasePaymentStatus === "Paid in Full") return purchaseTotalAmount;
    if (purchasePaymentStatus === "Unpaid") return 0;
    return Math.min(purchaseTotalAmount, Math.max(0, parseNumericInput(purchaseAmountPaid) || 0));
  }, [purchasePaymentStatus, purchaseTotalAmount, purchaseAmountPaid]);

  const purchaseRemainingAmount = Math.max(0, purchaseTotalAmount - purchasePaidAmountNum);

  const handleCreatePurchase = (e) => {
    e.preventDefault();
    const effectiveTitle = selectedPurchaseProduct ? selectedPurchaseProduct.title : purchaseItemTitle.trim();
    if (!effectiveTitle || purchaseQtyNum <= 0 || purchaseCostNum <= 0 || !purchaseSupplierName.trim()) return;

    const sName = purchaseSupplierName.trim();
    const sPhone = purchaseSupplierPhone.trim();
    const sLocation = purchaseSupplierLocation.trim();
    const sStatus = purchasePaymentStatus === "Paid in Full"
      ? "Paid in Full"
      : purchasePaymentStatus === "Part-paid"
      ? `Part-paid · ${formatRWF(purchaseRemainingAmount)} Remaining`
      : `Unpaid · ${formatRWF(purchaseTotalAmount)} Remaining`;

    const purchasePayload = {
      title: `${purchaseQtyNum} ${purchaseUnit} × ${effectiveTitle}`,
      productTitle: effectiveTitle,
      productId: selectedPurchaseProduct ? selectedPurchaseProduct.id : undefined,
      quantity: purchaseQtyNum,
      unit: purchaseUnit,
      unitPriceRWF: purchaseCostNum,
      amountRWF: purchaseTotalAmount,
      paidAmountRWF: purchasePaidAmountNum,
      remainingAmountRWF: purchaseRemainingAmount,
      supplier: sPhone ? `${sName} (${sPhone})` : sName,
      supplierName: sName,
      supplierPhone: sPhone,
      supplierLocation: sLocation,
      subPage: activePage || "All Purchases",
      category: sName,
      account: purchasePaymentMethod,
      paymentMethod: purchasePaymentMethod,
      paymentStatus: purchasePaymentStatus,
      expiryDate: purchaseExpiryDate || undefined,
      status: sStatus,
      type: "out",
      date: new Date().toISOString().split("T")[0]
    };

    if (onSavePurchase) {
      onSavePurchase(purchasePayload, selectedPurchaseProduct, purchaseRemainingAmount);
    }
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
                    <Truck className="w-5 h-5 text-[#9EDCFF]" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                      {activeModule === 'Products' && activePage === 'Stock' ? 'Receive Stock' : 'New purchase'}
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      {activeModule === 'Products' && activePage === 'Stock'
                        ? 'Receive supplier stock batch, update inventory & set optional expiry date'
                        : 'Record supplier invoice, add vendor details & track payments'}
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

              {/* Form Body */}
              <form onSubmit={handleCreatePurchase} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                {/* 1. Product Selection: From recorded products or custom description */}
                <div className="space-y-1.5 relative" ref={purchaseProductDropdownRef}>
                  <label className="block text-xs font-semibold text-slate-200">
                    {purchaseItemPickerConfig.label} <span className="text-rose-400">*</span>
                  </label>

                  {/* Dropdown trigger */}
                  <button
                    type="button"
                    onClick={() => setPurchaseProductDropdownOpen((prev) => !prev)}
                    style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-[#218DFF] focus:outline-none text-left"
                  >
                    {selectedPurchaseProduct ? (
                      <div className="flex items-center gap-2 truncate">
                        <Package className="w-4 h-4 text-[#218DFF] shrink-0" />
                        <span className="font-bold text-white truncate">{selectedPurchaseProduct.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] font-mono shrink-0">
                          {selectedPurchaseProduct.quantity || 0} in stock
                        </span>
                      </div>
                    ) : purchaseItemTitle ? (
                      <div className="flex items-center gap-2 truncate text-white">
                        <Package className="w-4 h-4 text-[#218DFF] shrink-0" />
                        <span className="font-bold truncate">{purchaseItemTitle}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>{purchaseItemPickerConfig.placeholder}</span>
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[#218DFF] shrink-0 transition-transform duration-200 ${
                        purchaseProductDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {purchaseProductDropdownOpen && (
                    <div className="spring-dropdown-panel absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[#06143b] border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(33,141,255,0.35)] z-50 p-2.5 max-h-72 flex flex-col space-y-2 backdrop-blur-xl">
                      <div className="relative shrink-0">
                        <Search className="w-3.5 h-3.5 text-[#218DFF] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={purchaseProductSearch}
                          onChange={(e) => setPurchaseProductSearch(e.target.value)}
                          placeholder={purchaseItemPickerConfig.searchPlaceholder}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#040C26] border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {purchaseProductSearch.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setPurchaseProductId('')
                            setPurchaseItemTitle(purchaseProductSearch.trim())
                            setPurchaseProductDropdownOpen(false)
                          }}
                          className="w-full text-left p-2 rounded-xl bg-[#218DFF]/15 border border-[#218DFF]/40 text-[#9EDCFF] hover:bg-[#218DFF]/25 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Use "{purchaseProductSearch.trim()}" as custom item</span>
                        </button>
                      )}

                      <div className="overflow-y-auto space-y-1 pr-1 max-h-48">
                        {filteredPurchaseProducts.map((p) => {
                          const isSelected = p.id === purchaseProductId
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPurchaseProduct(p.id)}
                              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] border-[#9EDCFF]/60 text-white shadow-sapphire-glow'
                                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-[#218DFF]/50 text-slate-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-xs text-white block truncate">{p.title}</span>
                                <span className="text-[10px] text-slate-300">
                                  Current stock: {p.quantity || 0} {p.unit || 'units'}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-orbitron font-extrabold text-xs text-[#9EDCFF] block">
                                  {formatRWF(p.purchasePriceRWF || p.unitCostRWF || 0)}
                                </span>
                                <span className="text-[9px] text-slate-400">Unit Cost</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!selectedPurchaseProduct && (
                    <input
                      type="text"
                      value={purchaseItemTitle}
                      onChange={(e) => setPurchaseItemTitle(e.target.value)}
                      placeholder="Or enter item description (e.g. Cimerwa Cement 50kg Bags)"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none mt-1"
                    />
                  )}
                </div>

                {/* 2. Quantity & Unit Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Quantity to purchase <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        value={purchaseQuantity}
                        onChange={(e) => setPurchaseQuantity(e.target.value)}
                        placeholder="e.g. 50"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                      />
                      <CustomSelect
                        value={purchaseUnit}
                        onChange={setPurchaseUnit}
                        className="w-32 shrink-0"
                        options={[
                          { value: "piece", label: "piece" },
                          { value: "bag", label: "bag" },
                          { value: "box", label: "box" },
                          { value: "kg", label: "kg" },
                          { value: "meter", label: "meter" },
                          { value: "liter", label: "liter" },
                          { value: "bucket", label: "bucket" },
                          { value: "roll", label: "roll" },
                          { value: "unit", label: "unit" }
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Purchase cost per unit <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={purchaseUnitCost === '' ? '' : formatWithCommas(purchaseUnitCost)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          setPurchaseUnitCost(raw === '' ? '' : Number(raw))
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

                {/* 3. Total Valuation Card */}
                {purchaseTotalAmount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">Total Purchase Cost:</span>
                      <span className="font-orbitron font-extrabold text-base text-white">
                        {formatRWF(purchaseTotalAmount)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9EDCFF] font-medium italic truncate">
                      {numberToWordsEnglish(purchaseTotalAmount)}
                    </p>
                  </div>
                )}

                {/* 3b. Batch Expiry Date (Optional, Section 4 of Architecture Guide) */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#218DFF]" />
                      <span>Batch Expiry Date</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Optional (leave blank if non-perishable)
                    </span>
                  </div>
                  <input
                    type="date"
                    value={purchaseExpiryDate}
                    onChange={(e) => setPurchaseExpiryDate(e.target.value)}
                    style={{ backgroundColor: '#071644', color: '#ffffff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                  />
                </div>

                {/* 4. Supplier Information (Explicitly Requested: Supplier Name, Phone Number, Location) */}
                <div className="space-y-2 pt-1 border-t border-white/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>Supplier / Vendor Information</span>
                  </span>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Supplier Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={purchaseSupplierName}
                      onChange={(e) => setPurchaseSupplierName(e.target.value)}
                      placeholder="e.g. Cimerwa Depot Kigali, Inyange Industries, Bakhresa"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#218DFF]" />
                        <span>Phone Number <span className="text-slate-400 font-normal">(Optional)</span></span>
                      </label>
                      <input
                        type="tel"
                        value={purchaseSupplierPhone}
                        onChange={(e) => setPurchaseSupplierPhone(e.target.value)}
                        placeholder="e.g. +250 788 554 221"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#218DFF]" />
                        <span>Location / Address <span className="text-slate-400 font-normal">(Optional)</span></span>
                      </label>
                      <input
                        type="text"
                        value={purchaseSupplierLocation}
                        onChange={(e) => setPurchaseSupplierLocation(e.target.value)}
                        placeholder="e.g. Gikondo Industrial Zone, Kigali"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Payment Method & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Payment Method
                    </label>
                    <CustomSelect
                      value={purchasePaymentMethod}
                      onChange={setPurchasePaymentMethod}
                      options={[
                        "MTN MoMo Business",
                        "Cash",
                        "Airtel Money",
                        "Bank Transfer (BK / BPR)",
                        "Supplier Credit Account"
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Payment Status
                    </label>
                    <select
                      value={purchasePaymentStatus}
                      onChange={(e) => setPurchasePaymentStatus(e.target.value)}
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Paid in Full" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Paid in Full</option>
                      <option value="Unpaid (Supplier Credit / Debt)" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Unpaid (Supplier Credit / Debt)</option>
                      <option value="Part-paid" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Part-paid</option>
                    </select>
                  </div>
                </div>

                {/* Part-paid amount paid input */}
                {purchasePaymentStatus === 'Part-paid' && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-200">
                      Amount Paid Now (RWF)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={purchasePaidAmount === '' ? '' : formatWithCommas(purchasePaidAmount)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          setPurchasePaidAmount(raw === '' ? '' : Number(raw))
                        }}
                        placeholder="e.g. 200,000"
                        style={{ backgroundColor: '#071644', color: '#ffffff' }}
                        className="w-full pl-3.5 pr-14 py-2 rounded-xl exbos-modal-input text-xs text-white font-orbitron font-bold focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        RWF
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-300 pt-1">
                      <span>Remaining Unpaid Balance to Pay:</span>
                      <strong className="font-orbitron font-bold">{formatRWF(purchaseRemainingAmount)}</strong>
                    </div>
                  </div>
                )}

                {/* Credit / Debt Warning Banner */}
                {purchaseRemainingAmount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#0d2354] border-2 border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)] flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-amber-300 flex items-center gap-2">
                        <span>Notice: Accounts Payable &amp; Supplier Debt Sync</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono text-amber-300 uppercase">
                          {purchasePaymentStatus}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] leading-relaxed">
                        Because this purchase is not paid in full, the system will automatically add{' '}
                        <strong className="text-white font-semibold">
                          {purchaseSupplierName.trim() || 'this supplier'}
                        </strong>{' '}
                        to{' '}
                        <strong className="text-amber-300 font-semibold">
                          "You Owe Money" (Supplier Balances / Amounts Owed)
                        </strong>{' '}
                        with an outstanding balance of{' '}
                        <strong className="text-white font-orbitron font-bold">
                          {formatRWF(purchaseRemainingAmount)}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. Auto-restock toggle */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      Auto-Restock Inventory
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Automatically add {purchaseQtyNum} {purchaseUnit} to current stock
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={purchaseAutoRestock}
                    onChange={(e) => setPurchaseAutoRestock(e.target.checked)}
                    className="w-4 h-4 rounded text-[#218DFF] focus:ring-0 cursor-pointer accent-[#218DFF]"
                  />
                </div>

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
                    className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-[#9EDCFF]" />
                    <span>
                      {activeModule === 'Products' && activePage === 'Stock'
                        ? (purchaseTotalAmount > 0 ? `Receive Stock (${formatRWF(purchaseTotalAmount)})` : 'Receive Stock')
                        : purchaseTotalAmount > 0
                        ? `Record Purchase (${formatRWF(purchaseTotalAmount)})`
                        : 'Record Purchase'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
    </div>
  );
}
