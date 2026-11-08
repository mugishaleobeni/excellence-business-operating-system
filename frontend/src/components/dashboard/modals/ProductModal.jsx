import React, { useState, useEffect, useRef } from "react";
import { Box, X, Camera, VideoOff, TrendingUp, Percent } from "lucide-react";
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from "../../../utils/currencyWords";
import { renderBarcodeSvg } from "../../../utils/barcodeUtils";
import CustomSelect from "../../common/CustomSelect";

export default function ProductModal({
  isOpen,
  onClose,
  editRow = null,
  activeArchId = "buy-and-sell",
  activePage = "Products",
  categoryOptions = [],
  onSaveProduct
}) {
  const [title, setTitle] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productCategory, setProductCategory] = useState("General");
  const [productUnit, setProductUnit] = useState("piece");
  const [productPurchasePrice, setProductPurchasePrice] = useState("");
  const [productSellingPrice, setProductSellingPrice] = useState("");
  const [productCurrentStock, setProductCurrentStock] = useState("0");
  const [productLowStockAlert, setProductLowStockAlert] = useState("5");
  const [productIsApproximateQty, setProductIsApproximateQty] = useState(false);
  const [productThresholdLow, setProductThresholdLow] = useState("5");
  const [productThresholdMed, setProductThresholdMed] = useState("20");
  const [productThresholdHigh, setProductThresholdHigh] = useState("50");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const resolveCatName = (val) => {
      if (!val) return "General";
      if (typeof val === "string") return val;
      return val.name || val.title || val.label || "General";
    };
    if (editRow) {
      setTitle(editRow.title || editRow.name || "");
      setProductSku(editRow.sku || editRow.barcode || "");
      setProductCategory(resolveCatName(editRow.category));
      setProductUnit(editRow.unit || "piece");
      setProductPurchasePrice(editRow.purchasePriceRWF ? String(editRow.purchasePriceRWF) : "");
      setProductSellingPrice(editRow.sellingPriceRWF ? String(editRow.sellingPriceRWF) : "");
      setProductCurrentStock(editRow.quantity !== undefined ? String(editRow.quantity) : "0");
      setProductLowStockAlert(editRow.lowStockAlert !== undefined ? String(editRow.lowStockAlert) : "5");
      setProductIsApproximateQty(Boolean(editRow.isApproximateQty));
    } else if (isOpen) {
      setTitle("");
      setProductSku("");
      setProductCategory(resolveCatName(categoryOptions[0]));
      setProductUnit("piece");
      setProductPurchasePrice("");
      setProductSellingPrice("");
      setProductCurrentStock("0");
      setProductLowStockAlert("5");
      setProductIsApproximateQty(false);
    }
  }, [editRow, isOpen]);

  const startCameraScan = async () => {
    setCameraError("");
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError("Camera access not supported on this browser.");
      }
    } catch (err) {
      setCameraError("Unable to access camera. Please enter barcode manually.");
      setCameraActive(false);
    }
  };

  const stopCameraScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError("");
  };

  const handleSimulateScan = (code) => {
    setProductSku(code);
    stopCameraScan();
  };

  useEffect(() => {
    if (!isOpen && cameraActive) {
      stopCameraScan();
    }
    return () => {
      stopCameraScan();
    };
  }, [isOpen, cameraActive]);

  if (!isOpen) return null;

  const cost = parseNumericInput(productPurchasePrice) || 0;
  const price = parseNumericInput(productSellingPrice) || 0;
  const stock = Number(productCurrentStock) || 0;
  const lowStock = Number(productLowStockAlert) || 5;
  const unitIncome = Math.max(0, price - cost);
  const marginPct = price > 0 ? Math.round((unitIncome / price) * 100) : 0;
  const activeBarcodePreview = productSku.trim() || "600123456789";

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const generatedSku = productSku.trim() || `600${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const payload = {
      id: editRow ? editRow.id : `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      subPage: activePage,
      category: typeof productCategory === "object" ? (productCategory?.name || "General") : (productCategory || "General"),
      sku: generatedSku,
      barcode: generatedSku,
      unit: productUnit,
      purchasePriceRWF: cost,
      unitCostRWF: cost,
      sellingPriceRWF: price,
      expectedUnitProfitRWF: unitIncome,
      expectedMarginPct: marginPct,
      amountRWF: price * stock,
      quantity: stock,
      currentStock: stock,
      lowStockAlert: lowStock,
      isApproximateQty: productIsApproximateQty,
      approximateThresholds: productIsApproximateQty ? {
        low: Number(productThresholdLow) || 5,
        medium: Number(productThresholdMed) || 20,
        high: Number(productThresholdHigh) || 50
      } : null,
      status: stock <= lowStock ? "Low Stock" : "Active",
      type: "in",
      date: editRow?.date || new Date().toISOString().split("T")[0]
    };

    stopCameraScan();
    if (onSaveProduct) {
      onSaveProduct(payload, Boolean(editRow));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => {
        stopCameraScan();
        onClose();
      }}
    >
                  <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/15 p-5 sm:p-6 shrink-0 bg-white/5">
                <div className="flex items-center gap-2.5">
                  <Box className="w-5 h-5 text-[#9EDCFF]" />
                  <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                    {activeArchId === 'agriculture' ? 'Register New Farm Input' : 'New product'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraScan()
                    onClose()
                  }}
                  className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateProduct} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                {/* Row 1: Product name & SKU / Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      {activeArchId === 'agriculture' ? 'Farm Input / Item Name *' : 'Product name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        activeArchId === 'agriculture'
                          ? 'e.g. Tunga Balanced Pig Feed 50kg'
                          : 'e.g. Twyford Ceramic Floor Tiles'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF] focus:bg-white/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-200">
                        SKU / Barcode
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const autoCode = `600${Math.floor(1000000000 + Math.random() * 9000000000)}`
                          setProductSku(autoCode)
                        }}
                        className="text-[10px] text-[#9EDCFF] hover:underline"
                      >
                        Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={productSku}
                        onChange={(e) => setProductSku(e.target.value)}
                        placeholder="Auto-generated if empty"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#218DFF] focus:bg-white/15 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (cameraActive) {
                            stopCameraScan()
                          } else {
                            startCameraScan()
                          }
                        }}
                        title="Scan with Camera"
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border transition-all cursor-pointer ${
                          cameraActive
                            ? 'bg-[#218DFF] text-white border-white shadow-[0_0_10px_rgba(33,141,255,0.6)]'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-white/20'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real Camera Scanner Viewport (Shows when camera button clicked) */}
                {cameraActive && (
                  <div className="p-3 rounded-2xl bg-black/60 border-2 border-[#218DFF]/60 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#9EDCFF] flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#218DFF] animate-pulse" />
                        <span>Live Barcode Scanner Camera</span>
                      </span>
                      <button
                        type="button"
                        onClick={stopCameraScan}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Aiming Reticle Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-24 border-2 border-[#218DFF] rounded-lg shadow-[0_0_15px_rgba(33,141,255,0.8)] relative">
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -translate-x-1 -translate-y-1" />
                          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white translate-x-1 -translate-y-1" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -translate-x-1 translate-y-1" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white translate-x-1 translate-y-1" />
                          <div className="w-full h-0.5 bg-rose-500 absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                        </div>
                      </div>

                      {cameraError && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center space-y-2">
                          <VideoOff className="w-6 h-6 text-amber-400" />
                          <p className="text-[11px] text-slate-300">{cameraError}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Point camera at any barcode or SKU</span>
                      <button
                        type="button"
                        onClick={() => handleSimulateScan(`600${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                        className="px-2.5 py-1 rounded-lg bg-[#218DFF]/25 border border-[#9EDCFF]/40 text-[#9EDCFF] hover:text-white font-bold cursor-pointer"
                      >
                        Capture Barcode
                      </button>
                    </div>
                  </div>
                )}

                {/* Row 2: Category & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      Category
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF] cursor-pointer"
                    >
                      <option value="General">General</option>
                      <option value="Building Materials">Building Materials</option>
                      <option value="Tiles & Ceramics">Tiles & Ceramics</option>
                      <option value="Paints & Coatings">Paints & Coatings</option>
                      <option value="Plumbing & Hardware">Plumbing & Hardware</option>
                      <option value="Electrical Supplies">Electrical Supplies</option>
                      <option value="Fast Moving Consumer Goods">Fast Moving Consumer Goods</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      Unit
                    </label>
                    <CustomSelect
                      value={productUnit}
                      onChange={setProductUnit}
                      options={[
                        { value: "piece", label: "piece (pc)" },
                        { value: "kg", label: "kilogram (kg)" },
                        { value: "gram", label: "gram (g)" },
                        { value: "liter", label: "liter (L)" },
                        { value: "box", label: "box" },
                        { value: "carton", label: "carton" },
                        { value: "bag", label: "bag / sack" },
                        { value: "meter", label: "meter (m)" },
                        { value: "square_meter", label: "square meter (m²)" },
                        { value: "roll", label: "roll" },
                        { value: "pair", label: "pair" },
                        { value: "bundle", label: "bundle" }
                      ]}
                    />
                  </div>
                </div>

                {/* Row 3: Purchase price & Selling price with Live Profit/Income Calculation & Words */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Purchase Price Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-200">
                        Purchase price (Cost)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={productPurchasePrice === '' ? '' : formatWithCommas(productPurchasePrice)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            setProductPurchasePrice(raw === '' ? '' : Number(raw))
                          }}
                          placeholder="0"
                          className="w-full pl-3.5 pr-14 py-2 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none focus:border-[#218DFF]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                          RWF
                        </span>
                      </div>
                      {/* Price in words */}
                      {Number(productPurchasePrice) > 0 && (
                        <p className="text-[10px] text-[#9EDCFF]/90 font-medium italic truncate pt-0.5">
                          {numberToWordsEnglish(productPurchasePrice)}
                        </p>
                      )}
                    </div>

                    {/* Selling Price Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-200">
                        Selling price
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={productSellingPrice === '' ? '' : formatWithCommas(productSellingPrice)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            setProductSellingPrice(raw === '' ? '' : Number(raw))
                          }}
                          placeholder="0"
                          className="w-full pl-3.5 pr-14 py-2 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none focus:border-[#218DFF]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                          RWF
                        </span>
                      </div>
                      {/* Price in words */}
                      {Number(productSellingPrice) > 0 && (
                        <p className="text-[10px] text-[#9EDCFF]/90 font-medium italic truncate pt-0.5">
                          {numberToWordsEnglish(productSellingPrice)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Expected Income / Margin Calculation Banner */}
                  {(Number(productSellingPrice) > 0 || Number(productPurchasePrice) > 0) && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <TrendingUp className="w-3.5 h-3.5 text-[#218DFF]" />
                        <span>Expected Unit Profit:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-orbitron font-extrabold ${
                          (Number(productSellingPrice) - Number(productPurchasePrice)) >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {(Number(productSellingPrice) - Number(productPurchasePrice)) >= 0 ? '+' : ''}
                          {formatRWF(Math.max(0, Number(productSellingPrice) - Number(productPurchasePrice)))}
                        </span>
                        {Number(productSellingPrice) > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[#9EDCFF] font-bold">
                            {Math.round(((Number(productSellingPrice) - Number(productPurchasePrice)) / Number(productSellingPrice)) * 100)}% margin
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 4: Current stock & Low stock alert level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      Current stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productCurrentStock}
                      onChange={(e) => setProductCurrentStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      Low stock alert level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productLowStockAlert}
                      onChange={(e) => setProductLowStockAlert(e.target.value)}
                      placeholder="5"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                {/* Checkbox: Approximate quantity (bulk items) */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={productIsApproximateQty}
                    onChange={(e) => setProductIsApproximateQty(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 text-[#218DFF] focus:ring-0 focus:outline-none bg-white/10 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium">
                    This item has approximate quantity (e.g., bulk items)
                  </span>
                </label>

                {/* Approximate stock thresholds setting (Shown when checkbox is checked) */}
                {productIsApproximateQty && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-[#218DFF]/30 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-xs font-bold text-[#9EDCFF] flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#218DFF]" />
                      <span>Approximate stock thresholds (for badges)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-rose-300">
                          Low (&lt;)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productThresholdLow}
                          onChange={(e) => setProductThresholdLow(e.target.value)}
                          placeholder="5"
                          className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-amber-300">
                          Medium (&lt;)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productThresholdMed}
                          onChange={(e) => setProductThresholdMed(e.target.value)}
                          placeholder="20"
                          className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-emerald-300">
                          High (&gt;)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productThresholdHigh}
                          onChange={(e) => setProductThresholdHigh(e.target.value)}
                          placeholder="50"
                          className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                </div>

                {/* Action Buttons - Brand Sapphire Blue Button */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/15 shrink-0 bg-[#040C26]/90">
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraScan()
                      onClose()
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <span>Create product</span>
                  </button>
                </div>
              </form>
            </div>
    </div>
  );
}
