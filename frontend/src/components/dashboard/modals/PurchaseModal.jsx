import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Truck,
  Package,
  ChevronDown,
  Search,
  Plus,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  Check,
  X,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from "../../../utils/currencyWords";
import { assessPurchaseDecision } from "../../../utils/financialIntelligenceEngine";
import { useExbos } from "../../../context/ExbosContext";
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
  editRow = null,
  onSavePurchase
}) {
  const { demoWorkspaces = {}, transactions = [] } = useExbos();
  const activeWorkspace = demoWorkspaces?.[activeArchId] || {};

  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseItemTitle, setPurchaseItemTitle] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("10");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseUnit, setPurchaseUnit] = useState("piece");
  const [purchaseTaxRWF, setPurchaseTaxRWF] = useState("");
  const [purchaseExtraChargesRWF, setPurchaseExtraChargesRWF] = useState("");
  const [purchaseExpiryDate, setPurchaseExpiryDate] = useState("");
  const [purchaseSupplierName, setPurchaseSupplierName] = useState("");
  const [purchaseSupplierPhone, setPurchaseSupplierPhone] = useState("");
  const [purchaseSupplierLocation, setPurchaseSupplierLocation] = useState("");
  const [purchasePaymentStatus, setPurchasePaymentStatus] = useState("Paid in Full");
  const [purchaseAmountPaid, setPurchaseAmountPaid] = useState("");
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("MTN MoMo Business");
  const [purchaseDeliveryStatus, setPurchaseDeliveryStatus] = useState("Received");
  const [purchaseReceivedQty, setPurchaseReceivedQty] = useState("10");
  const [purchaseAutoRestock, setPurchaseAutoRestock] = useState(true);

  // Side money / external owner funds top-up state ("I have other side money I can add to afford")
  const [showSideMoneyBox, setShowSideMoneyBox] = useState(false);
  const [sideMoneyAmount, setSideMoneyAmount] = useState("");
  const [sideMoneySource, setSideMoneySource] = useState("Owner Personal / Side Funds Top-Up");

  const purchaseQuantity = purchaseQty;
  const setPurchaseQuantity = setPurchaseQty;
  const purchaseUnitCost = purchaseCost;
  const setPurchaseUnitCost = setPurchaseCost;
  const purchasePaidAmount = purchaseAmountPaid;
  const setPurchasePaidAmount = setPurchaseAmountPaid;

  const purchaseItemPickerConfig = useMemo(() => {
    switch (activeArchId) {
      case "make-and-sell":
        return {
          label: "Raw Material to Purchase",
          placeholder: "-- Select raw material or enter ingredient/input --",
          searchPlaceholder: "Search raw materials (flour, butter, yeast)...",
          badge: "Raw Material"
        };
      case "agriculture":
      case "agriculture-livestock":
        return {
          label: "Feed, Farm Inputs, or Animals to Purchase",
          placeholder: "-- Select feed type, fertilizer, seeds or livestock --",
          searchPlaceholder: "Search animal feed, seeds, vet medicine, fertilizer...",
          badge: "Farm Input / Feed"
        };
      case "food-hospitality":
      case "food-and-hospitality":
        return {
          label: "Kitchen Ingredients & Supplies to Purchase",
          placeholder: "-- Select kitchen ingredient or room supplies --",
          searchPlaceholder: "Search ingredients, vegetables, meat, beverages...",
          badge: "Kitchen Ingredient"
        };
      default:
        return {
          label: "Select Product / Inventory Item to Purchase",
          placeholder: "-- Select product to restock or enter description --",
          searchPlaceholder: "Search products by name or SKU...",
          badge: "Product"
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
      setPurchaseTaxRWF("");
      setPurchaseExtraChargesRWF("");
      setPurchaseExpiryDate("");
      setPurchaseSupplierName("");
      setPurchaseSupplierPhone("");
      setPurchaseSupplierLocation("");
      setPurchasePaymentStatus("Paid in Full");
      setPurchaseAmountPaid("");
      setPurchasePaymentMethod("MTN MoMo Business");
      setPurchaseDeliveryStatus("Received");
      setPurchaseReceivedQty("10");
      setPurchaseAutoRestock(true);
      setShowSideMoneyBox(false);
      setSideMoneyAmount("");
      setSideMoneySource("Owner Personal / Side Funds Top-Up");
      setPurchaseProductDropdownOpen(false);
      setPurchaseSupplierDropdownOpen(false);
    } else if (editRow) {
      setPurchaseProductId(editRow.productId || "");
      setPurchaseItemTitle(editRow.productTitle || editRow.title || "");
      setPurchaseQty(String(editRow.orderedQuantity || editRow.quantity || 10));
      setPurchaseCost(String(editRow.unitPriceRWF || editRow.purchasePriceRWF || ""));
      setPurchaseUnit(editRow.unit || "piece");
      setPurchaseTaxRWF(editRow.taxAmountRWF ? String(editRow.taxAmountRWF) : "");
      setPurchaseExtraChargesRWF(editRow.additionalChargesRWF ? String(editRow.additionalChargesRWF) : "");
      setPurchaseExpiryDate(editRow.expiryDate || "");
      setPurchaseSupplierName(editRow.supplierName || editRow.supplier || "");
      setPurchaseSupplierPhone(editRow.supplierPhone || "");
      setPurchaseSupplierLocation(editRow.supplierLocation || "");
      setPurchasePaymentStatus(editRow.paymentStatus || "Paid in Full");
      setPurchaseAmountPaid(editRow.paidAmountRWF !== undefined ? String(editRow.paidAmountRWF) : "");
      setPurchasePaymentMethod(editRow.paymentMethod || "MTN MoMo Business");
      const deliv = editRow.deliveryStatus || "Received";
      setPurchaseDeliveryStatus(deliv);
      setPurchaseReceivedQty(String(editRow.receivedQuantity ?? editRow.quantity ?? 10));
      setPurchaseAutoRestock(deliv !== "Ordered");
    }
  }, [isOpen, editRow]);

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
    return list.filter(
      (p) => (p.title && p.title.toLowerCase().includes(q)) || (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [recordedProducts, purchaseProductSearch]);

  const filteredSuppliers = useMemo(() => {
    const list = existingSuppliers || [];
    if (!purchaseSupplierSearch.trim()) return list;
    const q = purchaseSupplierSearch.toLowerCase();
    return list.filter(
      (s) => (s.title && s.title.toLowerCase().includes(q)) || (s.name && s.name.toLowerCase().includes(q))
    );
  }, [existingSuppliers, purchaseSupplierSearch]);

  const handleSelectProduct = (prod) => {
    setPurchaseProductId(prod.id);
    setPurchaseItemTitle(prod.title);
    setPurchaseCost(
      prod.purchasePriceRWF ? String(prod.purchasePriceRWF) : prod.unitCostRWF ? String(prod.unitCostRWF) : ""
    );
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
  const purchaseTaxNum = parseNumericInput(purchaseTaxRWF) || 0;
  const purchaseExtraNum = parseNumericInput(purchaseExtraChargesRWF) || 0;
  const sideMoneyNum = parseNumericInput(sideMoneyAmount) || 0;

  const purchaseSubtotalAmount = purchaseQtyNum * purchaseCostNum;
  const purchaseTotalAmount = purchaseSubtotalAmount + purchaseTaxNum + purchaseExtraNum;

  const purchasePaidAmountNum = useMemo(() => {
    if (purchasePaymentStatus === "Paid in Full") return purchaseTotalAmount;
    if (purchasePaymentStatus.startsWith("Unpaid") || purchasePaymentMethod === "Supplier Credit Account") return 0;
    return Math.min(purchaseTotalAmount, Math.max(0, parseNumericInput(purchaseAmountPaid) || 0));
  }, [purchasePaymentStatus, purchasePaymentMethod, purchaseTotalAmount, purchaseAmountPaid]);

  const purchaseRemainingAmount = Math.max(0, purchaseTotalAmount - purchasePaidAmountNum);

  const effectiveReceivedQty = useMemo(() => {
    if (purchaseDeliveryStatus === "Ordered") return 0;
    if (purchaseDeliveryStatus === "Partially Received") {
      return Math.min(purchaseQtyNum, Math.max(0, Number(purchaseReceivedQty) || 0));
    }
    return purchaseQtyNum;
  }, [purchaseDeliveryStatus, purchaseQtyNum, purchaseReceivedQty]);

  // Live Intelligent Financial & Stock Assessment (updates immediately as user types)
  const liveAssessment = useMemo(() => {
    const effectiveTitle = selectedPurchaseProduct ? selectedPurchaseProduct.title : purchaseItemTitle.trim();
    return assessPurchaseDecision({
      draftPurchase: {
        id: editRow?.id,
        productId: selectedPurchaseProduct?.id || purchaseProductId,
        productTitle: effectiveTitle,
        quantity: purchaseQtyNum,
        unit: purchaseUnit,
        unitPriceRWF: purchaseCostNum,
        taxAmountRWF: purchaseTaxNum,
        additionalChargesRWF: purchaseExtraNum,
        paymentStatus: purchasePaymentStatus,
        paymentMethod: purchasePaymentMethod,
        paidAmountRWF: purchasePaidAmountNum,
        deliveryStatus: purchaseDeliveryStatus,
        receivedQuantity: effectiveReceivedQty,
        supplierName: purchaseSupplierName.trim(),
        sideMoneyAddedRWF: sideMoneyNum
      },
      workspace: activeWorkspace,
      transactions,
      archId: activeArchId,
      catalogProducts: recordedProducts
    });
  }, [
    editRow,
    selectedPurchaseProduct,
    purchaseProductId,
    purchaseItemTitle,
    purchaseQtyNum,
    purchaseUnit,
    purchaseCostNum,
    purchaseTaxNum,
    purchaseExtraNum,
    purchasePaymentStatus,
    purchasePaymentMethod,
    purchasePaidAmountNum,
    purchaseDeliveryStatus,
    effectiveReceivedQty,
    purchaseSupplierName,
    sideMoneyNum,
    activeWorkspace,
    transactions,
    activeArchId,
    recordedProducts
  ]);

  const handleApplyAlternative = (alt) => {
    if (alt.action === "REDUCE_QUANTITY" && alt.suggestedQuantity > 0) {
      setPurchaseQty(String(alt.suggestedQuantity));
      setPurchaseReceivedQty(String(alt.suggestedQuantity));
    } else if (alt.action === "ADD_SIDE_MONEY") {
      setShowSideMoneyBox(true);
      setSideMoneyAmount(String(alt.suggestedSideMoneyRWF || liveAssessment.affordability.purchaseShortfallRWF));
    } else if (alt.action === "PARTIAL_CREDIT") {
      setPurchasePaymentStatus("Part-paid");
      setPurchaseAmountPaid(String(alt.suggestedPaidAmountRWF || 0));
    } else if (alt.action === "SAVE_AS_PO") {
      setPurchaseDeliveryStatus("Ordered");
      setPurchaseAutoRestock(false);
      setPurchasePaymentStatus("Unpaid (Supplier Credit / Debt)");
      setPurchaseAmountPaid("0");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const effectiveTitle = selectedPurchaseProduct ? selectedPurchaseProduct.title : purchaseItemTitle.trim();
    if (!effectiveTitle || purchaseQtyNum <= 0 || purchaseCostNum <= 0 || !purchaseSupplierName.trim()) return;
    setIsSubmitting(true);
    try {

    const sName = purchaseSupplierName.trim();
    const sPhone = purchaseSupplierPhone.trim();
    const sLocation = purchaseSupplierLocation.trim();
    const sStatus =
      purchaseDeliveryStatus === "Ordered" && purchasePaidAmountNum === 0
        ? `PO Ordered · ${formatRWF(purchaseTotalAmount)} Committed`
        : purchasePaymentStatus === "Paid in Full"
        ? "Paid in Full"
        : purchasePaymentStatus === "Part-paid"
        ? `Part-paid · ${formatRWF(purchaseRemainingAmount)} Remaining`
        : `Unpaid · ${formatRWF(purchaseTotalAmount)} Remaining`;

    const purchasePayload = {
      ...(editRow || {}),
      title: `${purchaseQtyNum} ${purchaseUnit} × ${effectiveTitle}`,
      productTitle: effectiveTitle,
      productId: selectedPurchaseProduct ? selectedPurchaseProduct.id : undefined,
      quantity: purchaseQtyNum,
      orderedQuantity: purchaseQtyNum,
      receivedQuantity: effectiveReceivedQty,
      deliveryStatus: purchaseDeliveryStatus,
      autoRestock: purchaseDeliveryStatus !== "Ordered",
      unit: purchaseUnit,
      unitPriceRWF: purchaseCostNum,
      subtotalRWF: purchaseSubtotalAmount,
      taxAmountRWF: purchaseTaxNum,
      additionalChargesRWF: purchaseExtraNum,
      amountRWF: purchaseTotalAmount,
      totalAmountRWF: purchaseTotalAmount,
      paidAmountRWF: purchasePaidAmountNum,
      remainingAmountRWF: purchaseRemainingAmount,
      sideMoneyAddedRWF: sideMoneyNum > 0 ? sideMoneyNum : undefined,
      sideMoneySource: sideMoneyNum > 0 ? sideMoneySource : undefined,
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
      date: editRow?.date || new Date().toISOString().split("T")[0]
    };

    if (onSavePurchase) {
      await Promise.resolve(onSavePurchase(purchasePayload, selectedPurchaseProduct, purchaseRemainingAmount));
    }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const { product: prodIntel, pricing: priceIntel, affordability: affordIntel, recommendations, alternatives } =
    liveAssessment;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[94vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-4 sm:p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
              <Truck className="w-5 h-5 text-[#9EDCFF]" />
            </div>
            <div>
              <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                {editRow
                  ? "Update Purchase / Receive Delivery"
                  : activeModule === "Products" && activePage === "Stock"
                  ? "Receive Stock"
                  : "Intelligent Purchase & Restock"}
              </h3>
              <p className="text-[11px] text-slate-300">
                Live stock velocity, open PO check &amp; real-time purchasing budget affordability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreatePurchase} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
            {/* Top Live Financial Awareness Strip */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#040C26]/90 border border-[#218DFF]/35">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Available Cash
                </span>
                <span className="font-orbitron font-bold text-xs sm:text-sm text-white">
                  {formatRWF(affordIntel.availableBusinessCashRWF)}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {affordIntel.selectedChannel}: {formatRWF(affordIntel.selectedChannelBalanceRWF)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Reserved + POs
                </span>
                <span className="font-orbitron font-bold text-xs sm:text-sm text-amber-300">
                  {formatRWF(
                    affordIntel.reservedOperationalFundsRWF + affordIntel.existingPurchaseCommitmentsRWF
                  )}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Ops Reserve &amp; Commitments
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#9EDCFF] block font-bold">
                  Purchasing Budget
                </span>
                <span
                  className={`font-orbitron font-extrabold text-xs sm:text-sm ${
                    affordIntel.isAffordable ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatRWF(affordIntel.effectivePurchasingBudgetRWF)}
                </span>
                <span className="text-[9px] text-slate-300 block">
                  {sideMoneyNum > 0 ? `Includes +${formatRWF(sideMoneyNum)} side funds` : "Safe to spend now"}
                </span>
              </div>
            </div>

            {/* 1. Product Selection */}
            <div className="space-y-1.5 relative" ref={purchaseProductDropdownRef}>
              <label className="block text-xs font-semibold text-slate-200">
                {purchaseItemPickerConfig.label} <span className="text-rose-400">*</span>
              </label>

              <button
                type="button"
                onClick={() => setPurchaseProductDropdownOpen((prev) => !prev)}
                style={{ backgroundColor: "#071644", borderColor: "#218DFF", color: "#ffffff" }}
                className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-[#218DFF] focus:outline-none text-left"
              >
                {selectedPurchaseProduct ? (
                  <div className="flex items-center gap-2 truncate">
                    <Package className="w-4 h-4 text-[#218DFF] shrink-0" />
                    <span className="font-bold text-white truncate">{selectedPurchaseProduct.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0 ${
                        (selectedPurchaseProduct.quantity || 0) <= 0
                          ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                          : "bg-[#218DFF]/20 text-[#9EDCFF]"
                      }`}
                    >
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
                    purchaseProductDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

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
                        setPurchaseProductId("");
                        setPurchaseItemTitle(purchaseProductSearch.trim());
                        setPurchaseProductDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-[#218DFF]/15 border border-[#218DFF]/40 text-[#9EDCFF] hover:bg-[#218DFF]/25 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use &quot;{purchaseProductSearch.trim()}&quot; as custom item</span>
                    </button>
                  )}

                  <div className="overflow-y-auto space-y-1 pr-1 max-h-48">
                    {filteredPurchaseProducts.map((p) => {
                      const isSelected = p.id === purchaseProductId;
                      const pQty = Number(p.quantity ?? p.currentStock ?? 0);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPurchaseProduct(p.id)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-gradient-to-r from-[#1045CA] to-[#0A2786] border-[#9EDCFF]/60 text-white shadow-sapphire-glow"
                              : "bg-white/5 border-transparent hover:bg-white/10 hover:border-[#218DFF]/50 text-slate-200"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-white block truncate">{p.title}</span>
                            <span className="text-[10px] text-slate-300">
                              Current stock: {pQty} {p.unit || "units"}{" "}
                              {pQty <= 0 ? "· Out of Stock" : pQty <= (p.lowStockAlert || 5) ? "· Low Stock" : ""}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-orbitron font-extrabold text-xs text-[#9EDCFF] block">
                              {formatRWF(p.purchasePriceRWF || p.unitCostRWF || 0)}
                            </span>
                            <span className="text-[9px] text-slate-400">Last Unit Cost</span>
                          </div>
                        </button>
                      );
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
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none mt-1"
                />
              )}

              {/* Product Stock & Open PO Context Pills */}
              {(prodIntel.exists || purchaseItemTitle.trim()) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      prodIntel.currentStock <= 0
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                        : prodIntel.currentStock <= prodIntel.reorderLevel
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                    }`}
                  >
                    On Shelf: {prodIntel.currentStock} {prodIntel.unit} (Reorder ≤ {prodIntel.reorderLevel})
                  </span>
                  {prodIntel.onOrderQuantity > 0 && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 border border-amber-400/50 text-amber-200">
                      Open PO In Transit: {prodIntel.onOrderQuantity} {prodIntel.unit}
                    </span>
                  )}
                  {prodIntel.daysOfStockCoverage !== null && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#218DFF]/20 border border-[#218DFF]/40 text-[#9EDCFF]">
                      Covers ~{prodIntel.daysOfStockCoverage}d sales
                      {prodIntel.projectedDaysOfCoverage ? ` → ~${prodIntel.projectedDaysOfCoverage}d after` : ""}
                    </span>
                  )}
                  {prodIntel.lastPurchasePriceRWF > 0 && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/10 text-slate-300">
                      Prev Price: {formatRWF(prodIntel.lastPurchasePriceRWF)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Quantity, Unit Cost & Optional Landed Charges */}
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
                    onChange={(e) => {
                      setPurchaseQuantity(e.target.value);
                      if (purchaseDeliveryStatus === "Received") {
                        setPurchaseReceivedQty(e.target.value);
                      }
                    }}
                    placeholder="e.g. 50"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                  />
                  <CustomSelect
                    value={purchaseUnit}
                    onChange={setPurchaseUnit}
                    className="w-28 shrink-0"
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
                    value={purchaseUnitCost === "" ? "" : formatWithCommas(purchaseUnitCost)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPurchaseUnitCost(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="0"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    RWF
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Tax & Transport/Additional Charges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Transport / Offloading Charges (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={purchaseExtraChargesRWF === "" ? "" : formatWithCommas(purchaseExtraChargesRWF)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPurchaseExtraChargesRWF(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="0"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full pl-3 pr-12 py-2 rounded-xl exbos-modal-input text-xs text-white font-orbitron focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    RWF
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Applicable Tax / Duties (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={purchaseTaxRWF === "" ? "" : formatWithCommas(purchaseTaxRWF)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPurchaseTaxRWF(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="0"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full pl-3 pr-12 py-2 rounded-xl exbos-modal-input text-xs text-white font-orbitron focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    RWF
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Total Valuation Card */}
            {purchaseTotalAmount > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    Subtotal ({purchaseQtyNum} × {formatRWF(purchaseCostNum)}):
                  </span>
                  <span className="font-mono font-bold text-white">{formatRWF(purchaseSubtotalAmount)}</span>
                </div>
                {(purchaseExtraNum > 0 || purchaseTaxNum > 0) && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Transport &amp; Taxes:</span>
                    <span className="font-mono">+{formatRWF(purchaseExtraNum + purchaseTaxNum)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <span className="text-xs font-bold text-slate-200">Total Purchase Cost:</span>
                  <span className="font-orbitron font-extrabold text-base text-white">
                    {formatRWF(purchaseTotalAmount)}
                  </span>
                </div>
                <p className="text-[10px] text-[#9EDCFF] font-medium italic truncate">
                  {numberToWordsEnglish(purchaseTotalAmount)}
                </p>
              </div>
            )}

            {/* 4. Supplier Information with Quick Historical Picker */}
            <div className="space-y-2 pt-1 border-t border-white/10" ref={purchaseSupplierDropdownRef}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#218DFF]" />
                  <span>Supplier / Vendor Information</span>
                </span>
                {existingSuppliers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPurchaseSupplierDropdownOpen((prev) => !prev)}
                    className="text-[11px] text-[#9EDCFF] hover:underline font-semibold cursor-pointer"
                  >
                    {purchaseSupplierDropdownOpen ? "Hide Saved Suppliers" : `Pick Saved Supplier (${existingSuppliers.length})`}
                  </button>
                )}
              </div>

              {purchaseSupplierDropdownOpen && existingSuppliers.length > 0 && (
                <div className="p-2 rounded-xl bg-[#040C26] border border-[#218DFF]/50 max-h-36 overflow-y-auto space-y-1">
                  {filteredSuppliers.map((sup, idx) => (
                    <button
                      key={sup.id || idx}
                      type="button"
                      onClick={() => handleSelectSupplier(sup)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold text-white">{sup.supplierName || sup.name || sup.title}</span>
                      <span className="text-[10px] text-slate-400">{sup.phone || sup.location || "Saved Vendor"}</span>
                    </button>
                  ))}
                </div>
              )}

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
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#218DFF]" />
                    <span>
                      Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={purchaseSupplierPhone}
                    onChange={(e) => setPurchaseSupplierPhone(e.target.value)}
                    placeholder="e.g. +250 788 554 221"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#218DFF]" />
                    <span>
                      Location / Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplierLocation}
                    onChange={(e) => setPurchaseSupplierLocation(e.target.value)}
                    placeholder="e.g. Gikondo Industrial Zone, Kigali"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Delivery Status (Distinguish Purchase Orders from Received Inventory) & Batch Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-white/10">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Inventory Receipt / Delivery Status
                </label>
                <select
                  value={purchaseDeliveryStatus}
                  onChange={(e) => {
                    const nextDeliv = e.target.value;
                    setPurchaseDeliveryStatus(nextDeliv);
                    setPurchaseAutoRestock(nextDeliv !== "Ordered");
                    if (nextDeliv === "Received") {
                      setPurchaseReceivedQty(String(purchaseQtyNum));
                    } else if (nextDeliv === "Ordered") {
                      setPurchaseReceivedQty("0");
                    }
                  }}
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                >
                  <option value="Received" style={{ backgroundColor: "#071644", color: "#ffffff" }}>
                    Received Immediately (Add to Stock Now)
                  </option>
                  <option value="Ordered" style={{ backgroundColor: "#071644", color: "#ffffff" }}>
                    Purchase Order / In Transit (Add Stock on Delivery)
                  </option>
                  <option value="Partially Received" style={{ backgroundColor: "#071644", color: "#ffffff" }}>
                    Partially Received (Split Delivery)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#218DFF]" />
                  <span>Batch Expiry Date (Optional)</span>
                </label>
                <input
                  type="date"
                  value={purchaseExpiryDate}
                  onChange={(e) => setPurchaseExpiryDate(e.target.value)}
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {purchaseDeliveryStatus === "Partially Received" && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Quantity Received Now (out of {purchaseQtyNum} {purchaseUnit} ordered)
                </label>
                <input
                  type="number"
                  min="0"
                  max={purchaseQtyNum}
                  value={purchaseReceivedQty}
                  onChange={(e) => setPurchaseReceivedQty(e.target.value)}
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2 rounded-xl exbos-modal-input text-xs text-white font-orbitron font-bold"
                />
                <p className="text-[10px] text-amber-300">
                  Stock will increase by {effectiveReceivedQty} {purchaseUnit} now; the remaining{" "}
                  {Math.max(0, purchaseQtyNum - effectiveReceivedQty)} {purchaseUnit} stays tracked as an open Purchase Order.
                </p>
              </div>
            )}

            {/* 6. Payment Method & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">Payment Method</label>
                <CustomSelect
                  value={purchasePaymentMethod}
                  onChange={(val) => {
                    setPurchasePaymentMethod(val);
                    if (val === "Supplier Credit Account") {
                      setPurchasePaymentStatus("Unpaid (Supplier Credit / Debt)");
                    }
                  }}
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
                <label className="block text-xs font-semibold text-slate-200">Payment Status</label>
                <select
                  value={purchasePaymentStatus}
                  onChange={(e) => setPurchasePaymentStatus(e.target.value)}
                  style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                >
                  <option value="Paid in Full" style={{ backgroundColor: "#071644", color: "#ffffff" }}>
                    Paid in Full
                  </option>
                  <option
                    value="Unpaid (Supplier Credit / Debt)"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                  >
                    Unpaid (Supplier Credit / Debt)
                  </option>
                  <option value="Part-paid" style={{ backgroundColor: "#071644", color: "#ffffff" }}>
                    Part-paid
                  </option>
                </select>
              </div>
            </div>

            {/* Part-paid amount paid input */}
            {purchasePaymentStatus === "Part-paid" && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-200">Amount Paid Now (RWF)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={purchasePaidAmount === "" ? "" : formatWithCommas(purchasePaidAmount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setPurchasePaidAmount(raw === "" ? "" : Number(raw));
                    }}
                    placeholder="e.g. 200,000"
                    style={{ backgroundColor: "#071644", color: "#ffffff" }}
                    className="w-full pl-3.5 pr-14 py-2 rounded-xl exbos-modal-input text-xs text-white font-orbitron font-bold focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    RWF
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-amber-300 pt-1">
                  <span>Remaining Unpaid Supplier Credit Balance:</span>
                  <strong className="font-orbitron font-bold">{formatRWF(purchaseRemainingAmount)}</strong>
                </div>
              </div>
            )}

            {/* 7. LIVE INTELLIGENT FINANCIAL ASSESSMENT & RECOMMENDATIONS PANEL */}
            <div
              className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                !affordIntel.isAffordable
                  ? "bg-rose-950/35 border-rose-500/60 shadow-[0_4px_25px_rgba(244,63,94,0.18)]"
                  : "bg-[#061539]/90 border-[#218DFF]/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9EDCFF]" />
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-white">
                    Live Purchasing &amp; Financial Assessment
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    affordIntel.isAffordable
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {affordIntel.isAffordable
                    ? "Budget Approved"
                    : `Shortfall: ${formatRWF(affordIntel.purchaseShortfallRWF)}`}
                </span>
              </div>

              {/* Financial Breakdown Formula */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-2.5 rounded-xl bg-black/25 border border-white/10">
                <div>
                  <span className="text-slate-400 block">Immediate Cash Needed</span>
                  <strong className="font-orbitron text-white">
                    {formatRWF(priceIntel.immediateCashOutlayRWF)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Available Budget</span>
                  <strong className="font-orbitron text-[#9EDCFF]">
                    {formatRWF(affordIntel.effectivePurchasingBudgetRWF)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Supplier Credit Added</span>
                  <strong className="font-orbitron text-amber-300">
                    {formatRWF(priceIntel.supplierCreditCreatedRWF)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">
                    {affordIntel.isAffordable ? "Budget After Purchase" : "Budget Shortfall"}
                  </span>
                  <strong
                    className={`font-orbitron ${
                      affordIntel.isAffordable ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {affordIntel.isAffordable
                      ? formatRWF(affordIntel.remainingPurchasingBudgetRWF)
                      : `-${formatRWF(affordIntel.purchaseShortfallRWF)}`}
                  </strong>
                </div>
              </div>

              {/* Recommendations List */}
              {recommendations.length > 0 && (
                <div className="space-y-1.5">
                  {recommendations.map((rec, idx) => {
                    const toneClass =
                      rec.type === "danger" || rec.type === "urgent"
                        ? "bg-rose-500/15 border-rose-400/40 text-rose-200"
                        : rec.type === "warning"
                        ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                        : rec.type === "success"
                        ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                        : "bg-[#218DFF]/15 border-[#218DFF]/40 text-[#9EDCFF]";
                    return (
                      <div
                        key={rec.code || idx}
                        className={`px-3 py-2 rounded-xl border text-xs flex items-start gap-2 ${toneClass}`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{rec.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actionable Alternatives when Shortfall > 0 or user wants to add side money */}
              {(alternatives.length > 0 || !showSideMoneyBox) && (
                <div className="space-y-2 pt-1">
                  {alternatives.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                      Smart Resolution Options (Click to Apply):
                    </span>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((alt) => (
                      <button
                        key={alt.action}
                        type="button"
                        onClick={() => handleApplyAlternative(alt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          alt.action === "ADD_SIDE_MONEY"
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/60 text-emerald-200"
                            : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        }`}
                      >
                        {alt.label}
                      </button>
                    ))}
                    {alternatives.length === 0 && !showSideMoneyBox && (
                      <button
                        type="button"
                        onClick={() => setShowSideMoneyBox(true)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white/5 hover:bg-white/15 border border-white/15 text-[#9EDCFF] cursor-pointer"
                      >
                        + I have other side money I can add to fund this purchase
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Side Money / Owner Capital Top-Up Input Box */}
              {showSideMoneyBox && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>External / Owner Side Money Top-Up</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSideMoneyBox(false);
                        setSideMoneyAmount("");
                      }}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">
                        Side Money Amount to Add (RWF)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sideMoneyAmount === "" ? "" : formatWithCommas(sideMoneyAmount)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          setSideMoneyAmount(raw === "" ? "" : Number(raw));
                        }}
                        placeholder="e.g. 50,000"
                        style={{ backgroundColor: "#040C26", color: "#ffffff" }}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-400/50 text-xs text-white font-orbitron font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-1">Funding Source Note</label>
                      <input
                        type="text"
                        value={sideMoneySource}
                        onChange={(e) => setSideMoneySource(e.target.value)}
                        placeholder="e.g. Owner Personal Savings / Side Business"
                        style={{ backgroundColor: "#040C26", color: "#ffffff" }}
                        className="w-full px-3 py-2 rounded-xl border border-white/20 text-xs text-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-200/90 leading-relaxed">
                    This amount will be recorded as an audited <strong>Owner Capital / Side Money Top-Up</strong> in your cashflow ledger so your purchasing budget and cash balances stay 100% reconciled.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/15 shrink-0 bg-[#040C26]/90">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 text-[#9EDCFF] animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#9EDCFF]" />
              )}
              <span>
                {isSubmitting
                  ? "Saving Purchase..."
                  : purchaseDeliveryStatus === "Ordered"
                  ? `Create Purchase Order (${formatRWF(purchaseTotalAmount)})`
                  : activeModule === "Products" && activePage === "Stock"
                  ? purchaseTotalAmount > 0
                    ? `Receive Stock (${formatRWF(purchaseTotalAmount)})`
                    : "Receive Stock"
                  : purchaseTotalAmount > 0
                  ? `Confirm Purchase (${formatRWF(purchaseTotalAmount)})`
                  : "Record Purchase"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
