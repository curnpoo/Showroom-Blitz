import type { Car, Customer, Coworker, PersonalityType, BuyerType, DesiredFeature, VehicleCategory } from '../types/game';

// Realistic 2026 Hyundai base prices (MSRP)
const MODEL_BASE_PRICES: Record<string, number> = {
  'Venue': 20500,      // Subcompact SUV
  'Kona': 24500,       // Compact SUV
  'Elantra': 22500,    // Compact Sedan
  'Tucson': 30500,     // Compact SUV
  'Sonata': 28500,     // Midsize Sedan
  'Santa Fe': 36500,   // Midsize SUV
  'Ioniq 5': 44500,    // Electric SUV
  'Ioniq 6': 46500,    // Electric Sedan
  'Palisade': 50500,   // Full-size SUV
};

// Trim level price additions (percentage of base)
const TRIM_MULTIPLIERS: Record<string, number> = {
  'SE': 1.0,           // Base trim
  'SEL': 1.08,         // +8%
  'N Line': 1.12,      // +12% (sport)
  'Limited': 1.18,     // +18%
  'Ultimate': 1.25,    // +25%
  'Calligraphy': 1.30, // +30% (luxury)
};

// Which trims are available per model (not all models have all trims)
const MODEL_TRIMS: Record<string, string[]> = {
  'Venue': ['SE', 'SEL', 'Limited'],
  'Kona': ['SE', 'SEL', 'N Line', 'Limited'],
  'Elantra': ['SE', 'SEL', 'N Line', 'Limited'],
  'Tucson': ['SE', 'SEL', 'N Line', 'Limited'],
  'Sonata': ['SE', 'SEL', 'N Line', 'Limited'],
  'Santa Fe': ['SE', 'SEL', 'Limited', 'Calligraphy'],
  'Ioniq 5': ['SE', 'SEL', 'Limited'],
  'Ioniq 6': ['SE', 'SEL', 'Limited'],
  'Palisade': ['SE', 'SEL', 'Limited', 'Calligraphy'],
};

const MODELS = Object.keys(MODEL_BASE_PRICES);
const COLORS = ['White', 'Black', 'Silver', 'Blue', 'Red', 'Gray', 'Green'];
const FIRST_NAMES = ['Alex', 'Sarah', 'Marcus', 'Jessica', 'David', 'Emily', 'James', 'Lisa', 'Michael', 'Amanda', 'Chris', 'Nicole', 'Brian', 'Ashley', 'Kevin'];
const LAST_NAMES = ['Rivera', 'Chen', 'Johnson', 'Smith', 'Williams', 'Garcia', 'Martinez', 'Davis', 'Miller', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];
const BUYER_TYPES: BuyerType[] = ['cash', 'payment'];
const PERSONALITIES: PersonalityType[] = ['friendly', 'serious', 'skeptical', 'enthusiastic', 'analytical'];
const DESIRED_FEATURES: DesiredFeature[] = ['sporty', 'fuel_efficient', 'luxury', 'family', 'affordable', 'tech', 'spacious', 'reliable'];

// Vehicle category preferences - customers may ask for a specific type or be flexible
const VEHICLE_CATEGORIES: VehicleCategory[] = ['suv', 'sedan', 'electric', 'hybrid', 'affordable', 'luxury'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomCategory(): VehicleCategory {
  if (Math.random() < 0.4) {
    return 'any'; // Not picky
  }
  return pickRandom(VEHICLE_CATEGORIES);
}

// Helper to get features that actually exist for a given model or category
function getCompatibleFeatures(model?: string, category?: VehicleCategory): DesiredFeature[] {
  let validFeatures = [...DESIRED_FEATURES];
  
  if (model) {
    // Filter features based on model reality
    if (model === 'Palisade' || model === 'Santa Fe') {
      validFeatures = validFeatures.filter(f => f !== 'fuel_efficient' && f !== 'sporty' && f !== 'affordable');
      validFeatures.push('family', 'spacious', 'luxury', 'tech'); // Bias towards these
    } else if (model === 'Venue' || model === 'Elantra') {
      validFeatures = validFeatures.filter(f => f !== 'luxury' && f !== 'spacious' && f !== 'family');
      validFeatures.push('affordable', 'reliable', 'fuel_efficient');
      validFeatures.push('tech', 'fuel_efficient', 'sporty');
    } else if (model === 'Ioniq 6') {
      validFeatures = validFeatures.filter(f => f !== 'affordable' && f !== 'spacious');
      validFeatures.push('tech', 'fuel_efficient', 'sporty', 'luxury');
    }
  } else if (category) {
    if (category === 'suv') {
      validFeatures = validFeatures.filter(f => f !== 'fuel_efficient' || Math.random() > 0.7); // Rare to want fuel efficient SUV unless hybrid
    } else if (category === 'sedan') {
      validFeatures = validFeatures.filter(f => f !== 'spacious');
    } else if (category === 'affordable') {
      validFeatures = validFeatures.filter(f => f !== 'luxury' && f !== 'sporty');
    }
  }
  
  return [...new Set(validFeatures)];
}

function pickRandomFeatures(model?: string, category?: VehicleCategory): DesiredFeature[] {
  const possible = getCompatibleFeatures(model, category);
  const count = 1 + Math.floor(Math.random() * 2); // 1-2 features
  const shuffled = possible.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper to determine vehicle category based on model
function getVehicleCategory(model: string, price: number): VehicleCategory {
  // Electric models
  if (model.includes('Ioniq')) return 'electric';

  // Luxury (high-end models)
  if (model === 'Palisade' || price > 45000) return 'luxury';

  // Affordable (entry-level)
  if (model === 'Venue' || model === 'Elantra' || price < 25000) return 'affordable';

  // SUVs
  if (['Venue', 'Kona', 'Tucson', 'Santa Fe', 'Palisade', 'Ioniq 5'].includes(model)) return 'suv';

  // Sedans
  if (['Elantra', 'Sonata', 'Ioniq 6'].includes(model)) return 'sedan';

  return 'any';
}

// Helper to assign features based on model and trim
// THIS IS THE SINGLE SOURCE OF TRUTH FOR VEHICLE FEATURES
function getVehicleFeatures(model: string, trim: string): DesiredFeature[] {
  const features: DesiredFeature[] = [];

  // 1. Model-based features
  if (model.includes('Ioniq')) {
    features.push('fuel_efficient', 'tech', 'sporty', 'family'); // All Ioniqs are family friendly & tech
    if (model === 'Ioniq 5') features.push('spacious'); // Only Ioniq 5 is spacious
  }

  if (model === 'Santa Fe' || model === 'Palisade') {
    features.push('family', 'spacious');
  }

  if (model === 'Tucson') {
    features.push('family', 'reliable'); // Tucson is family but not necessarily spacious unless higher trim? Let's just say family/reliable base.
    features.push('spacious'); // Actually user said Tucson is spacious or high tech? Let's stick to standard SUV traits.
  }

  if (model === 'Kona' || model === 'Venue') {
    features.push('reliable', 'affordable', 'fuel_efficient');
  }

  if (model === 'Elantra' || model === 'Sonata') {
    features.push('reliable');
    if (model === 'Elantra') features.push('affordable', 'fuel_efficient');
    if (model === 'Sonata') features.push('family'); // Midsize sedan is family friendly?
  }

  // 2. Trim-based features (The "High Tech" / "Luxury" / "Sporty" rules)
  
  // "High Tech" & "Luxury" applies to top trims
  if (trim === 'Limited' || trim === 'Ultimate' || trim === 'Calligraphy') {
    features.push('luxury', 'tech');
  }

  // "Sporty" & "Tech" applies to N Line
  if (trim === 'N Line') {
    features.push('sporty', 'tech');
  }

  // Entry level feature backfill - SE/SEL trims are always affordable
  if (trim === 'SE' || trim === 'SEL') {
     features.push('affordable');
  }

  // Ensure we have at least 2 features
  if (features.length < 2) {
    features.push('reliable');
  }

  // Remove duplicates
  return [...new Set(features)];
}

export function generateInventory(count: number = 100): Car[] {
  const inventory: Car[] = [];

  for (let i = 0; i < count; i++) {
    const model = pickRandom(MODELS);
    const availableTrims = MODEL_TRIMS[model];
    const trim = pickRandom(availableTrims);
    const color = pickRandom(COLORS);

    // Calculate price based on model + trim
    const basePrice = MODEL_BASE_PRICES[model];
    const trimMultiplier = TRIM_MULTIPLIERS[trim];
    const msrp = Math.round(basePrice * trimMultiplier);

    // Invoice is typically 92-95% of MSRP
    const invoice = Math.round(msrp * (0.92 + Math.random() * 0.03));
    const tax = Math.round(msrp * 0.07);

    inventory.push({
      id: `CAR${i + 1}`,
      model: `2026 Hyundai ${model}`,
      trim,
      color,
      price: msrp,
      invoice,
      fees: 1000,
      tax,
      otd: msrp + 1000 + tax,
      mileage: 0,
      vin: `KM8${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      features: getVehicleFeatures(model, trim),
      category: getVehicleCategory(model, msrp),
    });
  }

  return inventory;
}

export function generateCustomer(id: number, x: number, y: number): Customer {
  const buyerType = pickRandom(BUYER_TYPES);
  const personality = pickRandom(PERSONALITIES);
  
  const baseInterest = personality === 'enthusiastic' ? 60 :
                       personality === 'friendly' ? 50 :
                       personality === 'analytical' ? 45 :
                       personality === 'serious' ? 40 : 30;
  
  const temper = Math.floor(Math.random() * 100);

  // Generate specific desires (50% chance for a specific model/color)
  const hasSpecificModel = Math.random() > 0.5;
  const desiredModel = hasSpecificModel ? pickRandom(MODELS) : undefined;
  
  // If they have a model, their category MUST match that model
  let desiredCategory: VehicleCategory = 'any';
  if (desiredModel) {
    desiredCategory = getVehicleCategory(desiredModel, MODEL_BASE_PRICES[desiredModel]);
  } else {
    desiredCategory = pickRandomCategory();
  }

  const hasSpecificColor = Math.random() > 0.6;
  const desiredColor = hasSpecificColor ? pickRandom(COLORS) : undefined;

  // Generate deal breakers
  const allDealBreakers = [
    "Over MSRP Pricing",
    "High interest rate",
    "Wrong colors",
    "Unpleasant attitude",
    "Too much down payment",
    "Hidden fees",
  ];
  const dealBreakersCount = Math.floor(Math.random() * 2) + 1; // 1-2 deal breakers
  const dealBreakers = [...allDealBreakers]
    .sort(() => Math.random() - 0.5)
    .slice(0, dealBreakersCount);

  // Stubbornness (personality-based)
  let stubbornness = Math.floor(Math.random() * 3) + 1;
  if (personality === 'serious' || personality === 'analytical') stubbornness += 2;
  if (personality === 'skeptical') stubbornness += 1;

  // ~20% chance for a difficult customer who won't reveal preferences
  const isDifficult = Math.random() < 0.2;
  
  // Difficult customers have very low temper (10-30) and higher stubbornness
  const finalTemper = isDifficult ? Math.floor(10 + Math.random() * 20) : temper;
  const finalStubbornness = isDifficult ? Math.min(5, stubbornness + 2) : Math.min(5, stubbornness);

  return {
    id,
    name: `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`,
    x,
    y,
    type: 'customer',
    buyerType,
    personality,
    temper: finalTemper,
    interest: baseInterest,
    budget: buyerType === 'cash' ? (35000 + Math.floor(Math.random() * 20000)) : 0,
    maxPayment: buyerType === 'payment' ? (400 + Math.floor(Math.random() * 400)) : 0,
    desiredDown: buyerType === 'payment' ? Math.floor(Math.random() * 10001) : 0,
    conversationHistory: [],
    conversationPhase: 'greeting',
    desiredCategory,
    desiredModel,
    desiredFeatures: pickRandomFeatures(desiredModel, desiredCategory),
    desiredColor,
    dealBreakers,
    stubbornness: finalStubbornness,
    color: buyerType === 'cash' ? '#2ecc71' : '#3498db',
    active: true,
    moveTimer: 0,
    buttonBounds: null,
    strikes: 0,
    unattendedTimer: 0,
    revealedPreferences: {
      budget: false,
      type: false,
      features: false,
      model: false,
    },
    inventoryDenials: 0,
    creditScore: Math.floor(450 + Math.random() * 400), // Range: 450-850
    creditRevealed: false,
    isDifficult,
  };
}

export function calculatePayment(price: number, downPayment: number, apr: number, months: number): number {
  const principal = price - downPayment;
  if (apr === 0) {
    return Math.round(principal / months);
  }
  const monthlyRate = apr / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

// Reverse calculation: given a monthly payment, calculate OTD price
export function calculateOTDFromPayment(payment: number, downPayment: number, apr: number, months: number): number {
  if (apr === 0) {
    // Simple case: OTD = payment * months + down
    return payment * months + downPayment;
  }
  const monthlyRate = apr / 100 / 12;
  // payment = principal * (r * (1+r)^n) / ((1+r)^n - 1)
  // Solve for principal: principal = payment * ((1+r)^n - 1) / (r * (1+r)^n)
  const factor = Math.pow(1 + monthlyRate, months);
  const principal = payment * (factor - 1) / (monthlyRate * factor);
  return Math.round(principal + downPayment);
}

// Spawn locations - customers spawn in visible area BEFORE desks start (y < 340)
// Keeping 60px+ from all edges for name visibility
export const SPAWN_LOCATIONS = [
  { x: 150, y: 200 },
  { x: 300, y: 180 },
  { x: 450, y: 200 },
  { x: 600, y: 180 },
  { x: 200, y: 250 },
  { x: 400, y: 230 },
  { x: 550, y: 250 },
];

// Desks - centered in 800px canvas, moved back to y=360 and y=450
// Reception at front, player's desk in row 2 column 2
export const INITIAL_DESKS = [
  { x: 350, y: 100, w: 100, h: 50 }, // Reception desk
  { x: 80, y: 340, w: 90, h: 45 },
  { x: 240, y: 340, w: 90, h: 45 },
  { x: 400, y: 340, w: 90, h: 45 },
  { x: 560, y: 340, w: 90, h: 45 },
  { x: 80, y: 600, w: 90, h: 45 },
  { x: 240, y: 600, w: 90, h: 45 },  // Player's desk - no coworker here
  { x: 400, y: 600, w: 90, h: 45 },
  { x: 560, y: 600, w: 90, h: 45 },
];

// Coworkers positioned at their desks (all except player's desk at 240, 600)
export const INITIAL_COWORKERS: Coworker[] = [
  // Receptionist - doesn't steal
  { id: 107, name: 'Rachel', title: 'Receptionist', department: 'bdc', x: 400, y: 160, type: 'coworker', color: '#9b59b6', originalX: 400, originalY: 160 },
  
  // Row 1 (y=340)
  { id: 101, name: 'Mike', title: 'GSM', department: 'management', x: 125, y: 375, type: 'coworker', color: '#f39c12', originalX: 125, originalY: 375 },
  { id: 108, name: 'Jake', title: 'Sales', department: 'sales', x: 285, y: 375, type: 'coworker', color: '#3498db', originalX: 285, originalY: 375, nextStealTime: 5 + Math.random() * 25 },
  { id: 102, name: 'Sarah', title: 'Finance', department: 'management', x: 445, y: 375, type: 'coworker', color: '#e67e22', originalX: 445, originalY: 375 },
  { id: 109, name: 'Emma', title: 'Sales', department: 'sales', x: 605, y: 375, type: 'coworker', color: '#2980b9', originalX: 605, originalY: 375, nextStealTime: 5 + Math.random() * 25 },
  
  // Row 2 (y=600) - desk at 240 is EMPTY for player
  { id: 110, name: 'Chris', title: 'Sales', department: 'sales', x: 125, y: 635, type: 'coworker', color: '#1abc9c', originalX: 125, originalY: 635, nextStealTime: 5 + Math.random() * 25 },
  { id: 111, name: 'Tom', title: 'Sales', department: 'sales', x: 445, y: 635, type: 'coworker', color: '#16a085', originalX: 445, originalY: 635, nextStealTime: 5 + Math.random() * 25 },
  { id: 112, name: 'Amy', title: 'Sales', department: 'sales', x: 605, y: 635, type: 'coworker', color: '#3498db', originalX: 605, originalY: 635, nextStealTime: 5 + Math.random() * 25 },
];

// Mobile Layout Constants (Portrait Mode: 400px wide, 800px tall)
// Keep customers in upper area where they're visible
export const MOBILE_SPAWN_LOCATIONS = [
  { x: 80, y: 200 },
  { x: 200, y: 180 },
  { x: 320, y: 200 },
  { x: 120, y: 260 },
  { x: 280, y: 260 },
  { x: 200, y: 300 },
];

// Mobile desks - centered in 400px width, positioned lower to leave room for customers
// Canvas is 400w x 800h - desks start at y=420 to leave customer area above
export const MOBILE_DESKS = [
  { x: 150, y: 80, w: 100, h: 40 }, // Reception desk
  { x: 40, y: 420, w: 100, h: 50 },
  { x: 160, y: 420, w: 100, h: 50 },
  { x: 280, y: 420, w: 100, h: 50 },
  { x: 40, y: 640, w: 100, h: 50 },  // Player desk
  { x: 160, y: 640, w: 100, h: 50 },
  { x: 280, y: 640, w: 100, h: 50 },
];

// Mobile coworkers - positioned at desks within 400px width
export const MOBILE_COWORKERS: Coworker[] = [
  // Receptionist - doesn't steal
  { id: 107, name: 'Rachel', title: 'Receptionist', department: 'bdc', x: 200, y: 130, type: 'coworker', color: '#9b59b6', originalX: 200, originalY: 130 },
  
  // Row 1 desks (y=420)
  { id: 101, name: 'Mike', title: 'GSM', department: 'management', x: 90, y: 460, type: 'coworker', color: '#f39c12', originalX: 90, originalY: 460 },
  { id: 102, name: 'Sarah', title: 'Finance', department: 'management', x: 210, y: 460, type: 'coworker', color: '#e67e22', originalX: 210, originalY: 460 },
  { id: 108, name: 'Jake', title: 'Sales', department: 'sales', x: 330, y: 460, type: 'coworker', color: '#3498db', originalX: 330, originalY: 460, nextStealTime: 5 + Math.random() * 25 },
  
  // Row 2 desks (y=640) - first desk (x=40) is EMPTY for player
  { id: 109, name: 'Emma', title: 'Sales', department: 'sales', x: 210, y: 680, type: 'coworker', color: '#2980b9', originalX: 210, originalY: 680, nextStealTime: 5 + Math.random() * 25 },
  { id: 110, name: 'Chris', title: 'Sales', department: 'sales', x: 330, y: 680, type: 'coworker', color: '#1abc9c', originalX: 330, originalY: 680, nextStealTime: 5 + Math.random() * 25 },
];

