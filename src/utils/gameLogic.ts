import type { Car, Customer, Coworker, PersonalityType, BuyerType, DesiredFeature, VehicleCategory } from '../types/game';

// Trim taxonomy: semantic buckets for feature logic (Base, Sport, Luxury, S Luxury)
export type TrimClass = 'base' | 'sport' | 'luxury' | 's_luxury';
export type VehicleSegment = 'compact_sedan' | 'midsize_sedan' | 'compact_suv' | 'midsize_suv' | 'fullsize_suv' | 'electric';

interface TrimSpec {
  name: string;
  trimClass: TrimClass;
  priceMultiplier: number;
}

interface ModelSpec {
  model: string;
  basePrice: number;
  segment: VehicleSegment;
  trims: TrimSpec[];
}

interface BrandSpec {
  brand: string;
  models: ModelSpec[];
}

// Car database: multi-brand, 2026-style trims, segment + trimClass drive features/category
const CAR_DATABASE: BrandSpec[] = [
  {
    brand: 'Hyundai',
    models: [
      { model: 'Venue', basePrice: 20500, segment: 'compact_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.15 }] },
      { model: 'Kona', basePrice: 24500, segment: 'compact_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'N Line', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }] },
      { model: 'Elantra', basePrice: 22500, segment: 'compact_sedan', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'N Line', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }] },
      { model: 'Tucson', basePrice: 30500, segment: 'compact_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'N Line', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }] },
      { model: 'Sonata', basePrice: 28500, segment: 'midsize_sedan', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'N Line', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.2 }] },
      { model: 'Santa Fe', basePrice: 36500, segment: 'midsize_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }, { name: 'Calligraphy', trimClass: 'luxury', priceMultiplier: 1.28 }] },
      { model: 'Ioniq 5', basePrice: 44500, segment: 'electric', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 's_luxury', priceMultiplier: 1.1 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.2 }] },
      { model: 'Ioniq 6', basePrice: 46500, segment: 'electric', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }] },
      { model: 'Palisade', basePrice: 50500, segment: 'fullsize_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.18 }, { name: 'Calligraphy', trimClass: 'luxury', priceMultiplier: 1.28 }] },
    ],
  },
  {
    brand: 'Kia',
    models: [
      { model: 'Forte', basePrice: 21800, segment: 'compact_sedan', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'LXS', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'GT-Line', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'GT', trimClass: 'sport', priceMultiplier: 1.18 }] },
      { model: 'Soul', basePrice: 23400, segment: 'compact_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'S', trimClass: 'base', priceMultiplier: 1.05 }, { name: 'GT-Line', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'EX', trimClass: 'luxury', priceMultiplier: 1.18 }] },
      { model: 'Seltos', basePrice: 25900, segment: 'compact_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'S', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'EX', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'SX', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'K5', basePrice: 26800, segment: 'midsize_sedan', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'LXS', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'GT-Line', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'GT', trimClass: 'sport', priceMultiplier: 1.2 }, { name: 'EX', trimClass: 'luxury', priceMultiplier: 1.26 }] },
      { model: 'Sportage', basePrice: 30400, segment: 'compact_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'EX', trimClass: 's_luxury', priceMultiplier: 1.1 }, { name: 'SX-Prestige', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'Sorento', basePrice: 34800, segment: 'midsize_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'S', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'EX', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'SX-Prestige', trimClass: 'luxury', priceMultiplier: 1.24 }] },
      { model: 'EV6', basePrice: 43500, segment: 'electric', trims: [{ name: 'Light', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Wind', trimClass: 's_luxury', priceMultiplier: 1.1 }, { name: 'GT-Line', trimClass: 'sport', priceMultiplier: 1.18 }, { name: 'GT', trimClass: 'sport', priceMultiplier: 1.28 }] },
      { model: 'Telluride', basePrice: 41400, segment: 'fullsize_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'S', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'EX', trimClass: 's_luxury', priceMultiplier: 1.16 }, { name: 'SX-Prestige', trimClass: 'luxury', priceMultiplier: 1.26 }] },
    ],
  },
  {
    brand: 'Toyota',
    models: [
      { model: 'Corolla', basePrice: 22800, segment: 'compact_sedan', trims: [{ name: 'L', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'LE', trimClass: 'base', priceMultiplier: 1.05 }, { name: 'SE', trimClass: 's_luxury', priceMultiplier: 1.1 }, { name: 'XSE', trimClass: 's_luxury', priceMultiplier: 1.16 }, { name: 'XLE', trimClass: 'luxury', priceMultiplier: 1.2 }] },
      { model: 'Camry', basePrice: 29200, segment: 'midsize_sedan', trims: [{ name: 'LE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SE', trimClass: 's_luxury', priceMultiplier: 1.06 }, { name: 'XSE', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'XLE', trimClass: 'luxury', priceMultiplier: 1.18 }, { name: 'TRD', trimClass: 'sport', priceMultiplier: 1.2 }] },
      { model: 'RAV4', basePrice: 32200, segment: 'compact_suv', trims: [{ name: 'LE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'XLE', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'XLE Premium', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'Highlander', basePrice: 41200, segment: 'midsize_suv', trims: [{ name: 'L', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'LE', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'XLE', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.24 }, { name: 'Platinum', trimClass: 'luxury', priceMultiplier: 1.3 }] },
      { model: 'bZ4X', basePrice: 44800, segment: 'electric', trims: [{ name: 'XLE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.12 }] },
    ],
  },
  {
    brand: 'Honda',
    models: [
      { model: 'Civic', basePrice: 24700, segment: 'compact_sedan', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Sport', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'EX', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'Si', trimClass: 'sport', priceMultiplier: 1.18 }, { name: 'Touring', trimClass: 'luxury', priceMultiplier: 1.24 }] },
      { model: 'Accord', basePrice: 28400, segment: 'midsize_sedan', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Sport', trimClass: 's_luxury', priceMultiplier: 1.06 }, { name: 'EX-L', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'Touring', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'HR-V', basePrice: 26300, segment: 'compact_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Sport', trimClass: 's_luxury', priceMultiplier: 1.06 }, { name: 'EX-L', trimClass: 'luxury', priceMultiplier: 1.14 }] },
      { model: 'CR-V', basePrice: 32200, segment: 'compact_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Sport', trimClass: 's_luxury', priceMultiplier: 1.06 }, { name: 'EX-L', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'Touring', trimClass: 'luxury', priceMultiplier: 1.2 }] },
      { model: 'Pilot', basePrice: 42400, segment: 'midsize_suv', trims: [{ name: 'LX', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Sport', trimClass: 's_luxury', priceMultiplier: 1.06 }, { name: 'EX-L', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'Touring', trimClass: 'luxury', priceMultiplier: 1.22 }, { name: 'Elite', trimClass: 'luxury', priceMultiplier: 1.28 }] },
    ],
  },
  {
    brand: 'Ford',
    models: [
      { model: 'Escape', basePrice: 30200, segment: 'compact_suv', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SE', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'SEL', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'Platinum', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'Edge', basePrice: 36200, segment: 'midsize_suv', trims: [{ name: 'SE', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SEL', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'ST-Line', trimClass: 'sport', priceMultiplier: 1.12 }, { name: 'Titanium', trimClass: 'luxury', priceMultiplier: 1.2 }] },
      { model: 'Explorer', basePrice: 42200, segment: 'midsize_suv', trims: [{ name: 'Base', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'XLT', trimClass: 'base', priceMultiplier: 1.08 }, { name: 'ST-Line', trimClass: 'sport', priceMultiplier: 1.14 }, { name: 'Limited', trimClass: 'luxury', priceMultiplier: 1.22 }, { name: 'Platinum', trimClass: 'luxury', priceMultiplier: 1.28 }] },
      { model: 'Bronco Sport', basePrice: 33200, segment: 'compact_suv', trims: [{ name: 'Base', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Big Bend', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'Outer Banks', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'Badlands', trimClass: 'sport', priceMultiplier: 1.22 }] },
    ],
  },
  {
    brand: 'Mazda',
    models: [
      { model: 'Mazda3', basePrice: 25600, segment: 'compact_sedan', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Preferred', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'Carbon Turbo', trimClass: 'sport', priceMultiplier: 1.14 }, { name: 'Turbo Premium Plus', trimClass: 'luxury', priceMultiplier: 1.22 }] },
      { model: 'CX-30', basePrice: 27200, segment: 'compact_suv', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Preferred', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'Turbo', trimClass: 'sport', priceMultiplier: 1.16 }, { name: 'Turbo Premium Plus', trimClass: 'luxury', priceMultiplier: 1.24 }] },
      { model: 'CX-5', basePrice: 30500, segment: 'compact_suv', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'Preferred', trimClass: 's_luxury', priceMultiplier: 1.08 }, { name: 'Turbo', trimClass: 'sport', priceMultiplier: 1.14 }, { name: 'Turbo Signature', trimClass: 'luxury', priceMultiplier: 1.24 }] },
    ],
  },
  {
    brand: 'Nissan',
    models: [
      { model: 'Sentra', basePrice: 22800, segment: 'compact_sedan', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SV', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'SR', trimClass: 's_luxury', priceMultiplier: 1.12 }, { name: 'SR Premium', trimClass: 's_luxury', priceMultiplier: 1.18 }] },
      { model: 'Altima', basePrice: 28800, segment: 'midsize_sedan', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SV', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'SR', trimClass: 's_luxury', priceMultiplier: 1.1 }, { name: 'SL', trimClass: 'luxury', priceMultiplier: 1.18 }, { name: 'VC-Turbo', trimClass: 'sport', priceMultiplier: 1.22 }] },
      { model: 'Rogue', basePrice: 32200, segment: 'compact_suv', trims: [{ name: 'S', trimClass: 'base', priceMultiplier: 1.0 }, { name: 'SV', trimClass: 'base', priceMultiplier: 1.06 }, { name: 'SL', trimClass: 's_luxury', priceMultiplier: 1.14 }, { name: 'Platinum', trimClass: 'luxury', priceMultiplier: 1.22 }] },
    ],
  },
  {
    brand: 'Tesla',
    models: [
      {
        model: 'Model S',
        basePrice: 89500,
        segment: 'electric',
        trims: [
          { name: 'Base', trimClass: 'base', priceMultiplier: 1.0 },
          { name: 'Long Range', trimClass: 's_luxury', priceMultiplier: 1.17 },
          { name: 'Performance', trimClass: 'sport', priceMultiplier: 1.25 },
        ],
      },
      {
        model: 'Model 3',
        basePrice: 42990,
        segment: 'electric',
        trims: [
          { name: 'Base', trimClass: 'base', priceMultiplier: 1.0 },
          { name: 'Long Range', trimClass: 's_luxury', priceMultiplier: 1.21 },
          { name: 'Performance', trimClass: 'sport', priceMultiplier: 1.33 },
        ],
      },
      {
        model: 'Model X',
        basePrice: 104990,
        segment: 'electric',
        trims: [
          { name: 'Base', trimClass: 'base', priceMultiplier: 1.0 },
          { name: 'Long Range', trimClass: 's_luxury', priceMultiplier: 1.05 },
          { name: 'Performance', trimClass: 'sport', priceMultiplier: 1.15 },
        ],
      },
      {
        model: 'Model Y',
        basePrice: 51990,
        segment: 'electric',
        trims: [
          { name: 'Base', trimClass: 'base', priceMultiplier: 1.0 },
          { name: 'Long Range', trimClass: 's_luxury', priceMultiplier: 1.13 },
          { name: 'Performance', trimClass: 'sport', priceMultiplier: 1.21 },
        ],
      },
    ],
  },
];

// Flatten to "Brand Model" for desiredModel and for lookups
function getAllBrandModelPairs(): { brand: string; model: string; brandModel: string }[] {
  const pairs: { brand: string; model: string; brandModel: string }[] = [];
  for (const b of CAR_DATABASE) {
    for (const m of b.models) {
      pairs.push({ brand: b.brand, model: m.model, brandModel: `${b.brand} ${m.model}` });
    }
  }
  return pairs;
}

const BRAND_MODEL_PAIRS = getAllBrandModelPairs();
const COLORS = ['White', 'Black', 'Silver', 'Blue', 'Red', 'Gray', 'Green'];
const FIRST_NAMES = ['Alex', 'Sarah', 'Marcus', 'Jessica', 'David', 'Emily', 'James', 'Lisa', 'Michael', 'Amanda', 'Chris', 'Nicole', 'Brian', 'Ashley', 'Kevin'];
const LAST_NAMES = ['Rivera', 'Chen', 'Johnson', 'Smith', 'Williams', 'Garcia', 'Martinez', 'Davis', 'Miller', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];
const BUYER_TYPES: BuyerType[] = ['cash', 'payment'];
const PERSONALITIES: PersonalityType[] = ['friendly', 'serious', 'skeptical', 'enthusiastic', 'analytical'];
const DESIRED_FEATURES: DesiredFeature[] = ['sporty', 'fuel_efficient', 'luxury', 'family', 'affordable', 'tech', 'spacious'];

// Vehicle category preferences - customers may ask for a specific type or be flexible
const VEHICLE_CATEGORIES: VehicleCategory[] = ['suv', 'sedan', 'electric', 'affordable', 'luxury', 'any'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface CreditTier {
  tier: number;
  minAPR: number;
  minDown?: number;
  label: string;
  color: string;
}

export function getCreditTier(score: number): CreditTier | null {
  if (score >= 800) return { tier: 1, minAPR: 0, label: 'Tier 1 (Excellent)', color: '#2ecc71' };
  if (score >= 750) return { tier: 2, minAPR: 2.5, label: 'Tier 2 (Very Good)', color: '#27ae60' };
  if (score >= 700) return { tier: 3, minAPR: 4.0, label: 'Tier 3 (Good)', color: '#f1c40f' };
  if (score >= 640) return { tier: 4, minAPR: 6.5, label: 'Tier 4 (Fair)', color: '#f39c12' };
  if (score >= 570) return { tier: 5, minAPR: 8.9, label: 'Tier 5 (Subprime)', color: '#e67e22' };
  if (score >= 500) return { tier: 6, minAPR: 10.0, minDown: 2000, label: 'Tier 6 (Deep Subprime)', color: '#d35400' };
  if (score >= 450) return { tier: 7, minAPR: 13.0, minDown: 4000, label: 'Tier 7 (High Risk)', color: '#e74c3c' };
  return null; // Does not qualify
}

function pickRandomCategory(): VehicleCategory {
  if (Math.random() < 0.4) {
    return 'any'; // Not picky
  }
  return pickRandom(VEHICLE_CATEGORIES);
}

// Resolve "Brand Model" to segment and basePrice for category/features
function getSpecForBrandModel(brandModel: string): { segment: VehicleSegment; basePrice: number } | null {
  const pair = BRAND_MODEL_PAIRS.find(p => p.brandModel === brandModel);
  if (!pair) return null;
  const brandSpec = CAR_DATABASE.find(b => b.brand === pair.brand);
  const modelSpec = brandSpec?.models.find(m => m.model === pair.model);
  if (!modelSpec) return null;
  return { segment: modelSpec.segment, basePrice: modelSpec.basePrice };
}

function getSegmentForBrandModel(brandModel: string): VehicleSegment | null {
  return getSpecForBrandModel(brandModel)?.segment ?? null;
}

function getModelPriceRange(brandModel: string): { min: number; max: number; mid: number } | null {
  const pair = BRAND_MODEL_PAIRS.find(p => p.brandModel === brandModel);
  if (!pair) return null;
  const brandSpec = CAR_DATABASE.find(b => b.brand === pair.brand);
  const modelSpec = brandSpec?.models.find(m => m.model === pair.model);
  if (!modelSpec) return null;
  const multipliers = modelSpec.trims.map(t => t.priceMultiplier);
  const min = Math.round(modelSpec.basePrice * Math.min(...multipliers));
  const max = Math.round(modelSpec.basePrice * Math.max(...multipliers));
  const mid = Math.round((min + max) / 2);
  return { min, max, mid };
}

function getCategoryPriceRange(category: VehicleCategory): { min: number; max: number; mid: number } {
  const prices: number[] = [];
  for (const brand of CAR_DATABASE) {
    for (const model of brand.models) {
      for (const trim of model.trims) {
        const price = Math.round(model.basePrice * trim.priceMultiplier);
        const cat = getVehicleCategoryFromSegment(model.segment, price);
        if (category === 'any' || cat === category) prices.push(price);
      }
    }
  }
  if (prices.length === 0) {
    for (const brand of CAR_DATABASE) {
      for (const model of brand.models) {
        for (const trim of model.trims) {
          prices.push(Math.round(model.basePrice * trim.priceMultiplier));
        }
      }
    }
  }
  prices.sort((a, b) => a - b);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const mid = prices[Math.floor(prices.length / 2)];
  return { min, max, mid };
}

function pickTargetPrice(range: { min: number; max: number }): number {
  const t = (Math.random() + Math.random()) / 2; // weighted toward middle
  return Math.round(range.min + (range.max - range.min) * t);
}

function getBudgetMultiplier(): number {
  const roll = Math.random();
  if (roll < 0.8) return 0.9 + Math.random() * 0.09; // 0.90 - 0.99
  return 0.99 + Math.random() * 0.03; // 0.99 - 1.02
}

// Helper to get features that actually exist for a given "Brand Model" or category
function getCompatibleFeatures(brandModel?: string, category?: VehicleCategory): DesiredFeature[] {
  let validFeatures = [...DESIRED_FEATURES];
  const segment = brandModel ? getSegmentForBrandModel(brandModel) : null;

  if (segment) {
    // Use segment to filter; no spacious on compact_sedan/midsize_sedan, etc.
    if (segment === 'compact_sedan' || segment === 'midsize_sedan') {
      validFeatures = validFeatures.filter(f => f !== 'spacious');
    }
    if (segment === 'electric') {
      const normalizedModel = brandModel?.toLowerCase() ?? '';
      if (!normalizedModel.includes('base')) {
        validFeatures = validFeatures.filter(f => f !== 'affordable');
      }
      validFeatures.push('tech', 'fuel_efficient');
    }
    if (segment === 'compact_suv' || segment === 'midsize_suv' || segment === 'fullsize_suv') {
      validFeatures = validFeatures.filter(f => f !== 'fuel_efficient' || Math.random() > 0.7);
    }
    if (segment === 'compact_sedan') {
      validFeatures = validFeatures.filter(f => f !== 'luxury' && f !== 'spacious');
      validFeatures.push('affordable', 'sporty');
    }
    if (segment === 'fullsize_suv') {
      validFeatures = validFeatures.filter(f => f !== 'affordable');
    }
  } else if (category) {
    if (category === 'suv') {
      validFeatures = validFeatures.filter(f => f !== 'fuel_efficient' || Math.random() > 0.7);
    } else if (category === 'sedan') {
      validFeatures = validFeatures.filter(f => f !== 'spacious');
    } else if (category === 'affordable') {
      validFeatures = validFeatures.filter(f => f !== 'luxury' && f !== 'sporty');
    } else if (category === 'luxury') {
      validFeatures = validFeatures.filter(f => f !== 'affordable');
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

// Map segment + price to VehicleCategory for customer matching
function getVehicleCategoryFromSegment(segment: VehicleSegment, price: number): VehicleCategory {
  if (segment === 'electric') return 'electric';
  if (segment === 'fullsize_suv' || price > 45000) return 'luxury';
  if (segment === 'compact_sedan' || price < 27000) return 'affordable';
  if (segment === 'compact_suv' || segment === 'midsize_suv') return 'suv';
  if (segment === 'midsize_sedan') return 'sedan';
  return 'any';
}

// Assign features from segment + trimClass. Single source of truth for vehicle features.
function getVehicleFeaturesFromSegment(
  segment: VehicleSegment,
  trimClass: TrimClass,
  brand?: string,
  trimName?: string
): DesiredFeature[] {
  const features: DesiredFeature[] = [];

  // Segment-based features
  if (segment === 'compact_sedan') {
    features.push('affordable', 'fuel_efficient');
  } else if (segment === 'midsize_sedan') {
    features.push('family');
  } else if (segment === 'compact_suv') {
    features.push('family');
  } else if (segment === 'midsize_suv') {
    features.push('family', 'spacious');
  } else if (segment === 'fullsize_suv') {
    features.push('family', 'spacious');
  } else if (segment === 'electric') {
    features.push('fuel_efficient', 'tech', 'family');
  }

  // TrimClass-based features
  if (trimClass === 'base') {
    features.push('affordable');
  } else if (trimClass === 'sport') {
    features.push('sporty', 'tech');
  } else if (trimClass === 'luxury') {
    features.push('luxury', 'tech');
    if (segment === 'midsize_suv' || segment === 'fullsize_suv') features.push('spacious');
  } else if (trimClass === 's_luxury') {
    features.push('sporty', 'tech');
    if (segment === 'compact_sedan' || segment === 'midsize_sedan') features.push('affordable');
  }

  if (features.length < 2) features.push('family');
  const isTesla = brand === 'Tesla';
  const normalizedTrim = (trimName || '').toLowerCase();
  if (isTesla && (normalizedTrim.includes('long range') || normalizedTrim.includes('performance'))) {
    features.push('luxury', 'sporty');
  }

  return [...new Set(features)];
}

export function generateInventory(count: number = 100): Car[] {
  const inventory: Car[] = [];

  for (let i = 0; i < count; i++) {
    const brandSpec = pickRandom(CAR_DATABASE);
    const modelSpec = pickRandom(brandSpec.models);
    const trimSpec = pickRandom(modelSpec.trims);
    const color = pickRandom(COLORS);

    const msrp = Math.round(modelSpec.basePrice * trimSpec.priceMultiplier);
    const invoice = Math.round(msrp * (0.92 + Math.random() * 0.03));
    const tax = Math.round(msrp * 0.07);

    inventory.push({
      id: `CAR${i + 1}`,
      model: `2026 ${brandSpec.brand} ${modelSpec.model}`,
      trim: trimSpec.name,
      color,
      price: msrp,
      invoice,
      fees: 1000,
      tax,
      otd: msrp + 1000 + tax,
      mileage: 0,
      vin: `${brandSpec.brand.slice(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      features: getVehicleFeaturesFromSegment(modelSpec.segment, trimSpec.trimClass, brandSpec.brand, trimSpec.name),
      category: getVehicleCategoryFromSegment(modelSpec.segment, msrp),
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

  // Generate specific desires (85% chance for a specific "Brand Model")
  const hasSpecificModel = Math.random() > 0.15;
  const desiredModel = hasSpecificModel ? pickRandom(BRAND_MODEL_PAIRS).brandModel : undefined;

  let desiredCategory: VehicleCategory = 'any';
  if (desiredModel) {
    const spec = getSpecForBrandModel(desiredModel);
    desiredCategory = spec ? getVehicleCategoryFromSegment(spec.segment, spec.basePrice) : pickRandomCategory();
  } else {
    desiredCategory = pickRandomCategory();
  }

  const hasSpecificColor = Math.random() > 0.6;
  const desiredColor = hasSpecificColor ? pickRandom(COLORS) : undefined;

  const creditScore = Math.floor(450 + Math.random() * 400); // Range: 450-850
  const creditTier = getCreditTier(creditScore);

  const budgetCategory = desiredCategory;
  const modelRange = desiredModel ? getModelPriceRange(desiredModel) : null;
  const baseRange = modelRange ?? getCategoryPriceRange(budgetCategory);
  const targetPrice = pickTargetPrice(baseRange);
  const desiredDown = buyerType === 'payment'
    ? (creditTier?.minDown ?? 0) + Math.floor(Math.random() * 3000)
    : 0;

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

  // No customers who refuse to reveal preferences
  const isDifficult = false;
  // Less common guarded customers who reveal info slowly
  const isGuarded = Math.random() < 0.15;
  const openToAlternative = Math.random() < (personality === 'skeptical' ? 0.45 : 0.7);
 
  // Difficult customers have very low temper (10-30) and higher stubbornness
  const finalTemper = isDifficult ? Math.floor(10 + Math.random() * 20) : temper;
  const finalStubbornness = isDifficult ? Math.min(5, stubbornness + 2) : Math.min(5, stubbornness);

  const desiredFeaturesBase = pickRandomFeatures(desiredModel, desiredCategory);
  const teslaSportyLuxury: DesiredFeature[] = ['sporty', 'luxury'];
  const teslaBaseFeatures: DesiredFeature[] = ['affordable', 'tech'];
  const normalizedDesiredModel = desiredModel?.toLowerCase() ?? '';
  const isTeslaModel = normalizedDesiredModel.includes('tesla');
  const desiredFeatures = (() => {
    if (!isTeslaModel) return desiredFeaturesBase;
    if (normalizedDesiredModel.includes('performance')) return teslaSportyLuxury;
    if (normalizedDesiredModel.includes('long range')) return teslaSportyLuxury;
    if (normalizedDesiredModel.includes('base')) return teslaBaseFeatures;
    return desiredFeaturesBase;
  })();

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
    budget: buyerType === 'cash' ? Math.round(targetPrice * getBudgetMultiplier()) : 0,
    maxPayment: buyerType === 'payment' ? (() => {
      const otd = Math.round(targetPrice * 1.07 + 1000);
      const apr = (creditTier?.minAPR ?? 6.9) + Math.random() * 2.5;
      const payment = calculatePayment(otd, desiredDown, apr, 72);
      return Math.round(payment * getBudgetMultiplier());
    })() : 0,
    desiredDown,
    conversationHistory: [],
    conversationPhase: 'greeting',
    desiredCategory,
    desiredModel,
    desiredFeatures,
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
    creditScore,
    creditRevealed: false,
    isDifficult,
    isGuarded,
    openToAlternative,
    offerCount: 0,
    closeAttempts: 0,
    dealStatus: 'negotiating',
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
  { id: 108, name: 'Jake', title: 'Sales', department: 'sales', x: 285, y: 375, type: 'coworker', color: '#3498db', originalX: 285, originalY: 375, nextStealTime: 20 + Math.random() * 25 },
  { id: 102, name: 'Sarah', title: 'Finance', department: 'management', x: 445, y: 375, type: 'coworker', color: '#e67e22', originalX: 445, originalY: 375 },
  { id: 109, name: 'Emma', title: 'Sales', department: 'sales', x: 605, y: 375, type: 'coworker', color: '#2980b9', originalX: 605, originalY: 375, nextStealTime: 20 + Math.random() * 25 },
  
  // Row 2 (y=600) - desk at 240 is EMPTY for player
  { id: 110, name: 'Chris', title: 'Sales', department: 'sales', x: 125, y: 635, type: 'coworker', color: '#1abc9c', originalX: 125, originalY: 635, nextStealTime: 20 + Math.random() * 25 },
  { id: 111, name: 'Tom', title: 'Sales', department: 'sales', x: 445, y: 635, type: 'coworker', color: '#16a085', originalX: 445, originalY: 635, nextStealTime: 20 + Math.random() * 25 },
  { id: 112, name: 'Amy', title: 'Sales', department: 'sales', x: 605, y: 635, type: 'coworker', color: '#3498db', originalX: 605, originalY: 635, nextStealTime: 20 + Math.random() * 25 },
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
  { id: 108, name: 'Jake', title: 'Sales', department: 'sales', x: 330, y: 460, type: 'coworker', color: '#3498db', originalX: 330, originalY: 460, nextStealTime: 20 + Math.random() * 25 },
  
  // Row 2 desks (y=640) - first desk (x=40) is EMPTY for player
  { id: 109, name: 'Emma', title: 'Sales', department: 'sales', x: 210, y: 680, type: 'coworker', color: '#2980b9', originalX: 210, originalY: 680, nextStealTime: 20 + Math.random() * 25 },
  { id: 110, name: 'Chris', title: 'Sales', department: 'sales', x: 330, y: 680, type: 'coworker', color: '#1abc9c', originalX: 330, originalY: 680, nextStealTime: 20 + Math.random() * 25 },
];
