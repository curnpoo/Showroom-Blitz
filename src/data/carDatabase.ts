import type { DesiredFeature, VehicleCategory } from '../types/game';

export type TrimId = 'Base' | 'Sport' | 'Luxury' | 'Premium';

export interface TrimDef {
  multiplier: number;
  features: DesiredFeature[];
}

export const TRIM_TAXONOMY: Record<TrimId, TrimDef> = {
  Base: { multiplier: 1.0, features: ['affordable', 'reliable'] },
  Sport: { multiplier: 1.1, features: ['sporty', 'tech'] },
  Luxury: { multiplier: 1.18, features: ['luxury', 'tech'] },
  Premium: { multiplier: 1.28, features: ['luxury', 'tech'] }, // spacious added for SUVs in getVehicleFeatures
};

export interface CarDbEntry {
  brand: string;
  model: string;
  category: VehicleCategory;
  basePrice: number;
  trims: TrimId[];
  modelFeatures: DesiredFeature[];
}

/** "Brand Model" display key for desiredModel / lookup */
export function carDisplayName(entry: CarDbEntry): string {
  return `${entry.brand} ${entry.model}`;
}

/**
 * Car database: ~50–100 entries.
 * Brand–model pairs are realistic; trims are generic (Base, Sport, Luxury, Premium).
 */
export const CAR_DATABASE: CarDbEntry[] = [
  // === Affordable / compact sedans (Base, Sport, Luxury — “s lux” lower end) ===
  { brand: 'Toyota', model: 'Corolla', category: 'affordable', basePrice: 22900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Kia', model: 'Forte', category: 'affordable', basePrice: 20000, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Hyundai', model: 'Elantra', category: 'affordable', basePrice: 22500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Honda', model: 'Civic', category: 'affordable', basePrice: 24800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Nissan', model: 'Sentra', category: 'affordable', basePrice: 22100, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Mazda', model: 'Mazda3', category: 'affordable', basePrice: 23800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'sporty', 'affordable'] },
  { brand: 'Volkswagen', model: 'Jetta', category: 'affordable', basePrice: 22800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Subaru', model: 'Impreza', category: 'affordable', basePrice: 23400, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },
  { brand: 'Chevrolet', model: 'Malibu', category: 'affordable', basePrice: 26900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'family', 'affordable'] },
  { brand: 'Ford', model: 'Fusion', category: 'affordable', basePrice: 27200, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'fuel_efficient', 'affordable'] },

  // === Midsize sedans (Base, Sport, Luxury, Premium) ===
  { brand: 'Toyota', model: 'Camry', category: 'sedan', basePrice: 28400, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Honda', model: 'Accord', category: 'sedan', basePrice: 29200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Hyundai', model: 'Sonata', category: 'sedan', basePrice: 28500, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Nissan', model: 'Altima', category: 'sedan', basePrice: 27800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Kia', model: 'K5', category: 'sedan', basePrice: 26500, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Mazda', model: 'Mazda6', category: 'sedan', basePrice: 28200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'sporty'] },
  { brand: 'Volkswagen', model: 'Passat', category: 'sedan', basePrice: 27900, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },
  { brand: 'Subaru', model: 'Legacy', category: 'sedan', basePrice: 26600, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['reliable', 'family', 'fuel_efficient'] },

  // === Compact SUVs (Base, Sport, Luxury, Premium) ===
  { brand: 'Toyota', model: 'RAV4', category: 'suv', basePrice: 30200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'fuel_efficient'] },
  { brand: 'Honda', model: 'CR-V', category: 'suv', basePrice: 31500, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Hyundai', model: 'Tucson', category: 'suv', basePrice: 30500, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Kia', model: 'Sportage', category: 'suv', basePrice: 29800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Nissan', model: 'Rogue', category: 'suv', basePrice: 31200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Mazda', model: 'CX-5', category: 'suv', basePrice: 29600, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'sporty'] },
  { brand: 'Volkswagen', model: 'Tiguan', category: 'suv', basePrice: 31800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Ford', model: 'Escape', category: 'suv', basePrice: 30400, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'fuel_efficient'] },
  { brand: 'Chevrolet', model: 'Equinox', category: 'suv', basePrice: 30800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Subaru', model: 'Forester', category: 'suv', basePrice: 30900, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'reliable', 'spacious'] },
  { brand: 'Hyundai', model: 'Kona', category: 'suv', basePrice: 24500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'affordable', 'fuel_efficient'] },
  { brand: 'Hyundai', model: 'Venue', category: 'suv', basePrice: 20500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['affordable', 'reliable', 'fuel_efficient'] },
  { brand: 'Kia', model: 'Seltos', category: 'suv', basePrice: 25700, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'affordable', 'fuel_efficient'] },
  { brand: 'Toyota', model: 'Corolla Cross', category: 'suv', basePrice: 27200, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'affordable', 'family'] },
  { brand: 'Honda', model: 'HR-V', category: 'suv', basePrice: 26800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'affordable', 'family'] },
  { brand: 'Mazda', model: 'CX-30', category: 'suv', basePrice: 26900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['reliable', 'sporty', 'affordable'] },

  // === Midsize / full-size SUVs (Luxury, Premium; some Sport) ===
  { brand: 'Hyundai', model: 'Santa Fe', category: 'suv', basePrice: 36500, trims: ['Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Hyundai', model: 'Palisade', category: 'luxury', basePrice: 50500, trims: ['Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'luxury', 'tech'] },
  { brand: 'Kia', model: 'Telluride', category: 'luxury', basePrice: 39500, trims: ['Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'luxury', 'tech'] },
  { brand: 'Toyota', model: 'Highlander', category: 'suv', basePrice: 38400, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Honda', model: 'Pilot', category: 'suv', basePrice: 38900, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Ford', model: 'Explorer', category: 'suv', basePrice: 38200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Chevrolet', model: 'Traverse', category: 'suv', basePrice: 37800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Nissan', model: 'Pathfinder', category: 'suv', basePrice: 37200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Mazda', model: 'CX-9', category: 'suv', basePrice: 39800, trims: ['Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'sporty'] },
  { brand: 'Subaru', model: 'Ascent', category: 'suv', basePrice: 36800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },
  { brand: 'Volkswagen', model: 'Atlas', category: 'suv', basePrice: 38500, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['family', 'spacious', 'reliable'] },

  // === Hybrid (sedan/SUV — category hybrid where applicable) ===
  { brand: 'Toyota', model: 'Camry Hybrid', category: 'hybrid', basePrice: 31800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'reliable', 'family'] },
  { brand: 'Toyota', model: 'RAV4 Hybrid', category: 'hybrid', basePrice: 35200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'reliable'] },
  { brand: 'Honda', model: 'Accord Hybrid', category: 'hybrid', basePrice: 33200, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'reliable', 'family'] },
  { brand: 'Honda', model: 'CR-V Hybrid', category: 'hybrid', basePrice: 35800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'spacious'] },
  { brand: 'Hyundai', model: 'Tucson Hybrid', category: 'hybrid', basePrice: 34800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'reliable'] },
  { brand: 'Hyundai', model: 'Santa Fe Hybrid', category: 'hybrid', basePrice: 40200, trims: ['Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'spacious'] },
  { brand: 'Kia', model: 'Sportage Hybrid', category: 'hybrid', basePrice: 33100, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'reliable'] },
  { brand: 'Ford', model: 'Escape Hybrid', category: 'hybrid', basePrice: 33800, trims: ['Base', 'Sport', 'Luxury', 'Premium'], modelFeatures: ['fuel_efficient', 'family', 'reliable'] },

  // === Electric ===
  { brand: 'Hyundai', model: 'Ioniq 5', category: 'electric', basePrice: 44500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'spacious', 'family'] },
  { brand: 'Hyundai', model: 'Ioniq 6', category: 'electric', basePrice: 46500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'sporty'] },
  { brand: 'Tesla', model: 'Model 3', category: 'electric', basePrice: 42900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['tech', 'fuel_efficient', 'sporty'] },
  { brand: 'Tesla', model: 'Model Y', category: 'electric', basePrice: 47900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['tech', 'fuel_efficient', 'spacious', 'family'] },
  { brand: 'Kia', model: 'EV6', category: 'electric', basePrice: 52100, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'sporty'] },
  { brand: 'Kia', model: 'Niro EV', category: 'electric', basePrice: 40500, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'affordable'] },
  { brand: 'Nissan', model: 'Leaf', category: 'electric', basePrice: 35200, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'affordable', 'reliable'] },
  { brand: 'Chevrolet', model: 'Equinox EV', category: 'electric', basePrice: 43800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'spacious'] },
  { brand: 'Ford', model: 'Mustang Mach-E', category: 'electric', basePrice: 46900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['sporty', 'tech', 'fuel_efficient'] },
  { brand: 'Volkswagen', model: 'ID.4', category: 'electric', basePrice: 45200, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'family'] },
  { brand: 'Toyota', model: 'bZ4X', category: 'electric', basePrice: 44800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'reliable'] },
  { brand: 'Honda', model: 'Prologue', category: 'electric', basePrice: 48900, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'spacious'] },
  { brand: 'Mazda', model: 'MX-30', category: 'electric', basePrice: 37800, trims: ['Base', 'Sport', 'Luxury'], modelFeatures: ['fuel_efficient', 'tech', 'affordable'] },
];

/** All (brand, model, trim) combos for inventory sampling */
export interface PoolItem {
  entry: CarDbEntry;
  trim: TrimId;
}

export function buildInventoryPool(): PoolItem[] {
  const pool: PoolItem[] = [];
  for (const entry of CAR_DATABASE) {
    for (const trim of entry.trims) {
      pool.push({ entry, trim });
    }
  }
  return pool;
}
