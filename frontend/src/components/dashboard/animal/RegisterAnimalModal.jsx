import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Heart,
  Tag,
  Info,
  Users,
  User,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react'
import {
  ANIMAL_CATEGORIES,
  ORIGIN_OPTIONS,
  STATUS_OPTIONS,
  PURPOSE_OPTIONS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  getCategoryByAnimalType,
  calculateExpectedBirthDate
} from './animalConstants'
import { formatRWF } from "../../../utils/currencyWords"
import AnimalTypeBreedSection from "./AnimalTypeBreedSection"
import BasicAnimalInfoSection from "./BasicAnimalInfoSection"
import PurchaseOriginSection from "./PurchaseOriginSection"
import BreedingDetailsSection from "./BreedingDetailsSection"

export default function RegisterAnimalModal({
  isOpen,
  onClose,
  onSave,
  existingSuppliers = [],
  existingAnimals = [],
  initialData = null // if editing
}) {
  if (!isOpen) return null

  const isEditing = Boolean(initialData)

  // Registration Mode: 'individual' vs 'group'
  const [registrationMode, setRegistrationMode] = useState(
    initialData?.registrationMode || 'individual'
  )

  // Animal Type search & selection
  const [typeSearch, setTypeSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.categoryGroup || 'Pigs'
  )
  const [animalType, setAnimalType] = useState(initialData?.animalType || 'Pig')
  const [customAnimalType, setCustomAnimalType] = useState(
    initialData?.customAnimalType || ''
  )

  // Breed selection
  const [breed, setBreed] = useState(initialData?.breed || 'Large White')
  const [customBreed, setCustomBreed] = useState(initialData?.customBreed || '')

  // Basic Information
  const [animalId, setAnimalId] = useState(
    initialData?.animalId || initialData?.id || ''
  )
  const [nameOrTag, setNameOrTag] = useState(
    initialData?.title || initialData?.name || ''
  )
  const [sex, setSex] = useState(initialData?.sex || 'Female')
  const [age, setAge] = useState(initialData?.age || '8 months')
  const [dob, setDob] = useState(initialData?.dob || '')
  const [weightKg, setWeightKg] = useState(
    initialData?.weightKg !== undefined && initialData?.weightKg !== null
      ? String(initialData.weightKg)
      : '65'
  )
  const [color, setColor] = useState(initialData?.color || '')
  const [registrationDate, setRegistrationDate] = useState(
    initialData?.date || new Date().toISOString().slice(0, 10)
  )
  const [purpose, setPurpose] = useState(initialData?.purpose || 'Breeding')
  const [status, setStatus] = useState(initialData?.status || 'Active')
  const [notes, setNotes] = useState(initialData?.notes || '')

  // Group Mode Specific Fields
  const [groupQuantity, setGroupQuantity] = useState(
    initialData?.quantity ? String(initialData.quantity) : '100'
  )
  const [maleCount, setMaleCount] = useState(
    initialData?.maleCount !== undefined ? String(initialData.maleCount) : ''
  )
  const [femaleCount, setFemaleCount] = useState(
    initialData?.femaleCount !== undefined ? String(initialData.femaleCount) : ''
  )
  const [unknownCount, setUnknownCount] = useState(
    initialData?.unknownCount !== undefined ? String(initialData.unknownCount) : ''
  )
  const [ageGroup, setAgeGroup] = useState(
    initialData?.ageGroup || 'Growers (4-8 weeks)'
  )
  const [housing, setHousing] = useState(initialData?.housing || 'Pen #1')
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitCostRWF ? String(initialData.unitCostRWF) : '2500'
  )

  // Purchase Details
  const [origin, setOrigin] = useState(initialData?.origin || 'Purchased')
  const [purchasePrice, setPurchasePrice] = useState(
    initialData?.purchasePriceRWF ? String(initialData.purchasePriceRWF) : '250000'
  )
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchaseDate || new Date().toISOString().slice(0, 10)
  )
  const [sellerName, setSellerName] = useState(
    initialData?.sellerName || initialData?.supplier || 'John'
  )
  const [sellerPhone, setSellerPhone] = useState(
    initialData?.sellerPhone || '0788000000'
  )
  const [sellerLocation, setSellerLocation] = useState(
    initialData?.sellerLocation || 'Kigali, Rwanda'
  )
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || 'MTN MoMo Business'
  )
  const [paymentStatus, setPaymentStatus] = useState(
    initialData?.paymentStatus || 'Paid'
  )
  const [amountPaid, setAmountPaid] = useState(
    initialData?.amountPaidRWF ? String(initialData.amountPaidRWF) : '250000'
  )
  const [purchaseNotes, setPurchaseNotes] = useState(
    initialData?.purchaseNotes || ''
  )

  // Breeding Details
  const [includeBreeding, setIncludeBreeding] = useState(
    initialData?.isBreeding ?? (purpose === 'Breeding' || animalType === 'Pig')
  )
  const [breedingPurpose, setBreedingPurpose] = useState(
    initialData?.breedingPurpose || 'Commercial Breeding'
  )
  const [breedingStatus, setBreedingStatus] = useState(
    initialData?.breedingStatus || 'Ready for Breeding'
  )
  const [lastMatingDate, setLastMatingDate] = useState(
    initialData?.lastMatingDate || ''
  )
  const [matingPartner, setMatingPartner] = useState(
    initialData?.matingPartner || ''
  )
  const [matingMethod, setMatingMethod] = useState(
    initialData?.matingMethod || 'Natural Service'
  )
  const [expectedBirthDate, setExpectedBirthDate] = useState(
    initialData?.expectedBirthDate || ''
  )
  const [previousLitters, setPreviousLitters] = useState(
    initialData?.previousLitters ? String(initialData.previousLitters) : '0'
  )
  const [totalOffspring, setTotalOffspring] = useState(
    initialData?.totalOffspring ? String(initialData.totalOffspring) : '0'
  )
  const [bornAlive, setBornAlive] = useState(
    initialData?.bornAlive ? String(initialData.bornAlive) : '0'
  )
  const [stillborn, setStillborn] = useState(
    initialData?.stillborn ? String(initialData.stillborn) : '0'
  )
  const [weaned, setWeaned] = useState(
    initialData?.weaned ? String(initialData.weaned) : '0'
  )
  const [availableForBreeding, setAvailableForBreeding] = useState(
    initialData?.availableForBreeding ?? true
  )
  const [successfulMatings, setSuccessfulMatings] = useState(
    initialData?.successfulMatings ? String(initialData.successfulMatings) : '0'
  )
  const [layingStatus, setLayingStatus] = useState(
    initialData?.layingStatus || 'Active Layer'
  )
  const [dailyEggs, setDailyEggs] = useState(
    initialData?.dailyEggs ? String(initialData.dailyEggs) : '1'
  )
  const [breedingGroup, setBreedingGroup] = useState(
    initialData?.breedingGroup || ''
  )
  const [incubationDate, setIncubationDate] = useState(
    initialData?.incubationDate || ''
  )
  const [chicksHatched, setChicksHatched] = useState(
    initialData?.chicksHatched ? String(initialData.chicksHatched) : '0'
  )
  const [breedingNotes, setBreedingNotes] = useState(
    initialData?.breedingNotes || ''
  )

  // Active form section tab: 'type' | 'basic' | 'purchase' | 'breeding'
  const [activeSection, setActiveSection] = useState('type')

  // Auto-generate Animal ID if empty
  useEffect(() => {
    if (!animalId) {
      const prefix = registrationMode === 'group' ? 'GRP' : 'ANI'
      const typeCode = (animalType || 'ANI').slice(0, 3).toUpperCase()
      const randNum = Math.floor(100 + Math.random() * 900)
      setAnimalId(`${prefix}-${typeCode}-${randNum}`)
    }
  }, [animalId, registrationMode, animalType])

  // Get Category info & available breeds
  const activeCategoryInfo = useMemo(() => {
    return getCategoryByAnimalType(animalType)
  }, [animalType])

  const availableBreeds = activeCategoryInfo.defaultBreeds || ['Standard Breed', 'Other']

  // Update default breed when animal type changes (if not already custom)
  useEffect(() => {
    if (!initialData && availableBreeds.length > 0) {
      setBreed(availableBreeds[0])
    }
  }, [animalType, availableBreeds, initialData])

  // Filtered categories for type search
  const filteredCategories = useMemo(() => {
    if (!typeSearch.trim()) return ANIMAL_CATEGORIES
    const query = typeSearch.toLowerCase()
    return ANIMAL_CATEGORIES.filter(
      (cat) =>
        cat.category.toLowerCase().includes(query) ||
        cat.types.some((t) => t.toLowerCase().includes(query))
    )
  }, [typeSearch])

  // Dynamic Gestation / Farrowing Date calculation
  useEffect(() => {
    if (lastMatingDate && activeCategoryInfo.gestationDays > 0) {
      const estDate = calculateExpectedBirthDate(
        lastMatingDate,
        activeCategoryInfo.gestationDays
      )
      if (estDate) {
        setExpectedBirthDate(estDate)
      }
    }
  }, [lastMatingDate, activeCategoryInfo.gestationDays])

  // Chicken Incubation Hatch Date calculation
  useEffect(() => {
    if (incubationDate && (animalType === 'Hen' || activeCategoryInfo.category === 'Chickens')) {
      const hatch = calculateExpectedBirthDate(incubationDate, 21)
      if (hatch) {
        setExpectedBirthDate(hatch)
      }
    }
  }, [incubationDate, animalType, activeCategoryInfo.category])

  // Auto calculate remaining balance for purchases
  const calculatedRemainingBalance = useMemo(() => {
    if (origin !== 'Purchased') return 0
    let total = 0
    if (registrationMode === 'group') {
      const q = Number(groupQuantity) || 0
      const u = Number(unitPrice) || 0
      total = q * u
    } else {
      total = Number(purchasePrice) || 0
    }
    const paid = Number(amountPaid) || 0
    return Math.max(0, total - paid)
  }, [origin, registrationMode, groupQuantity, unitPrice, purchasePrice, amountPaid])

  // Auto-sync amount paid when payment status is full or unpaid
  const handlePaymentStatusChange = (newStatus) => {
    setPaymentStatus(newStatus)
    const total =
      registrationMode === 'group'
        ? (Number(groupQuantity) || 0) * (Number(unitPrice) || 0)
        : Number(purchasePrice) || 0

    if (newStatus === 'Paid') {
      setAmountPaid(String(total))
    } else if (newStatus === 'Unpaid') {
      setAmountPaid('0')
    }
  }

  // Handle Supplier Selection (Autofill Seller Details)
  const handleSelectSupplier = (supplierNameValue) => {
    setSellerName(supplierNameValue)
    const match = existingSuppliers.find(
      (s) => (s.title || s.name || s.supplierName) === supplierNameValue
    )
    if (match) {
      if (match.phone) setSellerPhone(match.phone)
      if (match.location) setSellerLocation(match.location)
    }
  }

  // Handle Form Submission
  const buildPayload = () => {
    const effectiveAnimalType =
      animalType === 'Custom Animal Type' && customAnimalType.trim()
        ? customAnimalType.trim()
        : animalType

    const effectiveBreed =
      breed === 'Other' && customBreed.trim()
        ? customBreed.trim()
        : breed

    const isGroup = registrationMode === 'group'
    const totalCost = isGroup
      ? (Number(groupQuantity) || 0) * (Number(unitPrice) || 0)
      : Number(purchasePrice) || 0

    const effectiveTitle =
      nameOrTag.trim() ||
      (isGroup
        ? `${groupQuantity} × ${effectiveBreed} ${effectiveAnimalType}`
        : `${effectiveBreed} ${effectiveAnimalType} (#${animalId.slice(-4)})`)

    return {
      id: animalId,
      animalId,
      title: effectiveTitle,
      name: effectiveTitle,
      categoryGroup: activeCategoryInfo.category,
      category: `${effectiveAnimalType} · ${effectiveBreed}`,
      animalType: effectiveAnimalType,
      breed: effectiveBreed,
      customAnimalType: customAnimalType.trim(),
      customBreed: customBreed.trim(),
      registrationMode,
      sex: isGroup ? 'Mixed' : sex,
      age: isGroup ? ageGroup : age,
      dob,
      weightKg: isGroup ? null : (Number(weightKg) || null),
      color,
      date: registrationDate,
      purpose,
      status,
      notes,

      // Group fields
      quantity: isGroup ? Number(groupQuantity) || 1 : 1,
      maleCount: isGroup ? Number(maleCount) || 0 : (sex === 'Male' ? 1 : 0),
      femaleCount: isGroup ? Number(femaleCount) || 0 : (sex === 'Female' ? 1 : 0),
      unknownCount: isGroup ? Number(unknownCount) || 0 : (sex === 'Unknown' ? 1 : 0),
      ageGroup,
      housing,
      unitCostRWF: isGroup ? Number(unitPrice) || 0 : (origin === 'Purchased' ? Number(purchasePrice) || 0 : 0),

      // Purchase details
      origin,
      purchasePriceRWF: origin === 'Purchased' ? totalCost : 0,
      amountRWF: origin === 'Purchased' ? totalCost : (Number(weightKg) ? (Number(weightKg) * 2000) : 0),
      purchaseDate: origin === 'Purchased' ? purchaseDate : null,
      sellerName: origin === 'Purchased' ? sellerName.trim() : null,
      supplier: origin === 'Purchased' ? sellerName.trim() : null,
      sellerPhone: origin === 'Purchased' ? sellerPhone.trim() : null,
      sellerLocation: origin === 'Purchased' ? sellerLocation.trim() : null,
      paymentMethod: origin === 'Purchased' ? paymentMethod : null,
      paymentStatus: origin === 'Purchased' ? paymentStatus : 'Paid',
      amountPaidRWF: origin === 'Purchased' ? Number(amountPaid) || 0 : 0,
      remainingBalanceRWF: origin === 'Purchased' ? calculatedRemainingBalance : 0,
      purchaseNotes: origin === 'Purchased' ? purchaseNotes : '',

      // Breeding details
      isBreeding: includeBreeding,
      breedingPurpose: includeBreeding ? breedingPurpose : null,
      breedingStatus: includeBreeding ? breedingStatus : 'Not Breeding',
      lastMatingDate: includeBreeding ? lastMatingDate : null,
      matingPartner: includeBreeding ? matingPartner : null,
      matingMethod: includeBreeding ? matingMethod : null,
      expectedBirthDate: includeBreeding ? expectedBirthDate : null,
      previousLitters: includeBreeding ? Number(previousLitters) || 0 : 0,
      totalOffspring: includeBreeding ? Number(totalOffspring) || 0 : 0,
      bornAlive: includeBreeding ? Number(bornAlive) || 0 : 0,
      stillborn: includeBreeding ? Number(stillborn) || 0 : 0,
      weaned: includeBreeding ? Number(weaned) || 0 : 0,
      availableForBreeding: includeBreeding ? availableForBreeding : false,
      successfulMatings: includeBreeding ? Number(successfulMatings) || 0 : 0,
      layingStatus: includeBreeding ? layingStatus : null,
      dailyEggs: includeBreeding ? Number(dailyEggs) || 0 : 0,
      breedingGroup: includeBreeding ? breedingGroup : null,
      incubationDate: includeBreeding ? incubationDate : null,
      chicksHatched: includeBreeding ? Number(chicksHatched) || 0 : 0,
      breedingNotes: includeBreeding ? breedingNotes : '',

      subPage: 'Animal Register',
      type: 'in'
    }
  }

  const handleSubmit = (e, registerAnother = false) => {
    e && e.preventDefault()
    const payload = buildPayload()
    onSave && onSave(payload, isEditing)

    if (registerAnother) {
      // Reset unique ID and basic identifiers for fast next registration
      const typeCode = (animalType || 'ANI').slice(0, 3).toUpperCase()
      const randNum = Math.floor(100 + Math.random() * 900)
      setAnimalId(`ANI-${typeCode}-${randNum}`)
      setNameOrTag('')
      setWeightKg('')
      setActiveSection('basic')
    } else {
      onClose()
    }
  }

  const isPig = activeCategoryInfo.category === 'Pigs'
  const isCattle = activeCategoryInfo.category === 'Cattle'
  const isChicken = activeCategoryInfo.category === 'Chickens'
  const isGoatOrSheep =
    activeCategoryInfo.category === 'Goats' || activeCategoryInfo.category === 'Sheep'
  const isRuminant = isCattle || isGoatOrSheep
  const isMammal = isPig || isCattle || isGoatOrSheep || activeCategoryInfo.category === 'Rabbits'
  const isFemale = sex === 'Female'
  const isMale = sex === 'Male'
  const gestationDays = activeCategoryInfo.gestationDays || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03091F]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 sm:p-6 shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-xl">
              {activeCategoryInfo.icon || '🐾'}
            </div>
            <div>
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                Agriculture &amp; Livestock · Animal Registry
              </span>
              <h3 className="font-orbitron text-base sm:text-xl font-bold text-white">
                {isEditing ? `Edit Animal: ${initialData.animalId || initialData.id}` : 'Register New Animal'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Selector Toggle: Individual vs Group */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRegistrationMode('individual')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  registrationMode === 'individual'
                    ? 'bg-[#218DFF] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Individual Animal</span>
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('group')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  registrationMode === 'group'
                    ? 'bg-[#218DFF] text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Animal Group</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center border-b border-white/10 px-6 bg-black/20 overflow-x-auto gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('type')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'type'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>1. Animal Type &amp; Breed</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'basic'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>2. Basic Information</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('purchase')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'purchase'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Purchase &amp; Origin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('breeding')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'breeding'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>4. Breeding Details</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">

            {/* TAB 1: ANIMAL TYPE & BREED SELECTION */}
            {activeSection === "type" && (
              <AnimalTypeBreedSection
                typeSearch={typeSearch}
                setTypeSearch={setTypeSearch}
                filteredCategories={filteredCategories}
                activeCategoryInfo={activeCategoryInfo}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                animalType={animalType}
                setAnimalType={setAnimalType}
                customAnimalType={customAnimalType}
                setCustomAnimalType={setCustomAnimalType}
                availableBreeds={availableBreeds}
                breed={breed}
                setBreed={setBreed}
                customBreed={customBreed}
                setCustomBreed={setCustomBreed}
                onContinue={() => setActiveSection("basic")}
              />
            )}

            {/* TAB 2: BASIC ANIMAL INFORMATION */}
            {activeSection === "basic" && (
              <BasicAnimalInfoSection
                registrationMode={registrationMode}
                animalId={animalId}
                setAnimalId={setAnimalId}
                nameOrTag={nameOrTag}
                setNameOrTag={setNameOrTag}
                sex={sex}
                setSex={setSex}
                age={age}
                setAge={setAge}
                weightKg={weightKg}
                setWeightKg={setWeightKg}
                color={color}
                setColor={setColor}
                groupQuantity={groupQuantity}
                setGroupQuantity={setGroupQuantity}
                maleCount={maleCount}
                setMaleCount={setMaleCount}
                femaleCount={femaleCount}
                setFemaleCount={setFemaleCount}
                unknownCount={unknownCount}
                setUnknownCount={setUnknownCount}
                ageGroup={ageGroup}
                setAgeGroup={setAgeGroup}
                housing={housing}
                setHousing={setHousing}
                registrationDate={registrationDate}
                setRegistrationDate={setRegistrationDate}
                purpose={purpose}
                setPurpose={setPurpose}
                setIncludeBreeding={setIncludeBreeding}
                status={status}
                setStatus={setStatus}
                notes={notes}
                setNotes={setNotes}
                onBack={() => setActiveSection("type")}
                onContinue={() => setActiveSection("purchase")}
              />
            )}

            {/* TAB 3: ANIMAL PURCHASE INFORMATION */}
            {activeSection === "purchase" && (
              <PurchaseOriginSection
                registrationMode={registrationMode}
                origin={origin}
                setOrigin={setOrigin}
                groupQuantity={groupQuantity}
                unitPrice={unitPrice}
                setUnitPrice={setUnitPrice}
                purchasePrice={purchasePrice}
                setPurchasePrice={setPurchasePrice}
                purchaseDate={purchaseDate}
                setPurchaseDate={setPurchaseDate}
                sellerName={sellerName}
                setSellerName={setSellerName}
                sellerPhone={sellerPhone}
                setSellerPhone={setSellerPhone}
                sellerLocation={sellerLocation}
                setSellerLocation={setSellerLocation}
                existingSuppliers={existingSuppliers}
                handleSelectSupplier={handleSelectSupplier}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paymentStatus={paymentStatus}
                handlePaymentStatusChange={handlePaymentStatusChange}
                amountPaid={amountPaid}
                setAmountPaid={setAmountPaid}
                calculatedRemainingBalance={calculatedRemainingBalance}
                onBack={() => setActiveSection("basic")}
                onContinue={() => setActiveSection("breeding")}
              />
            )}

            {/* TAB 4: BREEDING DETAILS */}
            {activeSection === "breeding" && (
              <BreedingDetailsSection
                includeBreeding={includeBreeding}
                setIncludeBreeding={setIncludeBreeding}
                animalType={animalType}
                sex={sex}
                isPig={isPig}
                isFemale={isFemale}
                isMale={isMale}
                isChicken={isChicken}
                isCattle={isCattle}
                isGoatOrSheep={isGoatOrSheep}
                isRuminant={isRuminant}
                isMammal={isMammal}
                activeCategoryInfo={activeCategoryInfo}
                breedingPurpose={breedingPurpose}
                setBreedingPurpose={setBreedingPurpose}
                breedingStatus={breedingStatus}
                setBreedingStatus={setBreedingStatus}
                lastMatingDate={lastMatingDate}
                setLastMatingDate={setLastMatingDate}
                matingPartner={matingPartner}
                setMatingPartner={setMatingPartner}
                matingMethod={matingMethod}
                setMatingMethod={setMatingMethod}
                expectedBirthDate={expectedBirthDate}
                setExpectedBirthDate={setExpectedBirthDate}
                previousLitters={previousLitters}
                setPreviousLitters={setPreviousLitters}
                totalOffspring={totalOffspring}
                setTotalOffspring={setTotalOffspring}
                bornAlive={bornAlive}
                setBornAlive={setBornAlive}
                stillborn={stillborn}
                setStillborn={setStillborn}
                weaned={weaned}
                setWeaned={setWeaned}
                availableForBreeding={availableForBreeding}
                setAvailableForBreeding={setAvailableForBreeding}
                successfulMatings={successfulMatings}
                setSuccessfulMatings={setSuccessfulMatings}
                layingStatus={layingStatus}
                setLayingStatus={setLayingStatus}
                dailyEggs={dailyEggs}
                setDailyEggs={setDailyEggs}
                incubationDate={incubationDate}
                setIncubationDate={setIncubationDate}
                chicksHatched={chicksHatched}
                setChicksHatched={setChicksHatched}
                gestationDays={gestationDays}
                breedingNotes={breedingNotes}
                setBreedingNotes={setBreedingNotes}
                onBack={() => setActiveSection("purchase")}
              />
            )}          </div>

          {/* Action Bar Footer */}
          <div className="border-t border-white/15 p-4 sm:p-5 bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="px-4 py-2 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF]/30 border border-[#218DFF]/40 text-xs font-bold text-[#9EDCFF] transition-all cursor-pointer"
                >
                  Save &amp; Register Another
                </button>
              )}

              <button
                type="submit"
                className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Save Animal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

