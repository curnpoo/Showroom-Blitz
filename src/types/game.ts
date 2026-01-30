export type PersonalityType = 'friendly' | 'serious' | 'skeptical' | 'enthusiastic' | 'analytical';
export type BuyerType = 'cash' | 'payment';
export type ConversationPhase = 
  | 'greeting'           // Player says hello, customer responds with what they want
  | 'needs_discovery'    // Customer tells desired features
  | 'showing_car'        // Player shows car (no price mentioned)
  | 'car_reaction'       // Customer reacts - likes it or wants something else
  | 'asking_numbers'     // Customer asks about price
  | 'negotiation'        // Back and forth on price
// Deal done
  | 'closed';

export type DealStatus = 'negotiating' | 'accepted' | 'closed' | 'lost';

export type Sentiment = 'happy' | 'mad' | 'disinterested' | 'neutral';

export type DesiredFeature = 'sporty' | 'fuel_efficient' | 'luxury' | 'family' | 'affordable' | 'tech' | 'spacious';

// Vehicle category types for customer preferences
export type VehicleCategory = 'suv' | 'sedan' | 'electric' | 'affordable' | 'luxury' | 'any';

export interface Customer {
  id: number;
  name: string;
  x: number;
  y: number;
  type: 'customer';
  buyerType: BuyerType;
  personality: PersonalityType;
  temper: number; // 0-100, higher = more patient
  interest: number; // 0-100 - also affects willingness to pay (high = pays more)
  budget: number; // For cash buyers
  maxPayment: number; // For payment buyers
  desiredDown: number; // How much they want to put down (payment buyers)
  conversationHistory: AIConversationMessage[];
  conversationPhase: ConversationPhase;
  desiredFeatures: DesiredFeature[];
  desiredCategory: VehicleCategory; // What type of vehicle they want (SUV, sedan, electric, etc.) or 'any' if not picky
  desiredModel?: string; // "Brand Model" e.g. "Kia Forte", "Toyota Corolla"
  desiredColor?: string; // e.g., "Blue"
  dealBreakers: string[]; // e.g., ["Too high APR", "Wrong color"]
  stubbornness: number; // 1-5, higher = harder to negotiate
  color: string;
  active: boolean;
  isLost?: boolean; // If they walked away
  moveTimer: number;
  buttonBounds: { x: number; y: number; w: number; h: number } | null;
  strikes: number; // For "walking away" threshold
  unattendedTimer: number; // Tracks time since arrival without engagement
  approachingCoworker?: number; // ID of coworker approaching to steal customer
  coworkerArrivalTime?: number; // When coworker arrived at customer
  isStolen?: boolean; // Customer has been stolen by a coworker
  stolenByCoworkerId?: number; // ID of coworker who stole this customer
  stolenDealTimer?: number; // Timer for the stolen deal resolution (15-30 seconds)
  stolenDealDuration?: number; // How long the stolen deal should take
  revealedPreferences: {
    budget: boolean;
    type: boolean;
    features: boolean;
    model: boolean;
    timeline?: boolean;
  };
  inventoryDenials?: number; // Track how many times we've told them we don't have something
  creditScore: number;
  creditRevealed: boolean;
  isDifficult: boolean; // Difficult customers won't reveal preferences and have short tempers
  isGuarded: boolean; // Guarded customers initially say "just looking" and reveal info slowly
  openToAlternative: boolean;
  offerCount: number; // For "attrition" logic (repeatedly offering same deal)
  closeAttempts: number; // Tracks how many times the player has tried to close the deal
  dealStatus: DealStatus;
}

export interface Coworker {
  id: number;
  name: string;
  title: string;
  department: 'management' | 'bdc' | 'sales';
  x: number;
  y: number;
  type: 'coworker';
  color: string;
  // Working state - when coworker has stolen a customer
  workingWithCustomerId?: number; // ID of customer they're working with
  workingTimer?: number; // How long they've been working with the customer
  nextStealTime?: number; // Timer for when they'll next try to steal (5-30 seconds)
  originalX?: number; // Original desk X position
  originalY?: number; // Original desk Y position
  stealPhase?: 'walking' | 'greeting' | 'returning' | 'working'; // Phase of steal: walking to customer, greeting, bringing back to desk, working at desk
  pendingCustomerSpawn?: number; // Timer for delayed customer spawn (3-5 seconds)
}

export interface Car {
  id: string;
  model: string;
  trim: string;
  color: string;
  price: number;
  invoice: number;
  fees: number;
  tax: number;
  otd: number;
  mileage: number;
  vin: string;
  features: DesiredFeature[];
  category: VehicleCategory;
}

export interface Desk {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

export interface ConversationMessage {
  sender: 'player' | 'customer';
  text: string;
  sentiment?: Sentiment;
  offerDetails?: any; // To keep compatibility with existing code
}

export interface AIConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type GameState = 'preloading' | 'intro' | 'setup' | 'loading' | 'playing';
export type OfferType = 'selling' | 'otd' | 'payment';

export interface TimerSettings {
  enabled: boolean;
  duration: 3 | 5 | 10; // in minutes
}

export interface SessionStats {
  gross: number;
  profit: number;
  salesCount: number;
}

export interface GameSettings {
  useAI: boolean;
  apiKey: string;
  provider: 'anthropic' | 'openai' | 'local';
  apiBaseUrl?: string; // For custom/local AI server endpoints
  modelName: string;   // e.g., 'claude-3-sonnet', 'local-model'
  timer: TimerSettings;
  gameMode: 'standard' | 'volume';
}
