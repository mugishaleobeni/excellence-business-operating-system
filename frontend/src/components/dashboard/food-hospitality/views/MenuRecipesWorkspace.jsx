import React, { useState } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Scale,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Search,
  Filter
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import AddMenuItemModal from '../modals/AddMenuItemModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function MenuRecipesWorkspace() {
  const { demoWorkspaces, addDemoRecord, deleteDemoRecord } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const menuList = archData.records?.MenuItems || []
  const ingredientsList = archData.records?.Ingredients || []

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All', 'Main Dishes', 'Starters', 'Quick Bites', 'Beverages', 'Desserts', 'Chef Specials']

  const filteredDishes = menuList.filter((dish) => {
    const matchesCat = selectedCategory === 'All' || dish.category === selectedCategory
    const matchesSearch = !searchQuery.trim() ||
      dish.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleSaveDish = (dish) => {
    addDemoRecord('food-and-hospitality', 'MenuItems', dish)
    if (Array.isArray(dish.ingredients)) {
      dish.ingredients.forEach((ing) => {
        if (!ing.name) return
        const exists = ingredientsList.some(
          (existing) => existing.name?.toLowerCase() === ing.name.toLowerCase()
        )
        if (!exists) {
          addDemoRecord('food-and-hospitality', 'Ingredients', {
            id: `ING-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 89)}`,
            name: ing.name,
            unit: ing.unit || 'kg',
            currentStock: 20,
            reorderLevel: 5,
            unitCostRWF: Number(ing.costRWF) || 0,
            category: 'Pantry & Kitchen'
          })
        }
      })
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('food-and-hospitality', 'MenuItems', deleteTarget.id)
    setDeleteTarget(null)
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-white/[0.03] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            Pillar 01 · Menu Engineering &amp; Recipe Costing
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Menu Dishes &amp; Recipe Portion Margins
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Every dish breaks down into ingredient portions with automated Food Cost % tracking
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Menu Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Menu Dishes Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'No dishes match your filter criteria.' : 'Start by creating your first menu dish with ingredient portion costing.'}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Create Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDishes.map((dish) => {
            const foodCost = Number(dish.foodCostPercent) || 0
            const isHealthy = foodCost <= 35.0
            const isWarning = foodCost > 42.0
            const grossProfit = (Number(dish.sellingPriceRWF) || 0) - (Number(dish.recipeCostRWF) || 0)

            return (
              <div
                key={dish.id}
                className="p-5 rounded-3xl bg-[#0f0b04]/80 border border-white/10 hover:border-amber-400/40 transition-all space-y-3.5 relative overflow-hidden group shadow-lg"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
                      {dish.category || 'General'}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white mt-1.5 truncate">
                      {dish.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => setDeleteTarget(dish)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete dish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Pricing & Food Cost % Ribbon */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Selling Price</span>
                    <span className="font-orbitron font-extrabold text-sm text-amber-300 mt-0.5 block">
                      {formatRWF(dish.sellingPriceRWF)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Food Cost %</span>
                    <span
                      className={`font-orbitron font-extrabold text-sm mt-0.5 block ${
                        isHealthy ? 'text-emerald-400' : isWarning ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {foodCost}%
                    </span>
                  </div>
                </div>

                {/* Recipe Ingredients Preview */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Recipe Portions ({dish.ingredients?.length || 0} Ingredients)
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                    {(dish.ingredients || []).map((ing, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[170px]">• {ing.name} ({ing.quantity} {ing.unit})</span>
                        <span className="font-mono text-slate-400">{formatRWF(ing.costRWF)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Margins */}
                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dish.preparationTimeMin || 20} min prep</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    +{formatRWF(grossProfit)} profit
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Dish Modal */}
      <AddMenuItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        existingIngredients={ingredientsList}
        onSaveMenuItem={handleSaveDish}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Menu Dish"
          message={`Are you sure you want to remove "${deleteTarget.name}"? This will not affect past orders.`}
        />
      )}
    </div>
  )
}

