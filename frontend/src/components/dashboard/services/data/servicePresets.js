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
    services: [
      {
        id: 'SRV-SAL-01',
        name: "Women's Braiding & Styling",
        category: 'Hair Styling',
        durationMins: 90,
        priceRWF: 25000,
        commissionPct: 35,
        linkedConsumables: [
          { name: 'Hair Conditioning Cream', qty: 1, unit: 'pcs', unitCostRWF: 2500 },
          { name: 'Braiding Thread', qty: 2, unit: 'rolls', unitCostRWF: 1000 }
        ],
        active: true
      },
      {
        id: 'SRV-SAL-02',
        name: "Men's Fade & Hot Towel Beard Trim",
        category: 'Barbering',
        durationMins: 35,
        priceRWF: 6000,
        commissionPct: 30,
        linkedConsumables: [{ name: 'Aftershave Balm & Cotton', qty: 1, unit: 'pcs', unitCostRWF: 500 }],
        active: true
      },
      {
        id: 'SRV-SAL-03',
        name: 'Deep Scalp Wash & Keratin Treatment',
        category: 'Hair Care',
        durationMins: 60,
        priceRWF: 18000,
        commissionPct: 30,
        linkedConsumables: [{ name: 'Keratin Shampoo Dose (100ml)', qty: 1, unit: 'dose', unitCostRWF: 3200 }],
        active: true
      },
      {
        id: 'SRV-SAL-04',
        name: 'Deluxe Gel Manicure & Hand Massage',
        category: 'Nails & Spa',
        durationMins: 45,
        priceRWF: 12000,
        commissionPct: 30,
        linkedConsumables: [{ name: 'Gel Polish Coat', qty: 1, unit: 'set', unitCostRWF: 1800 }],
        active: true
      }
    ],
    consumables: [
      { id: 'CON-SAL-01', name: 'Hair Conditioning Cream', category: 'Lotions & Creams', currentStock: 24, unit: 'pcs', unitCostRWF: 2500, reorderLevel: 5 },
      { id: 'CON-SAL-02', name: 'Braiding Thread', category: 'Accessories', currentStock: 48, unit: 'rolls', unitCostRWF: 1000, reorderLevel: 10 },
      { id: 'CON-SAL-03', name: 'Keratin Shampoo (5L Salon Bottle)', category: 'Shampoos', currentStock: 4, unit: 'bottles', unitCostRWF: 32000, reorderLevel: 2 },
      { id: 'CON-SAL-04', name: 'Aftershave Balm & Disinfectant', category: 'Barber Supplies', currentStock: 18, unit: 'pcs', unitCostRWF: 5000, reorderLevel: 4 },
      { id: 'CON-SAL-05', name: 'UV Gel Polish Sets', category: 'Nail Care', currentStock: 32, unit: 'bottles', unitCostRWF: 3500, reorderLevel: 6 }
    ],
    staff: [
      { id: 'STF-SAL-01', name: 'Amina Uwase', role: 'Senior Stylist', phone: '+250 788 111 222', commissionPct: 35, active: true },
      { id: 'STF-SAL-02', name: 'Kevin Ndayisaba', role: 'Master Barber', phone: '+250 788 333 444', commissionPct: 30, active: true },
      { id: 'STF-SAL-03', name: 'Diane Mukamana', role: 'Nail & Spa Tech', phone: '+250 788 555 666', commissionPct: 30, active: true }
    ],
    jobs: [
      { id: 'JOB-SAL-101', ticketNumber: 'TKT-201', customerName: 'Alice Kalisa', customerPhone: '+250 788 123 456', serviceId: 'SRV-SAL-01', serviceName: "Women's Braiding & Styling", staffId: 'STF-SAL-01', staffName: 'Amina Uwase', appointmentDate: '2026-11-05', timeSlot: '10:00 - 11:30', durationMins: 90, status: 'In Progress', priceRWF: 25000, depositPaidRWF: 10000, balanceDueRWF: 15000, notes: 'Boho box braids' },
      { id: 'JOB-SAL-102', ticketNumber: 'TKT-202', customerName: 'Patrick Gasana', customerPhone: '+250 788 987 654', serviceId: 'SRV-SAL-02', serviceName: "Men's Fade & Hot Towel Beard Trim", staffId: 'STF-SAL-02', staffName: 'Kevin Ndayisaba', appointmentDate: '2026-11-05', timeSlot: '11:45 - 12:20', durationMins: 35, status: 'Booked', priceRWF: 6000, depositPaidRWF: 0, balanceDueRWF: 6000, notes: 'Low taper fade' },
      { id: 'JOB-SAL-103', ticketNumber: 'TKT-203', customerName: 'Chantal Umutoni', customerPhone: '+250 788 345 678', serviceId: 'SRV-SAL-04', serviceName: 'Deluxe Gel Manicure & Hand Massage', staffId: 'STF-SAL-03', staffName: 'Diane Mukamana', appointmentDate: '2026-11-05', timeSlot: '09:00 - 09:45', durationMins: 45, status: 'Completed', priceRWF: 12000, depositPaidRWF: 12000, balanceDueRWF: 0, notes: 'French manicure' }
    ],
    categories: ['Hair Styling', 'Barbering', 'Hair Care', 'Nails & Spa', 'Facials']
  },

  garage: {
    id: 'garage',
    name: 'Auto Garages & Vehicle Workshops',
    category: 'Automotive Mechanics & Maintenance',
    iconName: 'Wrench',
    businessName: 'Gikondo Precision Auto Garage',
    headline: 'Job Cards, Diagnostic Intake & Spare Parts Ledger',
    description: 'Vehicle maintenance, diagnostics, engine overhauls, brake pad replacement and mechanic labor.',
    attentionHeadline: 'Garage Bays Active · 3 Vehicles Under Service',
    staffLabel: 'Mechanics & Technicians',
    clientAssetLabel: 'Vehicle Plate & Mileage',
    standardDuration: '90 mins',
    defaultCommission: 25,
    services: [
      {
        id: 'SRV-GAR-01',
        name: 'Full Synthetic Engine Oil & Filter Service',
        category: 'Scheduled Maintenance',
        durationMins: 60,
        priceRWF: 45000,
        commissionPct: 25,
        linkedConsumables: [
          { name: '10W-40 Synthetic Oil (4L)', qty: 1, unit: 'can', unitCostRWF: 24000 },
          { name: 'Universal Oil Filter', qty: 1, unit: 'pcs', unitCostRWF: 6000 }
        ],
        active: true
      },
      {
        id: 'SRV-GAR-02',
        name: 'Front Brake Pads Replacement & Rotor Bleed',
        category: 'Brakes & Safety',
        durationMins: 90,
        priceRWF: 35000,
        commissionPct: 25,
        linkedConsumables: [
          { name: 'Brake Pad Set (Front)', qty: 1, unit: 'pair', unitCostRWF: 18000 },
          { name: 'DOT 4 Brake Fluid', qty: 1, unit: 'bottle', unitCostRWF: 3500 }
        ],
        active: true
      },
      {
        id: 'SRV-GAR-03',
        name: 'Computerized OBD-II Engine Diagnostics',
        category: 'Diagnostics',
        durationMins: 45,
        priceRWF: 20000,
        commissionPct: 30,
        linkedConsumables: [],
        active: true
      }
    ],
    consumables: [
      { id: 'CON-GAR-01', name: '10W-40 Synthetic Engine Oil (4L)', category: 'Lubricants', currentStock: 16, unit: 'cans', unitCostRWF: 24000, reorderLevel: 4 },
      { id: 'CON-GAR-02', name: 'Universal Oil Filter (Toyota/Nissan)', category: 'Filters', currentStock: 22, unit: 'pcs', unitCostRWF: 6000, reorderLevel: 5 },
      { id: 'CON-GAR-03', name: 'Ceramic Front Brake Pads', category: 'Brake Parts', currentStock: 12, unit: 'pairs', unitCostRWF: 18000, reorderLevel: 3 },
      { id: 'CON-GAR-04', name: 'DOT 4 Hydraulic Brake Fluid', category: 'Fluids', currentStock: 20, unit: 'bottles', unitCostRWF: 3500, reorderLevel: 5 }
    ],
    staff: [
      { id: 'STF-GAR-01', name: 'Jean-Pierre Habimana', role: 'Lead Mechanic', phone: '+250 788 200 300', commissionPct: 25, active: true },
      { id: 'STF-GAR-02', name: 'Eric Ntwari', role: 'Diagnostic Tech', phone: '+250 788 400 500', commissionPct: 30, active: true }
    ],
    jobs: [
      { id: 'JOB-GAR-101', ticketNumber: 'JOB-RAD-420B', customerName: 'Kigali Logistics Ltd', customerPhone: '+250 788 567 890', serviceId: 'SRV-GAR-01', serviceName: 'Full Synthetic Engine Oil & Filter Service', staffId: 'STF-GAR-01', staffName: 'Jean-Pierre Habimana', appointmentDate: '2026-11-05', timeSlot: '09:30 - 10:45', durationMins: 60, status: 'In Progress', priceRWF: 45000, depositPaidRWF: 20000, balanceDueRWF: 25000, notes: 'Toyota RAV4 (Plate: RAD 420 B)' },
      { id: 'JOB-GAR-102', ticketNumber: 'JOB-RAC-109C', customerName: 'Marc Rukundo', customerPhone: '+250 788 234 567', serviceId: 'SRV-GAR-02', serviceName: 'Front Brake Pads Replacement & Rotor Bleed', staffId: 'STF-GAR-01', staffName: 'Jean-Pierre Habimana', appointmentDate: '2026-11-05', timeSlot: '14:00 - 15:30', durationMins: 90, status: 'Booked', priceRWF: 35000, depositPaidRWF: 15000, balanceDueRWF: 20000, notes: 'Mercedes C200 (Plate: RAC 109 C)' }
    ],
    categories: ['Scheduled Maintenance', 'Brakes & Safety', 'Diagnostics', 'Suspension & Steering', 'Electrical & Battery']
  },

  electronics: {
    id: 'electronics',
    name: 'Phone, Computer & Electronic Repair',
    category: 'Hardware Repair & Technical IT',
    iconName: 'Smartphone',
    businessName: 'TechPulse Electronics & Repair Hub',
    headline: 'Intake Tickets, IMEI Logging & Solder Bench Jobs',
    description: 'Smartphone screens, motherboard micro-soldering, laptop repairs, and component parts inventory.',
    attentionHeadline: 'Bench Open · 5 Repair Devices in Queue',
    staffLabel: 'Hardware Technicians',
    clientAssetLabel: 'Device Model & Serial/IMEI',
    standardDuration: '60 mins',
    defaultCommission: 30,
    services: [
      {
        id: 'SRV-ELE-01',
        name: 'OLED Display & Digitizer Replacement',
        category: 'Screen Repair',
        durationMins: 60,
        priceRWF: 55000,
        commissionPct: 30,
        linkedConsumables: [{ name: 'Samsung OLED Screen Assembly', qty: 1, unit: 'pcs', unitCostRWF: 32000 }],
        active: true
      },
      {
        id: 'SRV-ELE-02',
        name: 'Motherboard Micro-Soldering & Charging IC',
        category: 'Logic Board Repair',
        durationMins: 120,
        priceRWF: 45000,
        commissionPct: 35,
        linkedConsumables: [{ name: 'Charging IC Chip & Solder Flux', qty: 1, unit: 'set', unitCostRWF: 8000 }],
        active: true
      }
    ],
    consumables: [
      { id: 'CON-ELE-01', name: 'Samsung OLED Screen Assemblies', category: 'Screens', currentStock: 14, unit: 'pcs', unitCostRWF: 32000, reorderLevel: 3 },
      { id: 'CON-ELE-02', name: 'iPhone Grade-A Screen Panels', category: 'Screens', currentStock: 18, unit: 'pcs', unitCostRWF: 28000, reorderLevel: 4 },
      { id: 'CON-ELE-03', name: 'Universal High-Capacity Batteries', category: 'Batteries', currentStock: 25, unit: 'pcs', unitCostRWF: 12000, reorderLevel: 5 }
    ],
    staff: [
      { id: 'STF-ELE-01', name: 'Patrick Mugisha', role: 'Master Soldering Specialist', phone: '+250 788 600 700', commissionPct: 35, active: true },
      { id: 'STF-ELE-02', name: 'David Karangwa', role: 'Mobile Screen Tech', phone: '+250 788 800 900', commissionPct: 30, active: true }
    ],
    jobs: [
      { id: 'JOB-ELE-101', ticketNumber: 'TKT-IPH-901', customerName: 'Didier Mugabo', customerPhone: '+250 788 456 789', serviceId: 'SRV-ELE-01', serviceName: 'OLED Display & Digitizer Replacement', staffId: 'STF-ELE-02', staffName: 'David Karangwa', appointmentDate: '2026-11-05', timeSlot: '11:00 - 12:00', durationMins: 60, status: 'In Progress', priceRWF: 55000, depositPaidRWF: 30000, balanceDueRWF: 25000, notes: 'iPhone 13 (Serial: F2LZ78)' }
    ],
    categories: ['Screen Repair', 'Logic Board Repair', 'Laptop Services', 'Data Recovery', 'Battery & Power']
  },

  agency: {
    id: 'agency',
    name: 'Consulting, Legal & Creative Agencies',
    category: 'Professional Services & Consulting',
    iconName: 'Briefcase',
    businessName: 'Kigali Horizon Consulting & Media Group',
    headline: 'Retainers, Milestone Billing & Client Deliverables',
    description: 'Management consulting, legal advice, branding campaigns, and custom software delivery.',
    attentionHeadline: '3 Active Client Contracts · Q4 Retainers Active',
    staffLabel: 'Consultants & Creatives',
    clientAssetLabel: 'Project Name & Milestone',
    standardDuration: 'Milestone',
    defaultCommission: 20,
    services: [
      { id: 'SRV-AGN-01', name: 'RRA Corporate Tax Audit & Advisory', category: 'Tax & Finance', durationMins: 180, priceRWF: 250000, commissionPct: 20, linkedConsumables: [], active: true },
      { id: 'SRV-AGN-02', name: 'Brand Identity & Visual Design Package', category: 'Creative Design', durationMins: 240, priceRWF: 350000, commissionPct: 25, linkedConsumables: [], active: true }
    ],
    consumables: [
      { id: 'CON-AGN-01', name: 'Executive Presentation Portfolios', category: 'Office Supplies', currentStock: 30, unit: 'pcs', unitCostRWF: 4000, reorderLevel: 5 }
    ],
    staff: [
      { id: 'STF-AGN-01', name: 'Clarisse Mukandoli', role: 'Managing Partner', phone: '+250 788 777 888', commissionPct: 20, active: true },
      { id: 'STF-AGN-02', name: 'Marc Byiringiro', role: 'Creative Director', phone: '+250 788 999 000', commissionPct: 25, active: true }
    ],
    jobs: [
      { id: 'JOB-AGN-101', ticketNumber: 'PRJ-2026-TAX', customerName: 'Great Lakes Agrico Ltd', customerPhone: '+250 788 123 789', serviceId: 'SRV-AGN-01', serviceName: 'RRA Corporate Tax Audit & Advisory', staffId: 'STF-AGN-01', staffName: 'Clarisse Mukandoli', appointmentDate: '2026-11-05', timeSlot: '14:00 - 17:00', durationMins: 180, status: 'In Progress', priceRWF: 250000, depositPaidRWF: 125000, balanceDueRWF: 125000, notes: 'FY2025 financial audit books' }
    ],
    categories: ['Tax & Finance', 'Creative Design', 'Legal Advisory', 'IT & Software', 'Management Strategy']
  },

  cleaning: {
    id: 'cleaning',
    name: 'Cleaning, Fumigation & Facilities',
    category: 'Facility Management & Environmental Sanitation',
    iconName: 'Sparkles',
    businessName: 'SparklePro Cleaning & Pest Defense',
    headline: 'Job Sites, Sqm Pricing & Chemical Supplies Allocation',
    description: 'Deep residential cleaning, commercial sanitization, pest fumigation, and post-construction sweeps.',
    attentionHeadline: '4 Job Dispatches Active Today',
    staffLabel: 'Dispatch Crews',
    clientAssetLabel: 'Site Location / Building',
    standardDuration: '120 mins',
    defaultCommission: 20,
    services: [
      { id: 'SRV-CLN-01', name: 'Deep Residential Villa Cleaning (4-Bed)', category: 'Residential Cleaning', durationMins: 240, priceRWF: 50000, commissionPct: 20, linkedConsumables: [{ name: 'Floor Disinfectant (2L)', qty: 1, unit: 'bottle', unitCostRWF: 4500 }], active: true },
      { id: 'SRV-CLN-02', name: 'Commercial Office Sanitization & Fumigation', category: 'Pest Control', durationMins: 120, priceRWF: 75000, commissionPct: 20, linkedConsumables: [{ name: 'Pyrethroid Insecticide Concentrate (1L)', qty: 1, unit: 'can', unitCostRWF: 18000 }], active: true }
    ],
    consumables: [
      { id: 'CON-CLN-01', name: 'Industrial Floor Disinfectant (5L)', category: 'Detergents', currentStock: 18, unit: 'cans', unitCostRWF: 9500, reorderLevel: 4 },
      { id: 'CON-CLN-02', name: 'Pyrethroid Insecticide Concentrate (1L)', category: 'Pest Chemicals', currentStock: 12, unit: 'cans', unitCostRWF: 18000, reorderLevel: 3 }
    ],
    staff: [
      { id: 'STF-CLN-01', name: 'Emmanuel Habineza', role: 'Crew Supervisor', phone: '+250 788 321 654', commissionPct: 20, active: true }
    ],
    jobs: [
      { id: 'JOB-CLN-101', ticketNumber: 'CLN-NYA-04', customerName: 'Prime Real Estate Ltd', customerPhone: '+250 788 654 321', serviceId: 'SRV-CLN-02', serviceName: 'Commercial Office Sanitization & Fumigation', staffId: 'STF-CLN-01', staffName: 'Emmanuel Habineza', appointmentDate: '2026-11-05', timeSlot: '15:00 - 17:00', durationMins: 120, status: 'Booked', priceRWF: 75000, depositPaidRWF: 40000, balanceDueRWF: 35000, notes: 'Nyugenge Commercial Plaza' }
    ],
    categories: ['Residential Cleaning', 'Pest Control', 'Commercial Maintenance', 'Carpet & Upholstery']
  },

  studio: {
    id: 'studio',
    name: 'Photography, Videography & Media Studios',
    category: 'Creative Media & Content Production',
    iconName: 'Camera',
    businessName: 'Kigali Lightworks Visuals & Studio',
    headline: 'Shoot Dates, Studio Time & Gear Checklists',
    description: 'Wedding shoots, commercial video ads, studio portraits, and podcast booth sessions.',
    attentionHeadline: 'Studio Ready · 2 Shoots Booked This Weekend',
    staffLabel: 'Photographers & Videographers',
    clientAssetLabel: 'Shoot Type & Location',
    standardDuration: '60 mins',
    defaultCommission: 25,
    services: [
      { id: 'SRV-STU-01', name: 'Executive Studio Portrait (5 Retouched)', category: 'Portrait Studio', durationMins: 45, priceRWF: 35000, commissionPct: 25, linkedConsumables: [], active: true },
      { id: 'SRV-STU-02', name: 'Full Wedding Ceremony & Reception Coverage', category: 'Event Media', durationMins: 480, priceRWF: 450000, commissionPct: 30, linkedConsumables: [{ name: '128GB High-Speed SD Cards', qty: 2, unit: 'pcs', unitCostRWF: 16000 }], active: true }
    ],
    consumables: [
      { id: 'CON-STU-01', name: '128GB High-Speed SD Cards', category: 'Media', currentStock: 15, unit: 'pcs', unitCostRWF: 16000, reorderLevel: 3 }
    ],
    staff: [
      { id: 'STF-STU-01', name: 'Christian Mugenzi', role: 'Principal Photographer', phone: '+250 788 112 233', commissionPct: 30, active: true }
    ],
    jobs: [
      { id: 'JOB-STU-101', ticketNumber: 'SHT-2026-WED', customerName: 'Jean & Fiona Wedding', customerPhone: '+250 788 998 877', serviceId: 'SRV-STU-02', serviceName: 'Full Wedding Ceremony & Reception Coverage', staffId: 'STF-STU-01', staffName: 'Christian Mugenzi', appointmentDate: '2026-11-08', timeSlot: '08:00 - 18:00', durationMins: 480, status: 'Booked', priceRWF: 450000, depositPaidRWF: 200000, balanceDueRWF: 250000, notes: 'Kigali Serena Hotel' }
    ],
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
