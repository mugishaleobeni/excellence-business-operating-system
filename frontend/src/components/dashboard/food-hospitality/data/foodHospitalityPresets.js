/**
 * Food & Hospitality Specialization Presets (Architecture 05)
 * Dual-Mode: Restaurant / Bar / Kitchen + Rooms / Lodging
 * Zero emojis used; clean Lucide icon names mapped.
 */

export const FOOD_HOSPITALITY_PRESETS = {
  combined: {
    id: 'combined',
    name: 'Hotel & Fine Dining (Dual Mode)',
    category: 'Boutique Hotel & Executive Bistro',
    iconName: 'Hotel',
    businessName: 'Mille Collines Bistro & Suites',
    headline: 'Rooms Lodging, Restaurant KOT Queue & Consolidated Guest Folios',
    description: 'Manage guest rooms, reservations, live kitchen orders, recipe costing, and post dining bills to room folios.',
    attentionHeadline: '8/10 Rooms Occupied · 4 Kitchen Orders in Queue · Food Cost 31.8%',
    activeMode: 'both', // 'restaurant' | 'rooms' | 'both'
    menuItems: [
      {
        id: 'MNU-001',
        name: 'Grilled Lake Kivu Tilapia Platter',
        category: 'Main Dishes',
        sellingPriceRWF: 8500,
        recipeCostRWF: 2800,
        foodCostPercent: 32.9,
        preparationTimeMin: 25,
        status: 'Available',
        ingredients: [
          { name: 'Fresh Whole Tilapia', quantity: 1, unit: 'piece', costRWF: 1800 },
          { name: 'Plantains / Irish Potatoes', quantity: 0.25, unit: 'kg', costRWF: 400 },
          { name: 'Vegetable Oil & Seasoning', quantity: 0.05, unit: 'liters', costRWF: 350 },
          { name: 'Salad Greens & Lemon', quantity: 1, unit: 'portion', costRWF: 250 }
        ]
      },
      {
        id: 'MNU-002',
        name: 'Prime Beef Brochettes with Akabanga Fries',
        category: 'Quick Bites',
        sellingPriceRWF: 6000,
        recipeCostRWF: 1950,
        foodCostPercent: 32.5,
        preparationTimeMin: 20,
        status: 'Available',
        ingredients: [
          { name: 'Tender Beef Fillet', quantity: 0.25, unit: 'kg', costRWF: 1250 },
          { name: 'Irish Potatoes for Fries', quantity: 0.35, unit: 'kg', costRWF: 350 },
          { name: 'Chili, Onion & Spices', quantity: 1, unit: 'portion', costRWF: 350 }
        ]
      },
      {
        id: 'MNU-003',
        name: 'Specialty Rwandan Arabica Cappuccino',
        category: 'Beverages',
        sellingPriceRWF: 2500,
        recipeCostRWF: 550,
        foodCostPercent: 22.0,
        preparationTimeMin: 5,
        status: 'Available',
        ingredients: [
          { name: 'Single Origin Espresso Beans', quantity: 0.02, unit: 'kg', costRWF: 250 },
          { name: 'Fresh Inyange Whole Milk', quantity: 0.15, unit: 'liters', costRWF: 220 },
          { name: 'Sugar Sachet', quantity: 1, unit: 'piece', costRWF: 80 }
        ]
      }
    ],
    kitchenOrders: [
      {
        id: 'KOT-101',
        orderNumber: 'ORD-101',
        orderType: 'Dine-In',
        destination: 'Table #04 (Garden Terrace)',
        items: [
          { menuItemId: 'MNU-001', name: 'Grilled Lake Kivu Tilapia Platter', quantity: 2, priceRWF: 8500 }
        ],
        totalAmountRWF: 17000,
        status: 'Cooking', // 'New' | 'Cooking' | 'Ready' | 'Served' | 'Billed'
        placedAt: '12:35 PM',
        notes: 'Extra chili on side'
      },
      {
        id: 'KOT-102',
        orderNumber: 'ORD-102',
        orderType: 'Room Service',
        destination: 'Suite 201 (Executive)',
        items: [
          { menuItemId: 'MNU-002', name: 'Prime Beef Brochettes with Akabanga Fries', quantity: 1, priceRWF: 6000 },
          { menuItemId: 'MNU-003', name: 'Specialty Rwandan Arabica Cappuccino', quantity: 2, priceRWF: 2500 }
        ],
        totalAmountRWF: 11000,
        status: 'Ready',
        placedAt: '12:48 PM',
        notes: 'Charged to Room Folio'
      }
    ],
    ingredients: [
      { id: 'ING-01', name: 'Fresh Whole Tilapia', category: 'Fish & Poultry', currentStock: 38, unit: 'pieces', unitCostRWF: 1800, reorderLevel: 10 },
      { id: 'ING-02', name: 'Tender Beef Fillet', category: 'Meats', currentStock: 22.5, unit: 'kg', unitCostRWF: 5000, reorderLevel: 8 },
      { id: 'ING-03', name: 'Irish Potatoes (Musanze)', category: 'Produce', currentStock: 85, unit: 'kg', unitCostRWF: 1000, reorderLevel: 25 },
      { id: 'ING-04', name: 'Inyange Fresh Milk', category: 'Dairy', currentStock: 18, unit: 'liters', unitCostRWF: 1400, reorderLevel: 5 },
      { id: 'ING-05', name: 'Rwandan Arabica Coffee Beans', category: 'Dry Goods', currentStock: 12.0, unit: 'kg', unitCostRWF: 12500, reorderLevel: 3 },
      { id: 'ING-06', name: 'Vegetable Cooking Oil', category: 'Pantry', currentStock: 24, unit: 'liters', unitCostRWF: 3200, reorderLevel: 6 }
    ],
    rooms: [
      { id: 'RM-101', roomNumber: '101', roomType: 'Standard Single', floor: '1st Floor', ratePerNightRWF: 35000, status: 'Occupied', guestName: 'Jean Bosco Mugisha', checkInDate: '2026-11-05', checkOutDate: '2026-11-08' },
      { id: 'RM-102', roomNumber: '102', roomType: 'Standard Double', floor: '1st Floor', ratePerNightRWF: 45000, status: 'Available', guestName: null },
      { id: 'RM-201', roomNumber: '201', roomType: 'Executive Suite', floor: '2nd Floor', ratePerNightRWF: 75000, status: 'Occupied', guestName: 'Dr. Samuel Karenzi', checkInDate: '2026-11-04', checkOutDate: '2026-11-07' },
      { id: 'RM-202', roomNumber: '202', roomType: 'Executive Suite', floor: '2nd Floor', ratePerNightRWF: 75000, status: 'Cleaning', guestName: null },
      { id: 'RM-301', roomNumber: '301', roomType: 'Penthouse View', floor: '3rd Floor', ratePerNightRWF: 120000, status: 'Reserved', guestName: 'EcoBank Delegation', checkInDate: '2026-11-08', checkOutDate: '2026-11-12' }
    ],
    guestFolios: [
      {
        id: 'FOL-201',
        roomNumber: '201',
        guestName: 'Dr. Samuel Karenzi',
        phone: '+250 788 345 678',
        checkInDate: '2026-11-04',
        checkOutDate: '2026-11-07',
        status: 'Active Stay',
        roomChargesRWF: 225000, // 3 nights @ 75k
        diningChargesRWF: 38500, // posted room service
        laundryExtrasRWF: 8000,
        totalFolioRWF: 271500,
        paidDepositRWF: 150000,
        balanceDueRWF: 121500
      }
    ],
    wasteLogs: [
      { id: 'WST-01', date: '2026-11-05', item: 'Irish Potatoes (Musanze)', quantity: 2.5, unit: 'kg', estimatedCostRWF: 2500, reason: 'Peeled excess spoilage', loggedBy: 'Sous Chef David' }
    ]
  },

  restaurant: {
    id: 'restaurant',
    name: 'Bistro, Cafe & Dining Bar',
    category: 'Commercial Restaurant & Cafe',
    iconName: 'UtensilsCrossed',
    businessName: 'Gisimenti Urban Bistro & Grill',
    headline: 'High-Turnover Table Ordering, Kitchen Display & Recipe Costing',
    description: 'Designed purely for food and beverage venues without lodging: focus on portion margins, table turnarounds, and fast bill settlement.',
    attentionHeadline: 'Garden Tables Active · Average Table Turnaround 42 Min',
    activeMode: 'restaurant',
    menuItems: [
      {
        id: 'MNU-R01',
        name: 'Whole Grilled Tilapia & Chips',
        category: 'Main Dishes',
        sellingPriceRWF: 8000,
        recipeCostRWF: 2700,
        foodCostPercent: 33.7,
        preparationTimeMin: 25,
        status: 'Available',
        ingredients: [
          { name: 'Fresh Tilapia', quantity: 1, unit: 'piece', costRWF: 1750 },
          { name: 'Chips Potatoes', quantity: 0.3, unit: 'kg', costRWF: 450 },
          { name: 'Oil & Spices', quantity: 1, unit: 'portion', costRWF: 500 }
        ]
      },
      {
        id: 'MNU-R02',
        name: 'Chicken Brochettes Platter (3 pcs)',
        category: 'Quick Bites',
        sellingPriceRWF: 5000,
        recipeCostRWF: 1600,
        foodCostPercent: 32.0,
        preparationTimeMin: 18,
        status: 'Available',
        ingredients: [
          { name: 'Chicken Breast Boneless', quantity: 0.3, unit: 'kg', costRWF: 1200 },
          { name: 'Seasoning & Oil', quantity: 1, unit: 'portion', costRWF: 400 }
        ]
      }
    ],
    kitchenOrders: [
      {
        id: 'KOT-R01',
        orderNumber: 'ORD-201',
        orderType: 'Dine-In',
        destination: 'Table #02',
        items: [{ menuItemId: 'MNU-R01', name: 'Whole Grilled Tilapia & Chips', quantity: 1, priceRWF: 8000 }],
        totalAmountRWF: 8000,
        status: 'Cooking',
        placedAt: '1:10 PM',
        notes: 'Well done crispy skin'
      }
    ],
    ingredients: [
      { id: 'ING-R01', name: 'Fresh Tilapia', category: 'Fish & Poultry', currentStock: 45, unit: 'pieces', unitCostRWF: 1750, reorderLevel: 12 },
      { id: 'ING-R02', name: 'Chicken Breast Boneless', category: 'Fish & Poultry', currentStock: 16.0, unit: 'kg', unitCostRWF: 4000, reorderLevel: 5 }
    ],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  hotel: {
    id: 'hotel',
    name: 'Boutique Lodge & Guesthouse',
    category: 'Accommodation & Hospitality',
    iconName: 'BedDouble',
    businessName: 'Kivu Serene Eco-Lodge & Suites',
    headline: 'Room Reservations, Nightly Occupancy & Guest Check-In Engine',
    description: 'Designed specifically for lodges, guesthouses, and boutique hotels tracking room status, housekeeping, and guest billing.',
    attentionHeadline: '90% Weekend Occupancy Booked · 6 Rooms Checked-In',
    activeMode: 'rooms',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [
      { id: 'RM-L01', roomNumber: '101', roomType: 'Lake View Deluxe', floor: 'Ground', ratePerNightRWF: 60000, status: 'Occupied', guestName: 'Alice Mukamana', checkInDate: '2026-11-06', checkOutDate: '2026-11-09' },
      { id: 'RM-L02', roomNumber: '102', roomType: 'Garden Villa', floor: 'Ground', ratePerNightRWF: 85000, status: 'Occupied', guestName: 'Marc Dubois', checkInDate: '2026-11-05', checkOutDate: '2026-11-07' },
      { id: 'RM-L03', roomNumber: '103', roomType: 'Family Suite', floor: 'Ground', ratePerNightRWF: 110000, status: 'Available', guestName: null }
    ],
    guestFolios: [
      {
        id: 'FOL-L01',
        roomNumber: '101',
        guestName: 'Alice Mukamana',
        phone: '+250 788 123 456',
        checkInDate: '2026-11-06',
        checkOutDate: '2026-11-09',
        status: 'Active Stay',
        roomChargesRWF: 180000,
        diningChargesRWF: 0,
        laundryExtrasRWF: 0,
        totalFolioRWF: 180000,
        paidDepositRWF: 180000,
        balanceDueRWF: 0
      }
    ],
    wasteLogs: []
  },

  fastFood: {
    id: 'fastFood',
    name: 'Cloud Kitchen & Fast Food',
    category: 'High-Speed Takeaway & Delivery',
    iconName: 'Flame',
    businessName: 'Kigali Crispy & Cloud Wings Hub',
    headline: 'Rapid Ticket Dispatch, Takeaway Queue & Packaging Control',
    description: 'Streamlined for express burger bars, fried chicken, takeaway pizzerias, and cloud kitchens with zero table overhead.',
    attentionHeadline: 'Peak Lunch Dispatch · 14 Takeaways Completed Today',
    activeMode: 'restaurant',
    menuItems: [
      {
        id: 'MNU-F01',
        name: 'Crispy Wings Box (8 pcs + Fries)',
        category: 'Quick Bites',
        sellingPriceRWF: 5500,
        recipeCostRWF: 1750,
        foodCostPercent: 31.8,
        preparationTimeMin: 12,
        status: 'Available',
        ingredients: [
          { name: 'Chicken Wings Raw', quantity: 0.4, unit: 'kg', costRWF: 1200 },
          { name: 'Seasoned Breading & Oil', quantity: 1, unit: 'portion', costRWF: 350 },
          { name: 'Eco Packaging Box', quantity: 1, unit: 'piece', costRWF: 200 }
        ]
      }
    ],
    kitchenOrders: [],
    ingredients: [
      { id: 'ING-F01', name: 'Chicken Wings Raw', category: 'Meats', currentStock: 35.0, unit: 'kg', unitCostRWF: 3000, reorderLevel: 10 },
      { id: 'ING-F02', name: 'Eco Packaging Box', category: 'Packaging', currentStock: 250, unit: 'pieces', unitCostRWF: 200, reorderLevel: 50 }
    ],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  catering: {
    id: 'catering',
    name: 'Catering & Event Banquets',
    category: 'Outside Catering & Buffets',
    iconName: 'Receipt',
    businessName: 'Imvaho Royal Catering & Events',
    headline: 'Per-Head Buffet Costing, Event Contracts & Equipment Rentals',
    description: 'Manage wedding buffets, corporate retreats, equipment hire (chafing dishes, tents), and per-plate costing.',
    attentionHeadline: 'Corporate Gala Contract Confirmed (150 Plates)',
    activeMode: 'restaurant',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  cleanSlate: {
    id: 'cleanSlate',
    name: 'Clean Slate (Zero-Base Setup)',
    category: 'Empty Starting Point',
    iconName: 'RefreshCw',
    businessName: 'My Hospitality Enterprise',
    headline: 'Start with Fresh Empty Ledger',
    description: 'Configure your custom menu, rooms, and recipes from scratch with zero demo data.',
    attentionHeadline: 'Ready for Setup · Add your first menu item or room',
    activeMode: 'both',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  other: {
    id: 'other',
    name: 'Custom Hospitality Model',
    category: 'Specialized Tourism & Agro-Resorts',
    iconName: 'HelpCircle',
    businessName: 'Custom Hospitality Partner',
    headline: 'Talk Directly with Our Agribusiness & Hospitality Specialists',
    description: 'We configure custom multi-branch resorts, lake cruises, and agro-tourism hubs for you.',
    attentionHeadline: 'Direct Engineering Consultation Available',
    isSupportContact: true,
    whatsappNumber: '+250 781 963 981',
    whatsappMessage: 'Hello EXCELLENCE BOS Team, I run a specialized hospitality/dining business and need a custom setup.'
  }
}

