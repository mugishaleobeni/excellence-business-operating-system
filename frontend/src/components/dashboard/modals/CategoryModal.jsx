import React, { useState, useEffect } from 'react'
import { Tag, X, Check } from 'lucide-react'

export default function CategoryModal({
  isOpen,
  onClose,
  editingCategory = null,
  onSaveCategory
}) {
  const [categoryNameInput, setCategoryNameInput] = useState('')
  const [categoryDescInput, setCategoryDescInput] = useState('')
  const [categoryStatusInput, setCategoryStatusInput] = useState('Active')

  useEffect(() => {
    if (editingCategory) {
      setCategoryNameInput(editingCategory.name || '')
      setCategoryDescInput(editingCategory.description || '')
      setCategoryStatusInput(editingCategory.status || 'Active')
    } else {
      setCategoryNameInput('')
      setCategoryDescInput('')
      setCategoryStatusInput('Active')
    }
  }, [editingCategory, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!categoryNameInput.trim()) return

    if (onSaveCategory) {
      onSaveCategory({
        name: categoryNameInput.trim(),
        description: categoryDescInput.trim(),
        status: categoryStatusInput
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-orbitron text-base font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h4>
              <p className="text-[11px] text-slate-300">
                {editingCategory ? 'Update category name and details' : 'Organize your products and inventory catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Category Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              placeholder="e.g. Electrical Supplies, Solar Equipment, Beverages..."
              style={{ backgroundColor: '#071644', color: '#ffffff' }}
              className="w-full px-4 py-3 rounded-xl exbos-modal-input text-white placeholder-slate-400 text-sm focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={categoryDescInput}
              onChange={(e) => setCategoryDescInput(e.target.value)}
              placeholder="Briefly describe what items belong in this category..."
              style={{ backgroundColor: '#071644', color: '#ffffff' }}
              className="w-full px-4 py-2.5 rounded-xl exbos-modal-input text-white placeholder-slate-400 text-xs focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Status
            </label>
            <select
              value={categoryStatusInput}
              onChange={(e) => setCategoryStatusInput(e.target.value)}
              style={{ backgroundColor: '#071644', color: '#ffffff' }}
              className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer shadow-inner"
            >
              <option value="Active" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Active</option>
              <option value="Archived" style={{ backgroundColor: '#071644', color: '#ffffff' }}>Archived</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sapphire-clean px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Check className="w-3.5 h-3.5 text-[#9EDCFF]" />
              <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

