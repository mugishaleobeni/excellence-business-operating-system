import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from "../../../utils/currencyWords";

export default function GenericRecordModal({
  isOpen,
  onClose,
  editRow = null,
  activeArchId = "buy-and-sell",
  currentArch = { shortName: "Retail" },
  activeModule = "Expenses",
  activePage = "All Expenses",
  categoryOptions = [],
  onSaveRecord
}) {
  const [title, setTitle] = useState("");
  const [categoryTag, setCategoryTag] = useState("");
  const [amountRWF, setAmountRWF] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCostRWF, setUnitCostRWF] = useState("");
  const [sellingPriceRWF, setSellingPriceRWF] = useState("");
  const [party, setParty] = useState("");
  const [statusVal, setStatusVal] = useState("Completed");
  const [account, setAccount] = useState("Cash");

  useEffect(() => {
    if (editRow) {
      setTitle(editRow.title || editRow.name || "");
      setCategoryTag(editRow.category || (categoryOptions[0] || "General"));
      setAmountRWF(editRow.amountRWF !== undefined ? String(editRow.amountRWF) : (editRow.amount ? String(editRow.amount) : ""));
      setQuantity(editRow.quantity !== undefined ? String(editRow.quantity) : "1");
      setUnitCostRWF(editRow.unitCostRWF !== undefined ? String(editRow.unitCostRWF) : "");
      setSellingPriceRWF(editRow.sellingPriceRWF !== undefined ? String(editRow.sellingPriceRWF) : "");
      setParty(editRow.party || editRow.supplier || editRow.customer || "");
      setStatusVal(editRow.status || "Completed");
      setAccount(editRow.account || "Cash");
    } else {
      setTitle("");
      setCategoryTag(categoryOptions[0] || "General");
      setAmountRWF("");
      setQuantity("1");
      setUnitCostRWF("");
      setSellingPriceRWF("");
      setParty("");
      setStatusVal(activeModule === "Purchases" ? "Paid" : "Completed");
      setAccount("Cash");
    }
  }, [editRow, isOpen, categoryOptions, activeModule]);

  if (!isOpen) return null;

  const handleSaveEntry = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const amountNum = parseNumericInput(amountRWF) || 0;
    const qtyNum = Number(quantity) || 1;

    const payload = {
      id: editRow ? editRow.id : `REC-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      category: categoryTag || "General",
      amountRWF: amountNum,
      quantity: qtyNum,
      unitCostRWF: parseNumericInput(unitCostRWF) || undefined,
      sellingPriceRWF: parseNumericInput(sellingPriceRWF) || undefined,
      party: party.trim() || undefined,
      status: statusVal || "Active",
      account: account || "Cash",
      subPage: activePage,
      type: activeModule === "Sales" ? "in" : activeModule === "Expenses" || activeModule === "Purchases" ? "out" : undefined,
      date: editRow?.date || new Date().toISOString().split("T")[0]
    };

    if (onSaveRecord) {
      onSaveRecord(payload, Boolean(editRow));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
                    <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
            >
              <div className="flex items-center justify-between border-b border-white/15 p-5 sm:p-6 shrink-0 bg-white/5">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase">
                    {currentArch.shortName} · {activeModule}
                  </span>
                  <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                    {editRow
                      ? 'Edit Record'
                      : activeModule === 'Livestock'
                      ? 'Register New Animal'
                      : activeModule === 'Crops & Fields'
                      ? 'Register New Field Plot'
                      : `New ${activePage}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                    {activeModule === 'Livestock'
                      ? 'Animal Tag / Name *'
                      : activeModule === 'Crops & Fields'
                      ? 'Field / Plot Name *'
                      : 'Description / Item Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      activeModule === 'Livestock'
                        ? 'e.g. Landrace Breeding Boar #02 or Tag #LR-14'
                        : activeModule === 'Crops & Fields'
                        ? 'e.g. Plot A — High Terrace Vines'
                        : `e.g. ${activePage} Description`
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                      {activeModule === 'Livestock'
                        ? 'Animal Breed / Category'
                        : activeModule === 'Crops & Fields'
                        ? 'Crop Type / Variety'
                        : 'Category / Tag'}
                    </label>
                    <input
                      type="text"
                      value={categoryTag}
                      onChange={(e) => setCategoryTag(e.target.value)}
                      placeholder={
                        activeModule === 'Livestock'
                          ? 'e.g. Landrace Gilt / Breeder Boar / Piglet'
                          : activeModule === 'Crops & Fields'
                          ? 'e.g. Sweet Potato Vines / Yellow Maize'
                          : activePage
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                      {activeModule === 'Livestock'
                        ? 'Estimated Animal Value (RWF)'
                        : activeModule === 'Crops & Fields'
                        ? 'Estimated Harvest Value (RWF)'
                        : 'Amount (RWF)'}
                    </label>
                    <input
                      type="number"
                      value={amountRWF}
                      onChange={(e) => setAmountRWF(e.target.value)}
                      placeholder="100000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                {(activeModule === 'Products' || activeModule === 'Materials' || activeModule === 'Inventory' || activeModule === 'Production' || activeModule === 'Crops & Fields') && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        value={unitCostRWF}
                        onChange={(e) => setUnitCostRWF(e.target.value)}
                        placeholder="12000"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                        Selling Price
                      </label>
                      <input
                        type="number"
                        value={sellingPriceRWF}
                        onChange={(e) => setSellingPriceRWF(e.target.value)}
                        placeholder="18000"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="1"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                      Party / Phone / Contact
                    </label>
                    <input
                      type="text"
                      value={party}
                      onChange={(e) => setParty(e.target.value)}
                      placeholder="Name or Phone"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                      Status
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                    </select>
                  </div>
                </div>

                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/15 shrink-0 bg-[#040C26]/90">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 text-[#9EDCFF]" />
                    <span>{editRow ? 'Save Changes' : 'Record Entry'}</span>
                  </button>
                </div>
              </form>
            </div>
    </div>
  );
}
