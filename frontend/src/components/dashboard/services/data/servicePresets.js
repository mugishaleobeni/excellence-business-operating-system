/**
 * Service Trade Presets for Architecture 03 (Service-Based Business)
 * Fully zero-base compatible, instant operational configurations for real SMEs.
 * No emojis used; clean Lucide icon names mapped.
 */

export const SERVICE_PRESETS = {
  salon: {
    id: 'salon',
    name: 'Salons, Spas & Beauty Care',
    category: 'Beauty, Hair & Personal Grooming',
    iconName: 'Scissors',
    businessName: 'Lumina Aesthetics & Hair Studio',
    headline: 'Walk-ins, Styling Stations & Staff Commission Engine',
    description: 'Hair styling, barbering, facial treatments, spa sessions with chair bookings and stylist commission.',
    attentionHeadline: 'Hair & Spa Stations Live · 4 Appointments Today',
    staffLabel: 'Stylists & Barbers',
    clientAssetLabel: 'Client Preferences',
    standardDuration: '45 mins',
    defaultCommission: 30,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Hair Styling', 'Barbering', 'Hair Care', 'Nails & Spa', 'Facials']
  },

  garage: {
    id: 'garage',
    name: 'Auto Garages & Vehicle Workshops',
    category: 'Automotive Mechanics & Maintenance',
    iconName: 'Wrench',
    businessName: 'Precision Auto Garage',
    headline: 'Job Cards, Diagnostic Intake & Spare Parts Ledger',
    description: 'Vehicle maintenance, diagnostics, engine overhauls, brake pad replacement and mechanic labor.',
    attentionHeadline: 'Garage Bays Active · Ready for vehicle intake',
    staffLabel: 'Mechanics & Technicians',
    clientAssetLabel: 'Vehicle Plate & Mileage',
    standardDuration: '90 mins',
    defaultCommission: 25,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Scheduled Maintenance', 'Brakes & Safety', 'Diagnostics', 'Suspension & Steering', 'Electrical & Battery']
  },

  electronics: {
    id: 'electronics',
    name: 'Phone, Computer & Electronic Repair',
    category: 'Hardware Repair & Technical IT',
    iconName: 'Smartphone',
    businessName: 'Electronics & Repair Hub',
    headline: 'Intake Tickets, IMEI Logging & Solder Bench Jobs',
    description: 'Smartphone screens, motherboard micro-soldering, laptop repairs, and component parts inventory.',
    attentionHeadline: 'Bench Open · Ready for device intake',
    staffLabel: 'Hardware Technicians',
    clientAssetLabel: 'Device Model & Serial/IMEI',
    standardDuration: '60 mins',
    defaultCommission: 30,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Screen Repair', 'Logic Board Repair', 'Laptop Services', 'Data Recovery', 'Battery & Power']
  },

  agency: {
    id: 'agency',
    name: 'Consulting, Legal & Creative Agencies',
    category: 'Professional Services & Consulting',
    iconName: 'Briefcase',
    businessName: 'Consulting & Media Group',
    headline: 'Retainers, Milestone Billing & Client Deliverables',
    description: 'Management consulting, legal advice, branding campaigns, and custom software delivery.',
    attentionHeadline: 'Client Contracts · Retainers Active',
    staffLabel: 'Consultants & Creatives',
    clientAssetLabel: 'Project Name & Milestone',
    standardDuration: 'Milestone',
    defaultCommission: 20,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Tax & Finance', 'Creative Design', 'Legal Advisory', 'IT & Software', 'Management Strategy']
  },

  cleaning: {
    id: 'cleaning',
    name: 'Cleaning, Fumigation & Facilities',
    category: 'Facility Management & Environmental Sanitation',
    iconName: 'Sparkles',
    businessName: 'Cleaning & Pest Defense',
    headline: 'Job Sites, Sqm Pricing & Chemical Supplies Allocation',
    description: 'Deep residential cleaning, commercial sanitization, pest fumigation, and post-construction sweeps.',
    attentionHeadline: 'Job Dispatches Ready · All supplies accounted for',
    staffLabel: 'Dispatch Crews',
    clientAssetLabel: 'Site Location / Building',
    standardDuration: '120 mins',
    defaultCommission: 20,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Residential Cleaning', 'Pest Control', 'Commercial Maintenance', 'Carpet & Upholstery']
  },

  studio: {
    id: 'studio',
    name: 'Photography, Videography & Media Studios',
    category: 'Creative Media & Content Production',
    iconName: 'Camera',
    businessName: 'Visuals & Media Studio',
    headline: 'Shoot Dates, Studio Time & Gear Checklists',
    description: 'Wedding shoots, commercial video ads, studio portraits, and podcast booth sessions.',
    attentionHeadline: 'Studio Ready · Available for bookings',
    staffLabel: 'Photographers & Videographers',
    clientAssetLabel: 'Shoot Type & Location',
    standardDuration: '60 mins',
    defaultCommission: 25,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['Portrait Studio', 'Event Media', 'Commercial Ads', 'Podcast Studio']
  },

  'clean-slate': {
    id: 'clean-slate',
    name: 'Clean Slate (Zero-Base Custom Setup)',
    category: 'Blank Operational Workspace',
    iconName: 'Layers',
    businessName: 'My Service Enterprise',
    headline: '100% Blank Slate for Direct Production Data Entry',
    description: 'Wipes all sample records completely to 0. Add your real service catalogue, staff and appointments.',
    attentionHeadline: 'Blank Slate Ready · Start recording your live services',
    staffLabel: 'Staff Members',
    clientAssetLabel: 'Customer / Job Notes',
    standardDuration: '60 mins',
    defaultCommission: 0,
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: ['General Services', 'Consulting', 'Labor']
  },

  other: {
    id: 'other',
    name: 'Other Trade / Not Listed (Direct Support)',
    category: 'Custom & Specialized Services',
    iconName: 'HelpCircle',
    businessName: 'Custom Service Workshop',
    headline: 'Direct Helpdesk & WhatsApp Implementation Support',
    description: 'Need a custom service workflow? Contact our official ExBOS implementation team directly on WhatsApp.',
    attentionHeadline: 'Dedicated SME Support line: +250 781 963 981',
    isSupportContact: true,
    whatsappNumber: '+250781963981',
    whatsappFormatted: '+250 781 963 981',
    whatsappMessage: 'Hello ExBOS Support, I need assistance setting up my specialized service-based business workflow.',
    services: [],
    consumables: [],
    staff: [],
    jobs: [],
    categories: []
  }
}

export const SERVICE_TRADE_LIST = Object.values(SERVICE_PRESETS)
