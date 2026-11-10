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
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  restaurant: {
    id: 'restaurant',
    name: 'Bistro, Cafe & Dining Bar',
    category: 'Commercial Restaurant & Cafe',
    iconName: 'UtensilsCrossed',
    businessName: 'Urban Bistro & Grill',
    headline: 'High-Turnover Table Ordering, Kitchen Display & Recipe Costing',
    description: 'Designed purely for food and beverage venues without lodging: focus on portion margins, table turnarounds, and fast bill settlement.',
    attentionHeadline: 'Dining Tables Ready · Kitchen Display Active',
    activeMode: 'restaurant',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  hotel: {
    id: 'hotel',
    name: 'Boutique Lodge & Guesthouse',
    category: 'Accommodation & Hospitality',
    iconName: 'BedDouble',
    businessName: 'Lodge & Suites',
    headline: 'Room Reservations, Nightly Occupancy & Guest Check-In Engine',
    description: 'Designed specifically for lodges, guesthouses, and boutique hotels tracking room status, housekeeping, and guest billing.',
    attentionHeadline: 'Lodging Registry Active · Ready for guest check-ins',
    activeMode: 'rooms',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
    rooms: [],
    guestFolios: [],
    wasteLogs: []
  },

  fastFood: {
    id: 'fastFood',
    name: 'Cloud Kitchen & Fast Food',
    category: 'High-Speed Takeaway & Delivery',
    iconName: 'Flame',
    businessName: 'Cloud Kitchen & Takeaway',
    headline: 'Rapid Ticket Dispatch, Takeaway Queue & Packaging Control',
    description: 'Streamlined for express burger bars, fried chicken, takeaway pizzerias, and cloud kitchens with zero table overhead.',
    attentionHeadline: 'Express Dispatch Ready · Kitchen order queue active',
    activeMode: 'restaurant',
    menuItems: [],
    kitchenOrders: [],
    ingredients: [],
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

