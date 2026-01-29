import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, DollarSign, Users, Car, HelpCircle } from 'lucide-react';
import { TipsModal } from './components/TipsModal';
import type { 
  Customer, 
  Coworker, 
  Car as CarType, 
  Desk, 
  Player, 
  GameState, 
  ConversationMessage,
  GameSettings,
  OfferType,
  SessionStats,
  VehicleCategory,
  DesiredFeature
} from './types/game';
import { 
  generateInventory, 
  generateCustomer, 
  calculatePayment,
  SPAWN_LOCATIONS,
  INITIAL_DESKS, 
  INITIAL_COWORKERS,
  MOBILE_SPAWN_LOCATIONS,
  MOBILE_DESKS,
  MOBILE_COWORKERS
} from './utils/gameLogic';
import { generateResponse, getAIResponse, isTakeItOrLeaveIt, isInventoryAdmission } from './utils/responseGenerator';
import { NumbersPanel } from './components/NumbersPanel';
import { CustomerNotes } from './components/CustomerNotes';
import { ChatInterface } from './components/ChatInterface';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const MOBILE_CANVAS_WIDTH = 400;
const MOBILE_CANVAS_HEIGHT = 800;

const CATEGORY_UI_LABELS: Record<VehicleCategory, string> = {
  suv: '⛽️ SUV',
  sedan: '⛽️ Sedan',
  electric: '⚡️ Electric',
  affordable: '⛽️ Economy',
  luxury: '⛽️ Luxury',
  any: 'Flexible',
};

const CATEGORY_SEARCH_KEYWORDS: Record<VehicleCategory, string[]> = {
  suv: ['suv', 'sport utility', 'sport-utility', 'sport-utility vehicle'],
  sedan: ['sedan', 'car', 'coupe'],
  electric: ['electric', 'ev', 'battery', '⚡️ electric'],
  affordable: ['affordable', 'economy', 'budget'],
  luxury: ['luxury', 'premium', 'luxe'],
  any: ['any', 'flexible'],
};
const FEATURE_SEARCH_KEYWORDS: Record<string, DesiredFeature> = {
  'fuel efficient': 'fuel_efficient',
  'fuel-efficient': 'fuel_efficient',
  'family-friendly': 'family',
  family: 'family',
  luxury: 'luxury',
  sporty: 'sporty',
  tech: 'tech',
  spacious: 'spacious',
  affordable: 'affordable',
  'high-tech': 'tech',
  fuel_efficient: 'fuel_efficient',
};
const FEATURE_NAMES: Record<DesiredFeature, string> = {
  sporty: 'sporty',
  fuel_efficient: 'fuel efficient',
  luxury: 'luxurious',
  family: 'family-friendly',
  affordable: 'affordable',
  tech: 'high-tech',
  spacious: 'spacious',
};
const INVENTORY_NOTE_KEYS: (keyof Customer['revealedPreferences'])[] = ['budget', 'type', 'features'];
const MIN_WAITING_CUSTOMERS = 1;
const MAX_WAITING_CUSTOMERS = 5;
const STEAL_INTERVAL_MIN = 20;
const STEAL_INTERVAL_MAX = 45;
const COWORKER_DEAL_MIN = 60;
const COWORKER_DEAL_MAX = 120;

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Customer | null>(null);
  const [showDealClosed, setShowDealClosed] = useState(false);
  const [showLostDeal, setShowLostDeal] = useState(false);
  const [currentCar, setCurrentCar] = useState<CarType | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [lastSaleAmount, setLastSaleAmount] = useState(0);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [agreedType, setAgreedType] = useState<OfferType>('selling');
  const [customSellingPrice, setCustomSellingPrice] = useState(0);
  const [customOTDPrice, setCustomOTDPrice] = useState(0);
  const [lastProfit, setLastProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [customPayment, setCustomPayment] = useState(0);
  const [paymentTerm, setPaymentTerm] = useState(72);
  const [paymentAPR, setPaymentAPR] = useState(6.9);
  const [downPayment, setDownPayment] = useState(0);
  const currenServerModel = 'mistralai/Ministral-3-3B-Instruct-2512';
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('showroom_settings');
    const defaults = {
      useAI: false,
      apiKey: '',
      provider: 'local' as const,
      apiBaseUrl: '/api/ai',
      modelName: currenServerModel,
      timer: {
        enabled: false,
        duration: 5 as 3 | 5 | 10,
      },
      gameMode: 'standard' as 'standard' | 'volume',
    };
    
    if (!saved) return defaults;
    
    try {
      const parsed = JSON.parse(saved);
      // Ensure timer property exists with defaults
      const merged = {
        ...defaults,
        ...parsed,
        timer: {
          ...defaults.timer,
          ...(parsed.timer || {}),
        },
      };

      if (merged.apiBaseUrl?.startsWith('http')) {
        merged.apiBaseUrl = '/api/ai';
      }

      return merged;
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return defaults;
    }
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    gross: 0,
    profit: 0,
    salesCount: 0,
  });
  const [aiLoadProgress, setAiLoadProgress] = useState(0);
  const [aiLoadStartAt, setAiLoadStartAt] = useState<number | null>(null);
  const [aiPendingStart, setAiPendingStart] = useState(false);
  const [aiWarmupSuccess, setAiWarmupSuccess] = useState(false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [aiWarmupStatus, setAiWarmupStatus] = useState<'idle' | 'warming' | 'ready' | 'error'>('idle');
  const [aiWarmupMessage, setAiWarmupMessage] = useState('');
  const aiWarmupAttemptRef = useRef(0);
  const useAIRef = useRef(settings.useAI);

  useEffect(() => {
    useAIRef.current = settings.useAI;
  }, [settings.useAI]);

  const getModelsUrl = useCallback((base: string) => {
    let cleaned = base;
    if (!cleaned) cleaned = 'http://localhost:1234/v1';
    if (cleaned.endsWith('/chat/completions')) {
      cleaned = cleaned.replace('/chat/completions', '');
    }
    cleaned = cleaned.replace(/\/+$/, '');
    return `${cleaned}/models`;
  }, []);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {};
    if (settings.apiKey) {
      headers.Authorization = `Bearer ${settings.apiKey}`;
    }
    return headers;
  }, [settings.apiKey]);

  const warmupAI = useCallback(async (_reason: 'setup' | 'start' | 'customer' | 'retry') => {
    if (!settings.useAI) return;
    if (settings.provider === 'anthropic') {
      setAiWarmupStatus('ready');
      setAiWarmupMessage('');
      setAiWarmupSuccess(true);
      setAiLoadProgress(1);
      return;
    }

    const attemptId = ++aiWarmupAttemptRef.current;
    setAiWarmupStatus('warming');
    setAiWarmupMessage('Starting AI server... this can take a few minutes.');
    setAiWarmupSuccess(false);

    const warmupUrl = getModelsUrl(settings.apiBaseUrl || '/api/ai');
    const authHeaders = getAuthHeaders();

    // Fire initial request to trigger Modal cold start (don't wait for response)
    fetch(warmupUrl, { method: 'GET', headers: authHeaders }).catch(() => {});

    const deadline = Date.now() + 90000;
    let delayMs = 250;
    let attempts = 0;

    const checkReady = async () => {
      try {
        const response = await fetch(warmupUrl, { method: 'GET', headers: authHeaders });
        if (!useAIRef.current || attemptId !== aiWarmupAttemptRef.current) return false;
        if (response.ok) {
          setAiWarmupStatus('ready');
          setAiWarmupMessage('');
          setAiWarmupSuccess(true);
          setAiLoadProgress(1);
          return true;
        }
      } catch {
        if (!useAIRef.current || attemptId !== aiWarmupAttemptRef.current) return false;
      }
      return false;
    };

    // Try immediately in case the server is already warm.
    if (await checkReady()) return;

    while (Date.now() < deadline) {
      if (!useAIRef.current || attemptId !== aiWarmupAttemptRef.current) return;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      if (!useAIRef.current || attemptId !== aiWarmupAttemptRef.current) return;

      if (await checkReady()) return;

      attempts += 1;
      if (attempts >= 8) {
        delayMs = Math.min(delayMs + 750, 5000);
      }
    }

    if (!useAIRef.current || attemptId !== aiWarmupAttemptRef.current) return;
    setAiWarmupStatus('error');
    setAiWarmupMessage('Could not reach AI server. Retry or switch to Non-AI.');
  }, [settings.useAI, settings.provider, settings.apiBaseUrl, getModelsUrl, getAuthHeaders]);

  const testConnection = async () => {
    if (!settings.apiBaseUrl) return;
    
    setTestStatus('testing');
    setTestMessage('');
    
    try {
      // AI server check
      // We try to fetch the /models endpoint when available
      const url = getModelsUrl(settings.apiBaseUrl);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Successfully connected to API!');
        
        // Try to auto-detect model if possible (bonus)
        try {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
             const modelId = data.data[0].id;
             setTestMessage(`Connected! Found model: ${modelId}`);
             // Optional: auto-set model? Maybe too aggressive.
          }
        } catch (e) {
          // Ignore JSON parse error, connection was still OK
        }
      } else {
        setTestStatus('error');
        setTestMessage(`Server reachable but returned error: ${response.status}`);
      }
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(e.message || 'Connection failed. Check URL or CORS.');
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update layout entities when mobile state changes
  useEffect(() => {
    if (isMobile) {
      desksRef.current = MOBILE_DESKS;
      coworkersRef.current = MOBILE_COWORKERS;
      // Reposition player to their desk on mobile (first desk in row 2)
      playerRef.current.x = 90;
      playerRef.current.y = 570;
      playerRef.current.targetX = 90;
      playerRef.current.targetY = 570;
      // Reposition customers within mobile bounds
      customersRef.current.forEach((c, i) => {
        if (c.active) {
          const mobileSpawns = MOBILE_SPAWN_LOCATIONS;
          const spawn = mobileSpawns[i % mobileSpawns.length];
          c.x = spawn.x;
          c.y = spawn.y;
        }
      });
    } else {
      desksRef.current = INITIAL_DESKS;
      coworkersRef.current = INITIAL_COWORKERS;
      // Reposition player to their desk on desktop
      playerRef.current.x = 285;
      playerRef.current.y = 635;
      playerRef.current.targetX = 285;
      playerRef.current.targetY = 635;
      // Reposition customers within desktop bounds
      customersRef.current.forEach((c, i) => {
        if (c.active) {
          const desktopSpawns = SPAWN_LOCATIONS;
          const spawn = desktopSpawns[i % desktopSpawns.length];
          c.x = spawn.x;
          c.y = spawn.y;
        }
      });
    }
  }, [isMobile]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('showroom_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!settings.useAI) {
      aiWarmupAttemptRef.current += 1;
      setAiWarmupStatus('idle');
      setAiWarmupMessage('');
      setAiWarmupSuccess(false);
      return;
    }

    if (settings.provider === 'anthropic') {
      setAiWarmupStatus('ready');
      setAiWarmupMessage('');
      setAiWarmupSuccess(true);
      return;
    }

  }, [settings.useAI, settings.provider, warmupAI]);

  const startShowroom = useCallback(() => {
    setShowDealClosed(false);
    customersRef.current.forEach(c => c.active = true);

    if (settings.gameMode === 'volume') {
      inventoryRef.current = generateInventory(10);
      setTimeLeft(0);
      setSessionStats({ gross: 0, profit: 0, salesCount: 0 });
    } else if (settings.timer.enabled) {
      inventoryRef.current = generateInventory(100);
      setTimeLeft(settings.timer.duration * 60);
      setSessionStats({ gross: 0, profit: 0, salesCount: 0 });
    } else {
      inventoryRef.current = generateInventory(100);
    }
  }, [settings.gameMode, settings.timer.enabled, settings.timer.duration]);

  const beginGameStart = useCallback(() => {
    if (settings.useAI) {
      setAiLoadProgress(0);
      setAiLoadStartAt(Date.now());
      setAiPendingStart(true);
      setAiWarmupSuccess(false);
      setGameState('loading');
      warmupAI('start');
      return;
    }

    setGameState('playing');
    startShowroom();
  }, [settings.useAI, startShowroom, warmupAI]);

  const retryWarmup = useCallback((context: 'loading' | 'overlay') => {
    if (context === 'loading') {
      setAiLoadProgress(0);
      setAiLoadStartAt(Date.now());
      setAiPendingStart(true);
    }
    setAiWarmupSuccess(false);
    warmupAI('retry');
  }, [warmupAI]);

  useEffect(() => {
    if (gameState !== 'loading') return;
    if (!aiLoadStartAt) return;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - aiLoadStartAt;
      // Progress over 120 seconds (2 min for Modal cold start + model load)
      let progress = Math.min(elapsed / 120000, 1);

      // If already ready, ensure 100%
      if (aiWarmupStatus === 'ready') {
        progress = 1;
      }

      setAiLoadProgress(progress);
    }, 250);

    return () => window.clearInterval(interval);
  }, [gameState, aiLoadStartAt, aiWarmupStatus]);

  useEffect(() => {
    if (gameState !== 'loading') return;
    if (aiWarmupStatus !== 'ready') return;
    if (!aiPendingStart) return;
    if (aiLoadProgress < 1) return;
    if (!aiWarmupSuccess) return;

    setAiLoadProgress(1);
    // Fast transition once ready
    const timeout = window.setTimeout(() => {
      setAiPendingStart(false);
      setGameState('playing');
      startShowroom();
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [gameState, aiWarmupStatus, aiPendingStart, aiLoadProgress, aiWarmupSuccess, startShowroom]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if mobile on initial load
  const initialIsMobile = window.innerWidth <= 768;

  const playerRef = useRef<Player>({
    // Start at player's desk position based on initial screen size
    x: initialIsMobile ? 90 : 285,
    y: initialIsMobile ? 570 : 635,
    targetX: initialIsMobile ? 90 : 285,
    targetY: initialIsMobile ? 570 : 635,
    speed: 5,
  });

  const inventoryRef = useRef<CarType[]>(generateInventory(100));
  
  // Initial customers at positions appropriate for initial screen size
  const customersRef = useRef<Customer[]>(
    initialIsMobile 
      ? [
          generateCustomer(1, 120, 220),
          generateCustomer(2, 200, 260),
          generateCustomer(3, 280, 220),
        ]
      : [
          generateCustomer(1, 200, 220),
          generateCustomer(2, 400, 200),
          generateCustomer(3, 550, 220),
        ]
  );
  
  // Initialize with correct layout based on initial screen size
  const coworkersRef = useRef<Coworker[]>(initialIsMobile ? MOBILE_COWORKERS : INITIAL_COWORKERS);
  const desksRef = useRef<Desk[]>(initialIsMobile ? MOBILE_DESKS : INITIAL_DESKS);
  const nextCustomerIdRef = useRef(4);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Focus input when chat opens (desktop only - don't trigger mobile keyboard automatically)
  useEffect(() => {
    if (showInput && inputRef.current && !isMobile) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showInput, isMobile]);

  useEffect(() => {
    if (!showInventory) {
      setInventorySearch('');
    }
  }, [showInventory]);

  // Get canvas scale factor for responsive sizing
  const getCanvasScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const targetWidth = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
    return canvas.offsetWidth / targetWidth;
  }, [isMobile]);

  const spawnNewCustomer = useCallback(() => {
    const waitingCount = customersRef.current.filter(c => 
      c.active && !c.isStolen && c.conversationPhase === 'greeting'
    ).length;
    if (waitingCount >= MAX_WAITING_CUSTOMERS) return;

    const spawnLocs = isMobile ? MOBILE_SPAWN_LOCATIONS : SPAWN_LOCATIONS;
    const desks = desksRef.current;
    
    // Attempt to find a location not too close to other active customers or desks
    const availableLocations = spawnLocs.filter(loc => {
      const nearCustomer = customersRef.current.some(c => 
        c.active && !c.isStolen && Math.sqrt(Math.pow(c.x - loc.x, 2) + Math.pow(c.y - loc.y, 2)) < 50
      );
      const onDesk = desks.some(desk => 
        loc.x >= desk.x - 20 && loc.x <= desk.x + desk.w + 20 &&
        loc.y >= desk.y - 20 && loc.y <= desk.y + desk.h + 20
      );
      return !nearCustomer && !onDesk;
    });

    const spawnLoc = availableLocations.length > 0 
      ? availableLocations[Math.floor(Math.random() * availableLocations.length)]
      : spawnLocs[Math.floor(Math.random() * spawnLocs.length)];
    
    // Add small randomization to spawn location so they don't stack perfectly
    const randomizedLoc = {
      x: spawnLoc.x + (Math.random() * 40 - 20),
      y: spawnLoc.y + (Math.random() * 40 - 20)
    };
    
    const newCustomer = generateCustomer(nextCustomerIdRef.current++, randomizedLoc.x, randomizedLoc.y);
    customersRef.current = [...customersRef.current, newCustomer];
    return newCustomer;
  }, [isMobile]);

  const findPerfectCars = (customer: Customer | null) => {
    if (!customer) return [];
    return inventoryRef.current.filter(car => {
      const categoryMatch = customer.desiredCategory === 'any' || car.category === customer.desiredCategory;
      const featureMatch = customer.desiredFeatures.every(feature => car.features.includes(feature));
      const needModelMatch = customer.revealedPreferences.model && customer.desiredModel;
      const modelMatch = needModelMatch
        ? car.model.toLowerCase().includes(customer.desiredModel!.toLowerCase())
        : true;
      return categoryMatch && featureMatch && modelMatch;
    });
  };

  const handleNoOtherOptions = () => {
    if (!selectedPerson) return;

    // Find real customer in ref to ensure sync
    const realCustomer = customersRef.current.find(c => c.id === selectedPerson.id);
    if (!realCustomer) return;

    const playerText = "No other options?";
    const perfectMatches = findPerfectCars(realCustomer);
    if (perfectMatches.length > 0) {
      const response = "Actually, there is a car that fits already. Can we go back to that?";
      setConversation(prev => [
        ...prev,
        { sender: 'player', text: playerText },
        { sender: 'customer', text: response },
      ]);
      setIsTyping(false);
      return;
    }

    // Find cars in inventory that match their budget
    const budgetMax = realCustomer.buyerType === 'cash'
      ? realCustomer.budget * 1.1
      : realCustomer.maxPayment * 72; // Rough estimate for finance
    const affordableCars = inventoryRef.current.filter((car: CarType) => car.price <= budgetMax);

    // Case 1: Customer has NO specific model - they should provide one
    if (!realCustomer.desiredModel) {
      if (affordableCars.length > 0) {
        // Pick a random affordable car and set it as their desired model
        const randomCar = affordableCars[Math.floor(Math.random() * affordableCars.length)];
        // Extract brand and model from the car's model string (e.g., "2026 Ford Explorer" -> "Ford Explorer")
        const modelParts = randomCar.model.replace(/^\d{4}\s+/, ''); // Remove year prefix

        realCustomer.desiredModel = modelParts;
        realCustomer.revealedPreferences.model = true;
        realCustomer.interest = Math.min(100, realCustomer.interest + 5);
        setSelectedPerson({ ...realCustomer });

        const responses = [
          `Actually, now that I think about it... I've been eyeing the ${modelParts}.`,
          `You know what? I've heard good things about the ${modelParts}. Do you have one?`,
          `Hmm, let me be more specific. I'd really like to see a ${modelParts}.`,
          `Well, if you're asking... I've always wanted a ${modelParts}.`
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setConversation(prev => [
          ...prev,
          { sender: 'player', text: playerText },
          { sender: 'customer', text: response },
        ]);
        setIsTyping(false);
        return;
      }
    }

    // Case 2: Customer HAS a specific model - they can accept alternatives or decline
    if (realCustomer.desiredModel) {
      if (realCustomer.openToAlternative && affordableCars.length > 0) {
        // Pick a random affordable car and adjust preferences to match it
        const randomCar = affordableCars[Math.floor(Math.random() * affordableCars.length)];
        const newCategory = randomCar.category;
        const newFeatures = randomCar.features.slice(0, 2) as DesiredFeature[];

        // Update preferences to the new car type
        realCustomer.desiredModel = undefined;
        realCustomer.desiredCategory = newCategory;
        realCustomer.desiredFeatures = newFeatures;
        // Keep all preferences revealed - customer tells you directly what they want now
        realCustomer.revealedPreferences = { budget: true, type: true, features: true, model: true };
        realCustomer.interest = Math.min(100, realCustomer.interest + 10);
        realCustomer.openToAlternative = false;
        realCustomer.conversationPhase = 'negotiation';
        setSelectedPerson({ ...realCustomer });

        // Build response that tells them exactly what they're now open to
        const categoryLabel = CATEGORY_SEARCH_KEYWORDS[newCategory]?.[0] || newCategory;
        const featuresList = newFeatures.map(f => FEATURE_NAMES[f] || f).join(' and ');
        const budgetInfo = realCustomer.buyerType === 'cash'
          ? `$${realCustomer.budget.toLocaleString()}`
          : `$${realCustomer.maxPayment}/month`;

        const responses = [
          `Alright, I'm open to other options. I'd be happy with a ${categoryLabel} that's ${featuresList}. Budget is still ${budgetInfo}.`,
          `Fine, let's try something else. Show me a ${featuresList} ${categoryLabel} in my ${budgetInfo} range.`,
          `You know what? I'm flexible. A ${categoryLabel} with ${featuresList} features would work. Keep it under ${budgetInfo}.`,
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setConversation(prev => [
          ...prev,
          { sender: 'player', text: playerText },
          { sender: 'customer', text: response },
        ]);
        setIsTyping(false);
        return;
      } else {
        // Customer declines to look at alternatives - they leave
        realCustomer.isLost = true;
        realCustomer.conversationPhase = 'closed';
        setSelectedPerson({ ...realCustomer });
        const response = `I really had my heart set on the ${realCustomer.desiredModel}. I'll have to look elsewhere.`;
        setConversation(prev => [
          ...prev,
          { sender: 'player', text: playerText },
          { sender: 'customer', text: response },
        ]);
        setTimeout(() => setShowLostDeal(true), 1000);
        setIsTyping(false);
        return;
      }
    }

    // Fallback: No cars in their budget at all - they leave
    realCustomer.isLost = true;
    realCustomer.conversationPhase = 'closed';
    setSelectedPerson({ ...realCustomer });
    const response = "I really can't find anything in my budget here. I'll have to look elsewhere.";
    setConversation(prev => [
      ...prev,
      { sender: 'player', text: playerText },
      { sender: 'customer', text: response },
    ]);
    setTimeout(() => setShowLostDeal(true), 1000);
    setIsTyping(false);
  };

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (gameState === 'playing' && !showTimeUp && (settings.timer.enabled || settings.gameMode === 'volume')) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (settings.gameMode === 'volume') {
             // Count UP
             return prev + 1;
          } else {
             // Count DOWN
             if (prev <= 1) {
               clearInterval(interval);
               setShowTimeUp(true);
               // setGameState('intro'); // Don't switch yet, show results first
               return 0;
             }
             return prev - 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, settings.timer.enabled, timeLeft]);

  // Initialize game
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetWidth = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
    const targetHeight = isMobile ? MOBILE_CANVAS_HEIGHT : CANVAS_HEIGHT;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = getCanvasScale();
      
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const clickX = (clientX - rect.left) / scale;
      const clickY = (clientY - rect.top) / scale;

      // Check for button clicks on customers
      for (const customer of customersRef.current) {
        if (!customer.active) continue;
        if (customer.buttonBounds) {
          const { x, y, w, h } = customer.buttonBounds;
          if (clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h) {
            // Move to an unoccupied desk for the conversation
            const desks = desksRef.current;
            if (desks.length > 0) {
              // Find desks not occupied by coworkers
              const unoccupiedDesks = desks.filter(desk => {
                const deskCenterX = desk.x + desk.w / 2;
                const deskCenterY = desk.y + desk.h / 2;
                return !coworkersRef.current.some(coworker => 
                  Math.abs(coworker.x - deskCenterX) < 60 && 
                  Math.abs(coworker.y - deskCenterY) < 60
                );
              });
              
              const desk = unoccupiedDesks.length > 0 
                ? unoccupiedDesks[Math.floor(Math.random() * unoccupiedDesks.length)]
                : desks[Math.floor(Math.random() * desks.length)];
              
              // Player sits at the bottom of the desk
              playerRef.current.x = desk.x + desk.w / 2;
              playerRef.current.y = desk.y + desk.h + 55;
              playerRef.current.targetX = playerRef.current.x;
              playerRef.current.targetY = playerRef.current.y;
              // Customer sits across (top of desk)
              customer.x = desk.x + desk.w / 2;
              customer.y = desk.y - 55;
            }
            
            setSelectedPerson(customer);
            setShowInput(true);
            setConversation([]);
            setShowInventory(false);
            setShowNumbers(false);
            setCurrentCar(null);
            return;
          }
        }
      }

      if (showInput) return;

      // Check if clicked on a person
      let clickedPerson: Customer | Coworker | null = null;
      for (const customer of customersRef.current) {
        if (!customer.active) continue;
        const dist = Math.sqrt(Math.pow(clickX - customer.x, 2) + Math.pow(clickY - customer.y, 2));
        if (dist < 25 * (isMobile ? 1.5 : 1)) {
          clickedPerson = customer;
          break;
        }
      }

      if (!clickedPerson) {
        for (const coworker of coworkersRef.current) {
          const dist = Math.sqrt(Math.pow(clickX - coworker.x, 2) + Math.pow(clickY - coworker.y, 2));
          if (dist < 25 * (isMobile ? 1.5 : 1)) {
            clickedPerson = coworker;
            break;
          }
        }
      }

      if (clickedPerson && 'type' in clickedPerson && clickedPerson.type === 'customer') {
        playerRef.current.targetX = clickedPerson.x - 50;
        playerRef.current.targetY = clickedPerson.y;
        setSelectedPerson(clickedPerson as Customer);
      } else {
        playerRef.current.targetX = clickX;
        playerRef.current.targetY = clickY;
        setSelectedPerson(null);
        setShowInput(false);
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleClick);

    let lastTimestamp = 0; // Track previous frame time for deltaTime calculation

    const animate = (timestamp: number) => {
      // Calculate real deltaTime in seconds
      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return; // Skip first frame
      }

      const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      // Scale UI elements for mobile readability
      const uiScale = isMobile ? 1.75 : 1; 
      
      const player = playerRef.current;
      
      // Collision avoidance between all entities (player, coworkers, active customers)
      const entities: any[] = [
        player,
        ...coworkersRef.current,
        ...customersRef.current.filter(c => c.active)
      ];

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i];
          const e2 = entities[j];
          const dx = e2.x - e1.x;
          const dy = e2.y - e1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = 35; // Minimum distance between centers

          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            
            // Push away from each other
            const moveX = (nx * overlap) / 2;
            const moveY = (ny * overlap) / 2;
            
            // Coworkers are static at their desks
            const isE1Static = (e1 as any).type === 'coworker';
            const isE2Static = (e2 as any).type === 'coworker';

            // EXCEPTION: If a coworker is walking to/with a customer they stole, ignore collision between them
            const c1 = e1 as any;
            const c2 = e2 as any;
            if (c1.type === 'coworker' && c2.type === 'customer' && c1.workingWithCustomerId === c2.id) continue;
            if (c2.type === 'coworker' && c1.type === 'customer' && c2.workingWithCustomerId === c1.id) continue;

            if (isE1Static && !isE2Static) {
              e2.x += moveX * 2;
              e2.y += moveY * 2;
            } else if (!isE1Static && isE2Static) {
              e1.x -= moveX * 2;
              e1.y -= moveY * 2;
            } else if (!isE1Static && !isE2Static) {
              e1.x -= moveX;
              e1.y -= moveY;
              e2.x += moveX;
              e2.y += moveY;
            }
          }
        }
      }

      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const PLAYER_SPEED = 300; // pixels per second (was 5 px/frame * 60fps)
      if (dist > 2) {
        player.x += (dx / dist) * PLAYER_SPEED * deltaTime;
        player.y += (dy / dist) * PLAYER_SPEED * deltaTime;
      }

      // Clear canvas
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw entrance
      ctx.fillStyle = '#8b4513';
      const entranceX = isMobile ? (MOBILE_CANVAS_WIDTH / 2) - 30 : 380;
      ctx.fillRect(entranceX, 0, 60, 20);
      ctx.fillStyle = '#666';
      ctx.fillStyle = '#666';
      ctx.font = `${12 * uiScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('ENTRANCE', entranceX + 30, 35);

      // Draw grid
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw desks
      desksRef.current.forEach(desk => {
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(desk.x, desk.y, desk.w, desk.h);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(desk.x, desk.y, desk.w, desk.h);
      });

      // Draw coworkers
      coworkersRef.current.forEach(coworker => {
        // Check if this coworker is working with a stolen customer
        const isWorking = coworker.workingWithCustomerId !== undefined;
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(coworker.x, coworker.y + 20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = coworker.color;
        ctx.beginPath();
        ctx.arc(coworker.x, coworker.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Title badge (above name) - HIDE when working with customer
        if (!isWorking) {
          const titleWidth = ctx.measureText(coworker.title).width + 10;
          ctx.fillStyle = coworker.color;
          ctx.fillRect(coworker.x - titleWidth / 2, coworker.y - 48, titleWidth, 14);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${9 * uiScale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(coworker.title, coworker.x, coworker.y - 37);
        }

        // First name only
        ctx.fillStyle = '#000';
        ctx.font = `bold ${11 * uiScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(coworker.name, coworker.x, coworker.y - 22);
      });

      // Draw customers
      customersRef.current.forEach(customer => {
        if (!customer.active) return;

        const distToPlayer = Math.sqrt(
          Math.pow(player.x - customer.x, 2) +
          Math.pow(player.y - customer.y, 2)
        );
        const isNearby = distToPlayer < 80;
        const isStolen = customer.isStolen;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(customer.x, customer.y + 20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - grayed out if stolen
        ctx.fillStyle = isStolen ? '#888' : customer.color;
        ctx.beginPath();
        ctx.arc(customer.x, customer.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Interest bar - hidden if stolen
        if (!isStolen) {
          const barWidth = 30;
          const barHeight = 4;
          ctx.fillStyle = '#333';
          ctx.fillRect(customer.x - barWidth / 2, customer.y + 25, barWidth, barHeight);
          ctx.fillStyle = customer.interest > 60 ? '#2ecc71' : customer.interest > 30 ? '#f39c12' : '#e74c3c';
          ctx.fillRect(customer.x - barWidth / 2, customer.y + 25, (customer.interest / 100) * barWidth, barHeight);
        }

        // Name - show first name + last initial only (e.g., "Marcus W.")
        const nameParts = customer.name.split(' ');
        const displayName = nameParts.length > 1 
          ? `${nameParts[0]} ${nameParts[1][0]}.`
          : nameParts[0];
        ctx.fillStyle = isStolen ? '#999' : '#000';
        ctx.font = `bold ${11 * uiScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(displayName, customer.x, customer.y - 25);

        // Buyer type badge OR stolen badge
        if (isStolen) {
          // TAKEN badge - wider pill with clean styling
          const badgeWidth = 50;
          const badgeHeight = 14;
          ctx.fillStyle = '#c0392b';
          ctx.beginPath();
          ctx.roundRect(customer.x - badgeWidth/2, customer.y - 53, badgeWidth, badgeHeight, 7);
          ctx.fill();
          
          // Text (no emoji for cleaner look)
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${9 * uiScale}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText('TAKEN', customer.x, customer.y - 43);
        } else {
          ctx.fillStyle = customer.buyerType === 'cash' ? '#2ecc71' : '#3498db';
          ctx.fillRect(customer.x - 25, customer.y - 52, 50, 12);
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${8 * uiScale}px Arial`;
          ctx.fillText(customer.buyerType.toUpperCase(), customer.x, customer.y - 43);
        }

        // Talk button when nearby - hidden if stolen
        if (isNearby && !showInput && !isStolen) {
          const buttonX = customer.x - 30;
          const buttonY = customer.y + 35;
          const buttonW = 60 * uiScale;
          const buttonH = 20 * uiScale;

          customer.buttonBounds = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };

          ctx.fillStyle = '#2ecc71';
          ctx.fillRect(buttonX, buttonY, buttonW, buttonH);
          ctx.strokeStyle = '#27ae60';
          ctx.lineWidth = 2;
          ctx.strokeRect(buttonX, buttonY, buttonW, buttonH);

          ctx.fillStyle = '#fff';
          ctx.font = `bold ${11 * uiScale}px Arial`;
          ctx.fillText('TALK', customer.x, buttonY + (14 * uiScale));
        } else {
          customer.buttonBounds = null;
        }
      });

      // Draw player
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 20, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${11 * uiScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('YOU', player.x, player.y - 25);

      // Proactive Coworker Steal Mechanic
      // Sales coworkers steal less frequently to reduce pressure
      const salesCoworkers = coworkersRef.current.filter(c => c.department === 'sales');

      // Track unattended customers and despawn after 60 seconds
      customersRef.current.forEach(customer => {
        if (!customer.active) return;
        
        // Customer is considered "helped" if:
        // 1. They're stolen by a coworker (isStolen)
        // 2. They're past the greeting phase (conversation has started)
        const isBeingHelped = 
          customer.isStolen ||
          customer.conversationPhase !== 'greeting';
        
        if (!isBeingHelped) {
          // Increment unattended timer
          customer.unattendedTimer += deltaTime;
          
          // Despawn after 60 seconds (1 minute)
          if (customer.unattendedTimer >= 60) {
            customer.active = false;
            customer.isLost = true;
            // Remove from customers array
            customersRef.current = customersRef.current.filter(c => c.id !== customer.id);
          }
        } else {
          // Reset timer if being helped
          customer.unattendedTimer = 0;
        }
      });

      const waitingCount = customersRef.current.filter(c => 
        c.active && !c.isStolen && c.conversationPhase === 'greeting'
      ).length;
      if (waitingCount < MIN_WAITING_CUSTOMERS && waitingCount < MAX_WAITING_CUSTOMERS) {
        spawnNewCustomer();
      }
      
      salesCoworkers.forEach(coworker => {
        // Initialize steal timer if not set
        if (coworker.nextStealTime === undefined) {
          coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
        }
        
        // Handle pending customer spawn (delayed 3-5 seconds after steal)
        if (coworker.pendingCustomerSpawn !== undefined && coworker.pendingCustomerSpawn > 0) {
          coworker.pendingCustomerSpawn -= deltaTime;
          if (coworker.pendingCustomerSpawn <= 0) {
            coworker.pendingCustomerSpawn = undefined;
            spawnNewCustomer();
          }
        }
        
        // If coworker is working with a stolen customer
        if (coworker.workingWithCustomerId !== undefined) {
          const customer = customersRef.current.find(c => c.id === coworker.workingWithCustomerId);
          if (!customer || !customer.active) {
            coworker.workingWithCustomerId = undefined;
            coworker.workingTimer = 0;
            coworker.stealPhase = undefined;
            coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
            return;
          }
          if (customer) {
            
              // PHASE 1: Walking to customer
              if (coworker.stealPhase === 'walking') {
                const dx = customer.x - coworker.x;
                const dy = customer.y - coworker.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 15) {
                  // Still walking to customer
                  const COWORKER_SPEED = 150; // pixels per second (was 2.5 px/frame * 60fps)
                  coworker.x += (dx / dist) * COWORKER_SPEED * deltaTime;
                  coworker.y += (dy / dist) * COWORKER_SPEED * deltaTime;

                  // CHECK FOR INTERCEPTION: If player talks to this customer while walking
                  // Using specific customer reference since 'customer' variable in this scope is valid
                  const isIntercepted = showInput && selectedPerson?.id === customer.id;
                  
                  if (isIntercepted || !customer.active || customer.isLost) {
                     // Abort steal!
                     coworker.stealPhase = 'returning';
                     coworker.workingWithCustomerId = undefined;
                     coworker.nextStealTime = STEAL_INTERVAL_MIN;
                     coworker.pendingCustomerSpawn = undefined;
                  }

                } else {
                  // Arrived at customer! 
                  // Final check - is player talking to them?
                  const isIntercepted = showInput && selectedPerson?.id === customer.id;
                  
                  if (isIntercepted) {
                     // Abort steal!
                     coworker.stealPhase = 'returning';
                     coworker.workingWithCustomerId = undefined;
                     coworker.nextStealTime = STEAL_INTERVAL_MIN; 
                     coworker.pendingCustomerSpawn = undefined;
                  } else {
                    // SUCCESSFUL STEAL
                    customer.isStolen = true;
                    customer.stolenByCoworkerId = coworker.id;
                    // Set these now, not at start
                    customer.stolenDealTimer = 0;
                    customer.stolenDealDuration = COWORKER_DEAL_MIN + Math.random() * (COWORKER_DEAL_MAX - COWORKER_DEAL_MIN);

                    coworker.stealPhase = 'greeting';
                    coworker.workingTimer = 0; // Use workingTimer for greeting duration
                  }
                }
              }
              
              // NEW PHASE: Greeting customer (pause for interaction)
              else if (coworker.stealPhase === 'greeting') {
                coworker.workingTimer = (coworker.workingTimer || 0) + deltaTime;
                
                // Wait for 1.5 seconds before returning
                if (coworker.workingTimer >= 1.5) {
                  coworker.stealPhase = 'returning';
                  coworker.workingTimer = 0;
                }
              }
            
            // PHASE 2: Returning to desk with customer
            else if (coworker.stealPhase === 'returning') {
              const targetX = coworker.originalX || 0;
              const targetY = coworker.originalY || 0;
              const dx = targetX - coworker.x;
              const dy = targetY - coworker.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist > 5) {
                // Move coworker back to desk
                const COWORKER_SPEED = 150; // pixels per second (was 2.5 px/frame * 60fps)
                coworker.x += (dx / dist) * COWORKER_SPEED * deltaTime;
                coworker.y += (dy / dist) * COWORKER_SPEED * deltaTime;

                // Customer follows coworker (slightly behind)
                const custTargetX = coworker.x;
                const custTargetY = coworker.y + 45;
                const cdx = custTargetX - customer.x;
                const cdy = custTargetY - customer.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist > 5) {
                  customer.x += (cdx / cdist) * COWORKER_SPEED * deltaTime;
                  customer.y += (cdy / cdist) * COWORKER_SPEED * deltaTime;
                }
              } else {
                // Coworker arrived at desk! Position customer in front
                coworker.x = targetX;
                coworker.y = targetY;
                customer.x = targetX;
                customer.y = targetY - 55;
                coworker.stealPhase = 'working';
                coworker.workingTimer = 0;
              }
            }
            
            // PHASE 3: Working at desk
            else if (coworker.stealPhase === 'working') {
              // Increment working timer
              coworker.workingTimer = (coworker.workingTimer || 0) + deltaTime;
              
              // Customer stays in front of desk
              customer.x = (coworker.originalX || coworker.x);
              customer.y = (coworker.originalY || coworker.y) - 55;
              
              // Increment deal timer
              customer.stolenDealTimer = (customer.stolenDealTimer || 0) + deltaTime;
              
              // Check if deal time is up
              if (customer.stolenDealDuration && customer.stolenDealTimer >= customer.stolenDealDuration) {
                // Resolve the deal - 50/50 chance
                const coinToss = Math.random();
                
                if (coinToss >= 0.5) {
                  // Coworker makes the sale - but DON'T count towards player stats
                  customer.active = false;
                  customer.conversationPhase = 'closed';
                  
                  // Simulation only: inventory remains untouched for the player
                  /* 
                  if (settings.gameMode === 'volume') {
                    const randomCar = inventoryRef.current[Math.floor(Math.random() * inventoryRef.current.length)];
                    if (randomCar) {
                      const carIndex = inventoryRef.current.findIndex(c => c.id === randomCar.id);
                      if (carIndex > -1) {
                        inventoryRef.current.splice(carIndex, 1);
                      }
                    }
                  }
                  */
                } else {
                  // Customer leaves (deal lost)
                  customer.active = false;
                  customer.isLost = true;
                  customer.conversationPhase = 'closed';
                }
                
                // Reset coworker state
                coworker.workingWithCustomerId = undefined;
                coworker.workingTimer = 0;
                coworker.stealPhase = undefined;
                coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
                
                // Reset customer stolen state
                customer.isStolen = false;
                customer.stolenByCoworkerId = undefined;
                customer.stolenDealTimer = undefined;
                customer.stolenDealDuration = undefined;
                customersRef.current = customersRef.current.filter(c => c.id !== customer.id);
              }
              
              // Draw pencil/working animation on the coworker
              const pencilBob = Math.sin(Date.now() / 200) * 3; // Bobbing animation
              ctx.save();
              ctx.translate(coworker.originalX || coworker.x, (coworker.originalY || coworker.y) - 30 + pencilBob);
              
              // Draw pencil icon
              ctx.fillStyle = '#f1c40f';
              ctx.fillRect(-3, -10, 6, 16); // Pencil body
              ctx.fillStyle = '#e74c3c';
              ctx.fillRect(-3, -10, 6, 4); // Eraser
              ctx.fillStyle = '#2c3e50';
              ctx.beginPath();
              ctx.moveTo(-3, 6);
              ctx.lineTo(0, 12);
              ctx.lineTo(3, 6);
              ctx.closePath();
              ctx.fill(); // Pencil tip
              
              ctx.restore();
            }
          }
        } else {
          // Coworker is available to steal - decrement steal timer
          coworker.nextStealTime -= deltaTime;
          
          if (coworker.nextStealTime <= 0) {
            // Time to steal! Find an available customer
            const availableCustomers = customersRef.current.filter(c => 
              c.active && 
              !c.isStolen && 
              c.conversationPhase === 'greeting' &&
              // Not currently being talked to by player
              !(showInput && selectedPerson?.id === c.id)
            );
            
            if (availableCustomers.length > 0) {
              // Pick a random customer to steal
              const victim = availableCustomers[Math.floor(Math.random() * availableCustomers.length)];
              
              // Mark customer as target (but NOT stolen yet)
              // victim.isStolen = true; // CHANGED: Don't set this yet
              // victim.stolenByCoworkerId = coworker.id; // CHANGED: Don't set this yet
              // victim.stolenDealTimer = 0; // CHANGED: Don't set this yet
              // victim.stolenDealDuration = 15 + Math.random() * 15; // CHANGED: Don't set this yet
              
              // Coworker starts walking to customer
              coworker.workingWithCustomerId = victim.id;
              coworker.workingTimer = 0;
              coworker.stealPhase = 'walking';
              
              // Schedule a new customer to spawn after 3-5 second delay
              coworker.pendingCustomerSpawn = 3 + Math.random() * 2;
            } else {
              // No customers to steal, try again later
              coworker.nextStealTime = STEAL_INTERVAL_MIN + Math.random() * (STEAL_INTERVAL_MAX - STEAL_INTERVAL_MIN);
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, showInput, getCanvasScale, isMobile]);

  const handleDiscoveryAction = async (type: 'budget' | 'type' | 'features' | 'model') => {
    if (!selectedPerson) return;
    
    // Find real customer object to ensure stats sync with game loop
    const realCustomer = customersRef.current.find(c => c.id === selectedPerson.id);
    if (!realCustomer) return;

    let question = "";
    let messageType: any = "";

    switch (type) {
      case 'budget':
        question = "Budget?";
        messageType = 'ask_budget';
        break;
      case 'type':
        question = "Looking for?";
        messageType = 'ask_type';
        break;
      case 'features':
        question = "Needs?";
        messageType = 'ask_features';
        break;
      case 'model':
        question = "Specific model?";
        messageType = 'ask_model';
        break;
    }

    setConversation(prev => [...prev, { sender: 'player', text: question }]);
    setIsTyping(true);

    let response: string;
    let interestChange: number;
    let newPhase;


    if (settings.useAI && (settings.apiKey || settings.provider === 'local')) {
      // Pass the specific message type to override context
      // Use realCustomer here
      const result = await getAIResponse(realCustomer, question, currentCar, settings, { messageType });
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;

      
      realCustomer.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: response }
      );
    } else {
      const result = generateResponse({
        customer: realCustomer, // Use realCustomer
        currentCar, 
        messageType: messageType,
      });
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;
    }

    realCustomer.interest = Math.max(0, Math.min(100, realCustomer.interest + interestChange));
    if (newPhase) realCustomer.conversationPhase = newPhase;
    
    // ZERO INTEREST = AUTO FAIL: Customer leaves immediately if interest hits 0
    if (realCustomer.interest === 0) {
      realCustomer.isLost = true;
      realCustomer.conversationPhase = 'closed';
      const frustrationResponses = {
        friendly: "I'm sorry, but I've completely lost interest. Good luck!",
        serious: "I've had enough. I'm done here.",
        skeptical: "This is a complete waste of my time. I'm out.",
        enthusiastic: "I was really hopeful but... this isn't working at all. Goodbye.",
        analytical: "Interest level has reached zero. Interaction terminated."
      };
      response = frustrationResponses[realCustomer.personality];
      setConversation(prev => [...prev, { sender: 'customer', text: response }]);
      setIsTyping(false);
      setSelectedPerson({ ...realCustomer });
      setTimeout(() => setShowLostDeal(true), 1000);
      return; // Exit early
    }
    
    // LOW INTEREST DEPARTURE: If interest drops below 5%, high chance they leave
    if (realCustomer.interest < 5 && Math.random() < 0.8) {
      realCustomer.isLost = true;
      realCustomer.conversationPhase = 'closed';
      const frustrationResponses = {
        friendly: "I'm sorry, but I don't think this is going to work out. Good luck!",
        serious: "I've had enough. I'm leaving.",
        skeptical: "This is a waste of my time. I'm out.",
        enthusiastic: "Okay, I was really hopeful but... I need to leave.",
        analytical: "The interaction has become unproductive. Terminating."
      };
      response = frustrationResponses[realCustomer.personality];
      setConversation(prev => [...prev, { sender: 'customer', text: response }]);
      setIsTyping(false);
      setSelectedPerson({ ...realCustomer });
      setTimeout(() => setShowLostDeal(true), 1000);
      return; // Exit early
    }
    
    // Force state update by creating a shallow clone of the updated real customer
    setSelectedPerson({ ...realCustomer });
    
    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);
  };

  const showCarToCustomer = async (car: CarType) => {
    if (!selectedPerson) return;

    // Check if we've discovered their needs (type, features, budget)
    const needsDiscovered = selectedPerson.revealedPreferences.type &&
                           selectedPerson.revealedPreferences.features &&
                           selectedPerson.revealedPreferences.budget;

    // If needs not discovered, customer tells you what they want first
    if (!needsDiscovered) {
      const showText = `Let me show you the ${car.model} ${car.trim} in ${car.color}.`;
      setConversation(prev => [...prev, { sender: 'player', text: showText }]);

      // Reveal all their preferences
      selectedPerson.revealedPreferences.type = true;
      selectedPerson.revealedPreferences.features = true;
      selectedPerson.revealedPreferences.budget = true;

      // Build response about what they actually want
      const categoryLabel = CATEGORY_SEARCH_KEYWORDS[selectedPerson.desiredCategory]?.[0] || selectedPerson.desiredCategory;
      const featuresList = selectedPerson.desiredFeatures.map(f => FEATURE_NAMES[f] || f).join(' and ');
      const budgetInfo = selectedPerson.buyerType === 'cash'
        ? `around $${selectedPerson.budget.toLocaleString()}`
        : `$${selectedPerson.maxPayment}/month with $${selectedPerson.desiredDown.toLocaleString()} down`;

      const responses = [
        `Hold on - before we look at cars, let me tell you what I need. I'm looking for something ${featuresList}, preferably a ${categoryLabel}. My budget is ${budgetInfo}.`,
        `Wait, let me be upfront about what I want first. I need a ${categoryLabel} that's ${featuresList}. I can spend ${budgetInfo}.`,
        `Actually, let's back up. I should tell you - I want something ${featuresList} in the ${categoryLabel} category. Budget-wise, I'm at ${budgetInfo}.`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];

      selectedPerson.interest = Math.max(0, selectedPerson.interest - 5); // Slight penalty for not asking first
      setSelectedPerson({ ...selectedPerson });
      setConversation(prev => [...prev, { sender: 'customer', text: response }]);
      return; // Don't show the car yet - let them pick the right one now
    }

    setCurrentCar(car);
    setCustomSellingPrice(car.price);
    setCustomOTDPrice(car.otd);
    setDownPayment(0);
    setCustomPayment(calculatePayment(car.otd, 0, paymentAPR, paymentTerm));

    // Don't mention price when showing the car - realistic sales flow
    const showText = `Let me show you the ${car.model} ${car.trim} in ${car.color}. It's a brand new 2026 model with 0 miles.`;
    setConversation(prev => [...prev, { sender: 'player', text: showText }]);
    setIsTyping(true);

    let response: string;
    let interestChange: number;
    let newPhase;
    let isLost = false;

    if (settings.useAI && (settings.apiKey || settings.provider === 'local')) {
      const result = await getAIResponse(selectedPerson, showText, car, settings, { messageType: 'car_shown' });
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;
      isLost = !!result.isLost;
      selectedPerson.conversationHistory.push(
        { role: 'user', content: showText },
        { role: 'assistant', content: response }
      );
    } else {
      const result = generateResponse({
        customer: selectedPerson,
        currentCar: car,
        messageType: 'car_shown',
      });
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;
    }

    selectedPerson.interest = Math.max(0, Math.min(100, selectedPerson.interest + interestChange));
    if (newPhase) selectedPerson.conversationPhase = newPhase;
    
    // ZERO INTEREST = AUTO FAIL: Customer leaves immediately if interest hits 0
    if (!isLost && selectedPerson.interest === 0) {
      isLost = true;
      const frustrationResponses = {
        friendly: "I'm sorry, but I've completely lost interest. Good luck!",
        serious: "I've had enough. I'm done here.",
        skeptical: "This is a complete waste of my time. I'm out.",
        enthusiastic: "I was really hopeful but... this isn't working at all. Goodbye.",
        analytical: "Interest level has reached zero. Interaction terminated."
      };
      response = frustrationResponses[selectedPerson.personality];
    }
    
    // LOW INTEREST DEPARTURE: If interest drops below 5%, high chance they leave
    if (!isLost && selectedPerson.interest < 5 && Math.random() < 0.8) {
      isLost = true;
      const frustrationResponses = {
        friendly: "I'm sorry, but I don't think this is going to work out. Good luck!",
        serious: "I've had enough. I'm leaving.",
        skeptical: "This is a waste of my time. I'm out.",
        enthusiastic: "Okay, I was really hopeful but... I need to leave.",
        analytical: "The interaction has become unproductive. Terminating."
      };
      response = frustrationResponses[selectedPerson.personality];
    }
    
    if (isLost) {
      selectedPerson.isLost = true;
      selectedPerson.conversationPhase = 'closed';
      setTimeout(() => setShowLostDeal(true), 1000);
    }
    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);
  };

  const makeOffer = async (price: number, type: OfferType) => {
    if (!selectedPerson || !currentCar) return;

    let offerText = '';
    if (type === 'payment') {
      offerText = `I can get you into this ${currentCar.model} for $${price}/month with $${downPayment.toLocaleString()} down at ${paymentAPR}% APR for ${paymentTerm} months.`;
    } else if (type === 'otd') {
      const tax = Math.round(customSellingPrice * 0.07);
      offerText = `I've got a total out-the-door price of $${price.toLocaleString()} for you. That's $${customSellingPrice.toLocaleString()} plus $${tax.toLocaleString()} tax and $${currentCar.fees.toLocaleString()} in fees.`;
    } else {
      offerText = `I can offer $${price.toLocaleString()} for the ${currentCar.model}.`;
    }

    setConversation(prev => [...prev, { 
      sender: 'player', 
      text: offerText,
      offerDetails: { price, type, downPayment, paymentAPR, paymentTerm }
    }]);
    setIsTyping(true);

    let response: string;
    let interestChange: number;
    let dealAccepted: boolean;
    let isLost = false;

    const offerContext = {
      customer: selectedPerson,
      currentCar,
      messageType: 'offer' as const,
      offerPrice: price,
      offerType: type,
      offerDownPayment: downPayment,
      offerAPR: paymentAPR,
      offerTerm: paymentTerm
    };

    if (settings.useAI && (settings.apiKey || settings.provider === 'local')) {
      const result = await getAIResponse(selectedPerson, offerText, currentCar, settings, offerContext);
      response = result.response;
      interestChange = result.interestChange;
      dealAccepted = result.dealAccepted;
      isLost = !!result.isLost;
      if (!dealAccepted && hasCommitmentIntent(response)) {
        dealAccepted = true;
        (selectedPerson as any).committedToBuy = true;
      }
      selectedPerson.conversationHistory.push(
        { role: 'user', content: offerText },
        { role: 'assistant', content: response }
      );
    } else {
      const result = generateResponse(offerContext);
      response = result.response;
      interestChange = result.interestChange;
      dealAccepted = result.dealAccepted;
      isLost = !!result.isLost;
      if (!dealAccepted && hasCommitmentIntent(response)) {
        dealAccepted = true;
        (selectedPerson as any).committedToBuy = true;
      }
    }


    selectedPerson.interest = Math.max(0, Math.min(100, selectedPerson.interest + interestChange));

    // ZERO INTEREST = AUTO FAIL: Customer leaves immediately if interest hits 0
    if (!isLost && !dealAccepted && selectedPerson.interest === 0) {
      isLost = true;
      const frustrationResponses = {
        friendly: "I'm sorry, but I've completely lost interest. Good luck!",
        serious: "I've had enough. I'm done here.",
        skeptical: "This is a complete waste of my time. I'm out.",
        enthusiastic: "I was really hopeful but... this isn't working at all. Goodbye.",
        analytical: "Interest level has reached zero. Interaction terminated."
      };
      response = frustrationResponses[selectedPerson.personality];
    }

    // LOW INTEREST DEPARTURE: If interest drops below 5%, high chance they leave
    if (!isLost && !dealAccepted && selectedPerson.interest < 5 && Math.random() < 0.8) {
      isLost = true;
      const frustrationResponses = {
        friendly: "I'm sorry, but I don't think this is going to work out. Good luck!",
        serious: "I've had enough. I'm leaving.",
        skeptical: "This is a waste of my time. I'm out.",
        enthusiastic: "Okay, I was really hopeful but... I need to leave.",
        analytical: "The interaction has become unproductive. Terminating."
      };
      response = frustrationResponses[selectedPerson.personality];
    }

    if (dealAccepted) {
      setAgreedPrice(price);
      setAgreedType(type);
      // Don't auto-close! Wait for player to click Close Deal button
      // But we can give a hint in the response or trust the "dealAccepted" flag for internal logic if needed
    } else if (isLost) {
      selectedPerson.isLost = true;
      selectedPerson.conversationPhase = 'closed';
      setTimeout(() => setShowLostDeal(true), 1000);
    } else {
      selectedPerson.conversationPhase = 'negotiation';
    }

    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);

    // FIX: On mobile, close the Numbers/Inventory panels so the user can see the chat/response
    if (isMobile) {
      setShowNumbers(false);
      setShowInventory(false);
    }
  };
  
  // Validation: Check if customer likes the car (features/category match)
  const customerLikesTheCar = (customer: Customer, car: CarType): boolean => {
    // Check category match (if they have a preference)
    const categoryMatch = customer.desiredCategory === 'any' || customer.desiredCategory === car.category;

    // Check feature matches
    const featureMatches = customer.desiredFeatures.filter(feature =>
      car.features.includes(feature)
    ).length;

    // Likes the car if:
    // - Category matches AND has at least 1 desired feature, OR
    // - Has 2+ desired features (even if category doesn't match)
    return (categoryMatch && featureMatches >= 1) || featureMatches >= 2;
  };

  // Validation: Check if customer likes the price
  const customerLikesThePrice = (customer: Customer, agreedPrice: number): boolean => {
    if (!agreedPrice || agreedPrice === 0) return false; // No price agreed yet

    const moodMultiplier = 1 + (customer.interest / 1000); // 0-10% bonus based on interest
    const effectiveBudget = customer.buyerType === 'cash'
      ? Math.round(customer.budget * moodMultiplier)
      : Math.round(customer.maxPayment * moodMultiplier);

    // Price is acceptable if within effective budget (with mood bonus)
    return agreedPrice <= effectiveBudget;
  };

  const hasCommitmentIntent = (text: string): boolean => {
    const normalized = text.toLowerCase();
    const hasPositive = /\b(buy|purchase|deal|take it|sign|ready|prepared|accept|lock it in|lock it|let's do it|lets do it|move forward|i'll take it|i will take it|we have a deal)\b/.test(normalized);
    const hasNegation = /\b(not|n't|won't|can't|dont|don't)\s+(ready|buy|purchase|deal|sign|take|accept|lock|move)\b/.test(normalized);
    return hasPositive && !hasNegation;
  };

  const attemptCloseDeal = () => {
    if (!selectedPerson || !currentCar) return;

    // If customer already accepted, just finalize the deal immediately
    if (selectedPerson.conversationPhase === 'closed') {
      // Set agreed price/type if not set
      if (agreedPrice === 0) {
        setAgreedPrice(customSellingPrice);
        setAgreedType('selling');
      }
      setShowDealClosed(true);
      return;
    }

    // Increment close attempts
    selectedPerson.closeAttempts = (selectedPerson.closeAttempts || 0) + 1;

    const priceForEvaluation = agreedPrice || customSellingPrice;

    // Check if customer already committed via "take it or leave it" or explicit agreement
    const isCommitted = (selectedPerson as any).committedToBuy === true;

    // FIRST: Check if customer likes the car AND the price
    const likesTheCar = isCommitted || customerLikesTheCar(selectedPerson, currentCar);
    const likesThePrice = isCommitted || customerLikesThePrice(selectedPerson, priceForEvaluation);

    // ATTRITION / PRESSURE SALE LOGIC
    // If we've tried 3+ times and price is within 20% of base budget, give a small extra chance
    const baseBudget = selectedPerson.buyerType === 'cash' ? selectedPerson.budget : selectedPerson.maxPayment;
    const isWithin20Percent = priceForEvaluation > 0 && (priceForEvaluation <= baseBudget * 1.2);
    const isAttritionSuccess = selectedPerson.closeAttempts >= 3 && isWithin20Percent && Math.random() < 0.15;
    const priceWithinBaseBudget = priceForEvaluation > 0 && baseBudget > 0 && priceForEvaluation <= baseBudget;
    const forceHappyDeal = isCommitted || (priceWithinBaseBudget && likesTheCar && likesThePrice);
    const shouldFailBecausePrice = !isCommitted && !priceWithinBaseBudget && !likesThePrice;

    // If either condition fails, provide specific feedback
    if (!isAttritionSuccess && (!likesTheCar || shouldFailBecausePrice)) {
      const closingQuestions = [
        "Are you ready to sign the paperwork and drive this home today?",
        "So, do we have a deal?",
        "Can I get you to sign right here so we can get this cleaned up for you?",
        "If I can get the detail team started now, can we wrap this up?",
        "Are you ready to make this official?",
        "Shall we head to the office and finalize everything?",
        "Does this all look good enough to put your name on it today?"
      ];
      const playerMessage = closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
      setConversation(prev => [...prev, { sender: 'player', text: playerMessage }]);
      setIsTyping(true);

      setTimeout(() => {
        let objection = "";
        let isLeaving = selectedPerson.closeAttempts >= 4;

        if (isLeaving) {
          const leaveResponses = {
            friendly: "I've told you I'm not ready, but you keep pushing. I think I'll try another dealership. Goodbye.",
            serious: "This high-pressure tactic is unprofessional. I am leaving.",
            skeptical: "I knew you were going to try and push me. I'm done here.",
            enthusiastic: "Wow, okay... that's a lot of pressure. I think I need to go.",
            analytical: "Persistent solicitation after negative feedback is inefficient. I am terminating this interaction."
          };
          objection = leaveResponses[selectedPerson.personality];
        } else if (!likesTheCar && !likesThePrice) {
          // Both issues
          const responses = {
            friendly: "Honestly, I'm not sure this car is the right fit for me, and the price is a bit high...",
            serious: "Neither the vehicle nor the pricing meets my requirements.",
            skeptical: "I don't think this car is what I'm looking for, and the numbers don't work either.",
            enthusiastic: "I really want to love it, but it's not quite what I need and it's stretching my budget...",
            analytical: "The vehicle specifications don't align with my criteria, and the price exceeds my parameters."
          };
          objection = responses[selectedPerson.personality];
        } else if (!likesTheCar) {
          // Car doesn't match preferences
          const responses = {
            friendly: "I appreciate you showing me this, but I'm not sure it's the right car for me...",
            serious: "This vehicle doesn't meet my requirements.",
            skeptical: "I don't think this is what I'm looking for.",
            enthusiastic: "It's nice, but I was hoping for something a bit different...",
            analytical: "The vehicle specifications don't align with my desired features."
          };
          objection = responses[selectedPerson.personality];
        } else {
          // Price too high
          const responses = {
            friendly: "I like the car, but I'm still not comfortable with the price...",
            serious: "The vehicle is acceptable, but the price is not.",
            skeptical: "The car is fine, but I think the price is too high.",
            enthusiastic: "I love it! But my budget is telling me to wait...",
            analytical: "The vehicle meets my criteria, but the price exceeds my acceptable range."
          };
          objection = responses[selectedPerson.personality];
        }

        setConversation(prev => [...prev, {
          sender: 'customer',
          text: objection,
          sentiment: 'mad'
        }]);

        if (isLeaving) {
          selectedPerson.isLost = true;
          selectedPerson.conversationPhase = 'closed';
          setTimeout(() => setShowLostDeal(true), 1000);
        } else {
          // Small penalty for pushing when they're not ready
          selectedPerson.interest = Math.max(0, selectedPerson.interest - 5);
          selectedPerson.conversationPhase = 'negotiation';
        }
        setIsTyping(false);
      }, 1500);

      return; // Stop here - don't proceed to deal closing logic
    }

    // If we get here, customer likes both the car AND the price
    // Analyze context BEFORE adding player message
    let contextBonus = 0;
    const reversedConv = [...conversation].reverse();
    const lastCustomerMsg = reversedConv.find(m => m.sender === 'customer');

    if (lastCustomerMsg) {
      const text = lastCustomerMsg.text.toLowerCase();
      // If they literally just said they want to buy, guarantee success
      // Check for buy keywords AND ensure they aren't negated closely (e.g. "not ready", "won't buy")
      if (hasCommitmentIntent(text)) {
        contextBonus = 2.0; // Guaranteed
      }
    }

    // Add player message
    const closingQuestions = [
      "Are you ready to sign the paperwork and drive this home today?",
      "So, do we have a deal?",
      "Can I get you to sign right here so we can get this cleaned up for you?",
      "If I can get the detail team started now, can we wrap this up?",
      "Are you ready to make this official?",
      "Shall we head to the office and finalize everything?",
      "Does this all look good enough to put your name on it today?"
    ];
    const playerMessage = closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
    setConversation(prev => [...prev, { sender: 'player', text: playerMessage }]);
    setIsTyping(true);

    setTimeout(() => {
      let successChance = 0;

      // Base chance on interest (allow starting at 30%)
      if (selectedPerson.interest >= 30) {
        // Linear interpolation: 30% interest = 20% chance, 100% interest = 95% chance
        const slope = (0.95 - 0.20) / (100 - 30);
        successChance = 0.20 + (slope * (selectedPerson.interest - 30));
      }

      // Apply context bonus (e.g. if they said "I'm ready")
      successChance += contextBonus;

      const roll = Math.random();
      const isSuccess = forceHappyDeal || (roll < successChance) || isAttritionSuccess;
      let response = "";

      if (isSuccess) {
        // Success!
        if (isAttritionSuccess) {
           const persistenceResponses = [
             "You're persistent, I'll give you that. Fine, let's just get it over with. I'll take it.",
             "Alright, alright! You've worn me down. I'll sign the papers.",
             "You know what? Life is short. Let's do this deal.",
             "I'm tired of negotiating. If you can get me out of here in an hour, we have a deal."
           ];
           response = persistenceResponses[Math.floor(Math.random() * persistenceResponses.length)];
        } else {
           const responses = {
             friendly: "You know what? Let's do it! I'm excited!",
             serious: "Acceptable. Let's proceed with the paperwork.",
             skeptical: "Fine, you earned it. The deal is fair enough.",
             enthusiastic: "YES! Let's do it! I'm SO ready to drive this home!",
             analytical: "The numbers align with my targeted metrics. I accept."
           };
           response = responses[selectedPerson.personality];
        }
        setConversation(prev => [...prev, {
          sender: 'customer',
          text: response,
          sentiment: 'happy'
        }]);

        selectedPerson.conversationPhase = 'closed';
        // Set agreed price/type if not set (default to current offer or list price)
        if (agreedPrice === 0) {
           setAgreedPrice(customSellingPrice);
           setAgreedType('selling');
        }
        setShowDealClosed(true);

      } else {
        // FAILURE
        let response = "";
        let isLeaving = selectedPerson.closeAttempts >= 4;

        if (isLeaving) {
          const leaveResponses = {
            friendly: "I've told you I'm not ready, but you keep pushing. I think I'll try another dealership. Goodbye.",
            serious: "This high-pressure tactic is unprofessional. I am leaving.",
            skeptical: "I knew you were going to try and push me. I'm done here.",
            enthusiastic: "Wow, okay... that's a lot of pressure. I think I need to go.",
            analytical: "Persistent solicitation after negative feedback is inefficient. I am terminating this interaction."
          };
          response = leaveResponses[selectedPerson.personality];
        } else {
          // Fail - determine if it's "thinking" or "objection"
          const isObjection = Math.random() > 0.5;

          if (isObjection) {
            // Harder rejection but REDUCED penalty (was 10) to avoid tanking too hard
            const penalty = 5;
            selectedPerson.interest = Math.max(0, selectedPerson.interest - penalty);

            const responses = {
              friendly: "I'm still not 100% sure about the price... it's a bit of a stretch.",
              serious: "The terms are not yet where I need them to be.",
              skeptical: "I feel like there's a better deal elsewhere. Not ready.",
              enthusiastic: "I want it, but my wallet is telling me to wait...",
              analytical: "The value proposition does not yet justify the expenditure."
            };
            response = responses[selectedPerson.personality];
          } else {
            // Soft "thinking about it" - no penalty
            const responses = {
              friendly: "I really like it, but let me think it over for a just a minute.",
              serious: "I need a moment to consider the final figures.",
              skeptical: "Let me verify these numbers one more time.",
              enthusiastic: "It's so nice! I just need to take a deep breath before deciding.",
              analytical: "I need to run the calculations once more to be certain."
            };
            response = responses[selectedPerson.personality];
          }
        }

        setConversation(prev => [...prev, {
          sender: 'customer',
          text: response,
          sentiment: 'mad'
        }]);

        if (isLeaving) {
          selectedPerson.isLost = true;
          selectedPerson.conversationPhase = 'closed';
          setTimeout(() => setShowLostDeal(true), 1000);
        } else {
          selectedPerson.conversationPhase = 'negotiation';
        }
      }

      setIsTyping(false);
    }, 1500);
  };

  const signDeal = () => {
    if (!selectedPerson || !currentCar) return;

    selectedPerson.active = false;
    
    // Remove customer from the showroom
    customersRef.current = customersRef.current.filter(c => c.id !== selectedPerson.id);

    // Calculate profit properly based on offer type
    let profit = 0;
    let saleAmount = 0;
    
    if (agreedType === 'selling') {
      // Selling price offer - profit is selling price minus invoice
      profit = agreedPrice - currentCar.invoice;
      saleAmount = agreedPrice + currentCar.fees + Math.round(agreedPrice * 0.07);
    } else if (agreedType === 'otd') {
      // OTD offer - need to back out tax and fees to get selling price
      // OTD = selling + tax(7%) + fees
      // OTD = selling + (selling * 0.07) + fees
      // OTD - fees = selling * 1.07
      // selling = (OTD - fees) / 1.07
      const sellingPrice = Math.round((agreedPrice - currentCar.fees) / 1.07);
      profit = sellingPrice - currentCar.invoice;
      saleAmount = agreedPrice;
    } else if (agreedType === 'payment') {
      // Payment offer - use the OTD price that was being financed
      // The customOTDPrice is what they're financing
      const sellingPrice = Math.round((customOTDPrice - currentCar.fees) / 1.07);
      profit = sellingPrice - currentCar.invoice;
      saleAmount = customOTDPrice;
    }

    setLastSaleAmount(saleAmount);
    setLastProfit(profit);
    setTotalProfit(prev => prev + profit);
    setTotalSales(prev => prev + saleAmount);
    
    if (settings.timer.enabled || settings.gameMode === 'volume') {
      setSessionStats(prev => ({
        gross: prev.gross + saleAmount,
        profit: prev.profit + profit,
        salesCount: prev.salesCount + 1
      }));
    }

    // Win condition for Volume Mode
    if (settings.gameMode === 'volume') {
      // Remove car from inventory
      const carIndex = inventoryRef.current.findIndex(c => c.id === currentCar.id);
      if (carIndex > -1) {
        inventoryRef.current.splice(carIndex, 1);
      }
      
      // Check if won
      if (inventoryRef.current.length === 0) {
        // setGameState('intro'); // Don't switch yet, show results
        setShowDealClosed(false);
        setShowTimeUp(true); 
        return; // Stop execution
      }
    }

    setShowDealClosed(false);
    setShowInput(false);
    setSelectedPerson(null);
    setConversation([]);
    setCurrentCar(null);
    setShowInventory(false);
    setShowNumbers(false);

    // Move player back to an open desk
    const desks = desksRef.current;
    if (desks.length > 0) {
      const desk = desks[Math.floor(Math.random() * desks.length)];
      playerRef.current.x = desk.x + desk.w / 2;
      playerRef.current.y = desk.y + desk.h / 2;
      playerRef.current.targetX = playerRef.current.x;
      playerRef.current.targetY = playerRef.current.y;
    }

    spawnNewCustomer();
  };

  const endLostDeal = () => {
    if (!selectedPerson) return;
    selectedPerson.active = false;
    
    // Remove customer from the showroom
    customersRef.current = customersRef.current.filter(c => c.id !== selectedPerson.id);
    
    setShowLostDeal(false);
    setShowInput(false);
    setSelectedPerson(null);
    setConversation([]);
    setCurrentCar(null);
    setShowInventory(false);
    setShowNumbers(false);

    // Move player back to an unoccupied desk
    const allDesks = desksRef.current;
    if (allDesks.length > 0) {
      const unoccupiedDesks = allDesks.filter(desk => {
        const deskCenterX = desk.x + desk.w / 2;
        const deskCenterY = desk.y + desk.h / 2;
        return !coworkersRef.current.some(coworker => 
          Math.abs(coworker.x - deskCenterX) < 60 && 
          Math.abs(coworker.y - deskCenterY) < 60
        );
      });
      
      const desk = unoccupiedDesks.length > 0 
        ? unoccupiedDesks[Math.floor(Math.random() * unoccupiedDesks.length)]
        : allDesks[Math.floor(Math.random() * allDesks.length)];
        
      playerRef.current.x = desk.x + desk.w / 2;
      playerRef.current.y = desk.y + desk.h / 2;
      playerRef.current.targetX = playerRef.current.x;
      playerRef.current.targetY = playerRef.current.y;
    }

    spawnNewCustomer();
  };

  const sendMessage = async (contentOrEvent?: any) => {
    // If specific content is passed (like from Greet button), use it.
    // Otherwise check inputMessage.
    const msgToSend = typeof contentOrEvent === 'string' ? contentOrEvent : inputMessage;
    
    if (!msgToSend.trim() || isTyping || !selectedPerson) return;

    const userMsg = msgToSend.trim();
    if (userMsg === "No other options?") {
      if (typeof contentOrEvent !== 'string') setInputMessage('');
      handleNoOtherOptions();
      return;
    }
    if (typeof contentOrEvent !== 'string') setInputMessage(''); // Only clear input if we used the input field
    setConversation(prev => [...prev, { sender: 'player', text: userMsg }]);
    setIsTyping(true);

    // Detect if this is a greeting
    const isGreeting = /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)/i.test(userMsg);
    const messageType = isGreeting && selectedPerson.conversationPhase === 'greeting' 
      ? 'greeting' 
      : 'general';

    let response: string;
    let interestChange: number;
    let newPhase;
    let isLost = false;
    let dealAccepted = false;

    // PRE-CHECK: Handle special phrases before calling AI/scripted responses
    // This ensures these phrases work in both AI and non-AI modes
    
    // "Take it or leave it" ultimatum
    if (isTakeItOrLeaveIt(userMsg)) {
      // Calculate chance they accept based on car match
      let takeItChance = 0.3; // Base chance
      if (currentCar) {
        // If car matches their category, boost chance
        const isValid = selectedPerson.desiredCategory === 'any' || 
          currentCar.category === selectedPerson.desiredCategory;
        if (isValid) takeItChance += 0.3;
        // If car matches some features, boost more
        const featureMatch = selectedPerson.desiredFeatures.filter(f => 
          currentCar.features.includes(f)).length / selectedPerson.desiredFeatures.length;
        takeItChance += featureMatch * 0.3;
      }
      // Personality modifiers
      if (selectedPerson.personality === 'friendly') takeItChance += 0.2;
      if (selectedPerson.personality === 'skeptical') takeItChance -= 0.3;
      
      if (Math.random() < takeItChance) {
        // They accept!
        response = "Alright, if that's truly all you have... I'll take it.";
        interestChange = 10;
        dealAccepted = true;
        newPhase = 'closed';
      } else {
        // They leave
        response = "No, I can't settle for that. I'm leaving.";
        interestChange = -100;
        isLost = true;
        newPhase = 'closed';
      }
    }
    // "I don't have that" inventory admission
    else if (isInventoryAdmission(userMsg)) {
      let stayChance = 0.5;
      if (selectedPerson.personality === 'friendly') stayChance += 0.2;
      if (selectedPerson.personality === 'skeptical') stayChance -= 0.2;
      
      if (Math.random() < stayChance) {
        response = "I understand. What else do you have that might work?";
        interestChange = 0;
        newPhase = 'needs_discovery';
        // Clear their specific model requirement
        selectedPerson.desiredModel = undefined;
        selectedPerson.desiredCategory = 'any';
      } else {
        response = "Well, if you don't have what I need, I'll try somewhere else. Goodbye.";
        interestChange = -100;
        isLost = true;
        newPhase = 'closed';
      }
    }
    // Normal response flow
    else if (settings.useAI && (settings.apiKey || settings.provider === 'local')) {
      const result = await getAIResponse(selectedPerson, userMsg, currentCar, settings);
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;
      isLost = !!result.isLost;
      dealAccepted = !!result.dealAccepted;
      selectedPerson.conversationHistory.push(
        { role: 'user', content: userMsg },
        { role: 'assistant', content: response }
      );
    } else {
      const result = generateResponse({
        customer: selectedPerson,
        currentCar,
        messageType,
      });
      response = result.response;
      interestChange = result.interestChange;
      newPhase = result.newPhase;
    }

    selectedPerson.interest = Math.max(0, Math.min(100, selectedPerson.interest + interestChange));
    if (newPhase) selectedPerson.conversationPhase = newPhase as typeof selectedPerson.conversationPhase;
    
    // ZERO INTEREST = AUTO FAIL: Customer leaves immediately if interest hits 0
    if (!isLost && !dealAccepted && selectedPerson.interest === 0) {
      isLost = true;
      const frustrationResponses = {
        friendly: "I'm sorry, but I've completely lost interest. Good luck!",
        serious: "I've had enough. I'm done here.",
        skeptical: "This is a complete waste of my time. I'm out.",
        enthusiastic: "I was really hopeful but... this isn't working at all. Goodbye.",
        analytical: "Interest level has reached zero. Interaction terminated."
      };
      response = frustrationResponses[selectedPerson.personality];
    }
    
    if (dealAccepted) {
      // Customer is committed to buying! But don't auto-close.
      // Set a flag so they auto-accept when user clicks "Close Deal" (if price is right)
      (selectedPerson as any).committedToBuy = true;
      selectedPerson.conversationPhase = 'closed';
      // Don't return early - continue to show the response
    }

    if (isLost) {
      selectedPerson.isLost = true;
      selectedPerson.conversationPhase = 'closed';
      setTimeout(() => setShowLostDeal(true), 1000);
    }

    // Force React re-render with updated customer state (revealedPreferences, interest, etc.)
    setSelectedPerson({ ...selectedPerson });

    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);
  };

  const normalizedSearch = inventorySearch.trim().toLowerCase();
  const matchesFeatureKeyword = (car: CarType) => {
    return Object.entries(FEATURE_SEARCH_KEYWORDS).some(([keyword, feature]) => 
      normalizedSearch.includes(keyword) && car.features.includes(feature)
    );
  };
  const filteredInventory = inventoryRef.current.filter(car => {
    if (!normalizedSearch) return true;
    const matchesModel = car.model.toLowerCase().includes(normalizedSearch);
    const matchesColor = car.color.toLowerCase().includes(normalizedSearch);
    const matchesTrim = car.trim.toLowerCase().includes(normalizedSearch);
    const categoryKeywords = CATEGORY_SEARCH_KEYWORDS[car.category] ?? [car.category];
    const matchesCategory = categoryKeywords.some(keyword => keyword.includes(normalizedSearch));
    const matchesFeature = matchesFeatureKeyword(car);
    return matchesModel || matchesColor || matchesTrim || matchesCategory || matchesFeature;
  });
  const allNotesRevealed = selectedPerson ? INVENTORY_NOTE_KEYS.every(key => selectedPerson.revealedPreferences[key]) : false;
  const perfectCars = allNotesRevealed ? findPerfectCars(selectedPerson) : [];
  const inventoryForList = filteredInventory.filter(car => !perfectCars.some(pc => pc.id === car.id));

  const hasPerfectMatch = perfectCars.length > 0;

  const buildPerfectCard = (car: CarType) => (
    <div
      key={`perfect-${car.id}`}
      className="perfect-car-card"
      style={{
        padding: '12px',
        borderRadius: '12px',
        border: '2px solid #f5c518',
        background: 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(253,230,138,0.1))',
        marginBottom: '12px',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: '#f7d785', fontWeight: 600 }}>Perfect Match</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <h4 style={{ margin: 0 }}>{car.model} {car.trim}</h4>
        <span style={{ fontSize: '0.8rem', color: '#f7d785' }}>{CATEGORY_UI_LABELS[car.category] ?? ''}</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: '#fff' }}>{car.color} • ${car.price.toLocaleString()}</p>
      <button
        className="inventory-item-action"
        style={{ marginTop: '8px', background: '#f5c518', borderColor: '#f5c518', color: '#2c3e50' }}
        onClick={() => {
          showCarToCustomer(car);
          setShowInventory(false);
        }}
      >
        Show Perfect Match
      </button>
    </div>
  );



  // Welcome screen
  if (gameState === 'intro') {
    return (
      <div className="intro-screen">
        <div className="intro-card">
          <h1>Showroom Blitz</h1>
          <p className="subtitle">Competitive Car Sales Simulation</p>

          <div className="game-description">
            <p>Work the showroom floor as a car salesperson competing against AI coworkers. Move quickly to intercept customers, learn their preferences, and close deals before your competition does.</p>
          </div>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <DollarSign size={20} />
              </div>
              <div className="feature-text">
                <strong>Real Deal Math</strong>
                <span>Calculate profit margins, payments, and OTD pricing</span>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <Users size={20} />
              </div>
              <div className="feature-text">
                <strong>AI Personalities</strong>
                <span>Each customer has unique budgets, preferences, and negotiation styles</span>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <Car size={20} />
              </div>
              <div className="feature-text">
                <strong>Dynamic Inventory</strong>
                <span>Browse 10-100 vehicles with real specs and pricing</span>
              </div>
            </div>
          </div>

          <button
            className="start-button"
            onClick={() => setGameState('setup')}
          >
            Get Started
          </button>

          <button
            className="tips-button"
            onClick={() => setShowTips(true)}
          >
            <HelpCircle size={18} /> How to Play
          </button>

          <p className="made-by-footer">Made by Curren</p>
        </div>

        {showTips && <TipsModal onClose={() => setShowTips(false)} />}
      </div>
    );
  }

  // Setup screen (game mode selection)
  if (gameState === 'setup') {
    return (
      <div className="intro-screen">
        <div className="intro-card setup-card">
          <h2 className="setup-title">Game Setup</h2>
          <p className="setup-subtitle">Choose your game mode and settings</p>

          <div className="settings-container">
            <div className="setting-section">
              <h3>Game Mode</h3>
              <div className="mode-buttons">
                <button
                  className={`mode-btn ${settings.gameMode === 'standard' ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({ ...prev, gameMode: 'standard' }))}
                >
                  Standard
                </button>
                <button
                  className={`mode-btn ${settings.gameMode === 'volume' ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({ ...prev, gameMode: 'volume', timer: { ...prev.timer, enabled: false } }))}
                >
                  Volume Run
                </button>
              </div>
              <div className="mode-description">
                <div className={`mode-info ${settings.gameMode === 'standard' ? 'visible' : 'hidden'}`}>
                  100 vehicles • Practice deals
                </div>
                <div className={`mode-info ${settings.gameMode === 'volume' ? 'visible' : 'hidden'}`}>
                  10 vehicles • Race the clock!
                </div>
              </div>
            </div>

            <div className="setting-section">
              <div className="ai-toggle-header">
                <h3>AI Mode</h3>
                <span className="ai-recommend">Highly recommended</span>
              </div>
              <div className="ai-toggle-buttons">
                <button
                  className={`timer-btn ${!settings.useAI ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({ ...prev, useAI: false }))}
                >
                  Off
                </button>
                <button
                  className={`timer-btn ${settings.useAI ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    useAI: true,
                    provider: 'local',
                    apiBaseUrl: '/api/ai',
                    modelName: currenServerModel,
                  }))}
                >
                  On
                </button>
              </div>
              <div className="mode-description">
                <div className={`mode-info ${settings.useAI ? 'visible' : 'hidden'}`}>
                  Uses Curren&apos;s server by default
                </div>
                <div className={`mode-info ${!settings.useAI ? 'visible' : 'hidden'}`}>
                  Smart scripted responses (offline)
                </div>
              </div>
            </div>

            {settings.gameMode === 'standard' && (
              <div className="setting-section">
                <h3>Timed Session</h3>
                <div className="timer-buttons">
                  <button
                    className={`timer-btn ${!settings.timer.enabled ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      timer: { ...prev.timer, enabled: false }
                    }))}
                  >
                    Off
                  </button>
                  <button
                    className={`timer-btn ${settings.timer.enabled ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      timer: { ...prev.timer, enabled: true }
                    }))}
                  >
                    On
                  </button>
                </div>
                <div className="timer-duration-container">
                  <div className={`timer-duration ${settings.timer.enabled ? 'visible' : 'hidden'}`}>
                    <div className="duration-buttons">
                      {[3, 5, 10].map(d => (
                        <button
                          key={d}
                          className={`duration-btn ${settings.timer.duration === d ? 'active' : ''}`}
                          onClick={() => setSettings(prev => ({
                            ...prev,
                            timer: { ...prev.timer, duration: d as 3 | 5 | 10 }
                          }))}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="start-button"
            onClick={beginGameStart}
          >
            Open Showroom
          </button>

          <button
            className="secondary-button"
            onClick={() => setGameState('intro')}
          >
            Back
          </button>

          <p className="made-by-footer">Made by Curren</p>
        </div>

        {showTips && <TipsModal onClose={() => setShowTips(false)} />}
      </div>
    );
  }

  // Loading screen (AI warmup)
  if (gameState === 'loading') {
    const progressPercent = Math.round(aiLoadProgress * 100);
    const isReady = aiWarmupStatus === 'ready';
    return (
      <div className="intro-screen">
        <div className="intro-card setup-card loading-card">
          <h2 className="setup-title">
            {isReady ? 'Ready!' : 'Starting AI Server'}
          </h2>
          <p className="setup-subtitle">
            {isReady ? 'Loading into the showroom...' : 'This can take a few minutes the first time'}
          </p>

          <div className="loading-progress">
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="loading-progress-text">
              {isReady ? 'Ready!' : `${progressPercent}%`}
            </div>
          </div>

          <div className="loading-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setSettings(prev => ({ ...prev, useAI: false }));
                setAiPendingStart(false);
                setGameState('playing');
                startShowroom();
              }}
            >
              Switch to Non-AI
            </button>
            <button
              className="start-button"
              onClick={() => retryWarmup('loading')}
            >
              Retry Warmup
            </button>
          </div>

          <p className="made-by-footer">Made by Curren</p>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="game-container">
      {settings.useAI && aiWarmupStatus === 'warming' && (
        <div className="ai-warmup-overlay">
          <div className="ai-warmup-card">
            <div className="ai-warmup-spinner" />
            <h2>Starting AI server</h2>
            <p>{aiWarmupMessage || 'Preparing AI responses. This can take a few minutes.'}</p>
            <div className="ai-warmup-actions">
              <button
                className="ai-warmup-btn secondary"
                onClick={() => setSettings(prev => ({ ...prev, useAI: false }))}
              >
                Switch to Non-AI
              </button>
              <button
                className="ai-warmup-btn primary"
                onClick={() => retryWarmup('overlay')}
              >
                Retry Now
              </button>
            </div>
            <div className="ai-warmup-hint">
              You can continue instantly with scripted customers if you don&apos;t want to wait.
            </div>
          </div>
        </div>
      )}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Stats overlay */}
        {lastSaleAmount > 0 && (
          <div className="stats-overlay">
            <div className={`profit ${lastProfit < 0 ? 'loss' : ''}`}>
              {lastProfit < 0 ? '-' : ''}${Math.abs(lastProfit).toLocaleString()} Profit
            </div>
            <div className="total">Total Sales: ${totalSales.toLocaleString()}</div>
            <div className={`profit ${totalProfit < 0 ? 'loss' : ''}`}>
              Total Profit: {totalProfit < 0 ? '-' : ''}${Math.abs(totalProfit).toLocaleString()}
            </div>
          </div>
        )}

        {/* Timer display */}
        {(settings.timer.enabled || settings.gameMode === 'volume') && gameState === 'playing' && (
          <div className={`timer-overlay ${timeLeft < 30 && settings.gameMode !== 'volume' ? 'urgent' : ''}`}>
             {settings.gameMode === 'volume' 
               ? `⏱️ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
               : `⏱️ ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
             }
             {settings.gameMode === 'volume' && (
                <div style={{ fontSize: '1rem', color: '#c0392b', marginTop: '4px', fontWeight: 'bold' }}>
                  {inventoryRef.current.length}/10 Cars Left
                </div>
             )}
          </div>
        )}

        {/* Settings button */}
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <Settings size={20} />
        </button>

        {/* Deal closed modal */}
        {showDealClosed && currentCar && (
          <div className="deal-modal">
            <h2>🎉 SOLD!</h2>
            <p className="price">
              ${agreedPrice.toLocaleString()} {agreedType === 'otd' ? 'OTD' : agreedType === 'payment' ? '/mo' : 'Selling Price'}
            </p>
            <p className={`profit-display ${(
              agreedPrice - (agreedType === 'otd' ? currentCar.fees + currentCar.tax : 0) - currentCar.invoice
            ) < 0 ? 'loss' : ''}`}>
              Profit: {(
                agreedType === 'otd' 
                  ? Math.round((agreedPrice - currentCar.fees) / 1.07) - currentCar.invoice
                  : agreedType === 'payment'
                    ? Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice
                    : agreedPrice - currentCar.invoice
              ).toLocaleString()}
            </p>
            <button onClick={signDeal}>Sign Deal</button>
          </div>
        )}

        {/* Lost deal modal */}
        {showLostDeal && selectedPerson && (
          <div className="deal-modal lost">
            <h2>❌ DEAL LOST</h2>
            <p className="price">{selectedPerson.name} has left the showroom.</p>
            <p className="profit-display">They weren't happy with the negotiation.</p>
            <button onClick={endLostDeal}>Close</button>
          </div>
        )}

        {/* Time's Up / Game Over modal */}
        {showTimeUp && (
          <div className="deal-modal results">
            <h2>{settings.gameMode === 'volume' ? '🎉 CHALLENGE COMPLETE!' : "⏱️ TIME'S UP!"}</h2>
            {settings.gameMode === 'volume' && (
               <div className="final-time" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0', color: '#3498db' }}>
                 Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </div>
            )}
            <div className="results-grid">
              <div className="result-item">
                <label>Deals Closed</label>
                <span>{sessionStats.salesCount}</span>
              </div>
              <div className="result-item">
                <label>Total Gross</label>
                <span>${sessionStats.gross.toLocaleString()}</span>
              </div>
              <div className="result-item highlight">
                <label>Total Profit</label>
                <span>${sessionStats.profit.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => { setShowTimeUp(false); setGameState('intro'); }}>Back to Menu</button>
          </div>
        )}

        {/* Desktop: Panels Container for side-by-side layout */}
        {/* Mobile: Panels render separately */}
        {showInput && selectedPerson && (
          <>
            {/* Desktop container */}
            <div className="panels-container">
              {/* Desktop: Notes Panel (Left side) */}
              <div className="notes-panel in-container">
                <CustomerNotes customer={selectedPerson} />
              </div>

              <div className="chat-panel in-container">
                <ChatInterface 
                  selectedPerson={selectedPerson}
                  conversation={conversation}
                  isTyping={isTyping}
                  messagesEndRef={messagesEndRef}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  sendMessage={sendMessage}
                  inputRef={inputRef}
                  onClose={() => setShowInput(false)}
                  showInventory={showInventory}
                  setShowInventory={setShowInventory}
                  showNumbers={showNumbers}
                  setShowNumbers={setShowNumbers}
                  currentCar={currentCar}
                  attemptCloseDeal={attemptCloseDeal}
                  isMobile={false}
                  onDiscoveryAction={handleDiscoveryAction}
                  showNotes={false}
                  useAI={settings.useAI}
                  hasPerfectMatch={hasPerfectMatch}
                />
              </div>

              {/* Desktop: Inventory panel next to chat */}
              {showInventory && (
                <div className="side-panel in-container">
                  <div className="panel-header">
                    <h3>Inventory ({filteredInventory.length} cars)</h3>
                    <button className="panel-close" onClick={() => setShowInventory(false)}>×</button>
                  </div>
                  <div className="panel-search">
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Search model, color, trim..."
                    />
                  </div>
                  <div className="panel-content">
                    {perfectCars.map(buildPerfectCard)}
                    {inventoryForList.slice(0, 20).map(car => {
                      const categoryLabel = CATEGORY_UI_LABELS[car.category] ?? CATEGORY_UI_LABELS.any;
                      return (
                        <div key={car.id} className="inventory-item">
                          <div className="inventory-item-info">
                            <h4>{car.model} {car.trim}</h4>
                            <p>{car.color} • {categoryLabel} • ${car.price.toLocaleString()}</p>
                          </div>
                          <button
                            className="inventory-item-action"
                            onClick={() => {
                              showCarToCustomer(car);
                              setShowInventory(false);
                            }}
                          >
                            Show
                          </button>
                        </div>
                      );
                    })}
                    {inventoryForList.length > 20 && (
                      <div className="more-items">+{inventoryForList.length - 20} more...</div>
                    )}
                  </div>
                </div>
              )}

              {/* Desktop: Numbers panel next to chat */}
              {/* Desktop: Numbers panel next to chat */}
              <NumbersPanel
                isOpen={showNumbers && !!currentCar}
                onClose={() => setShowNumbers(false)}
                currentCar={currentCar}
                customSellingPrice={customSellingPrice}
                setCustomSellingPrice={setCustomSellingPrice}
                customOTDPrice={customOTDPrice}
                setCustomOTDPrice={setCustomOTDPrice}
                makeOffer={makeOffer}
                showDealClosed={showDealClosed}
                signDeal={signDeal}
                downPayment={downPayment}
                setDownPayment={setDownPayment}
                paymentAPR={paymentAPR}
                setPaymentAPR={setPaymentAPR}
                paymentTerm={paymentTerm}
                setPaymentTerm={setPaymentTerm}
                customPayment={customPayment}
                setCustomPayment={setCustomPayment}
                isMobile={false}
                customer={selectedPerson}
                onCustomerUpdate={(updatedCustomer) => {
                   const index = customersRef.current.findIndex(c => c.id === updatedCustomer.id);
                   if (index !== -1) customersRef.current[index] = updatedCustomer;
                   if (selectedPerson?.id === updatedCustomer.id) setSelectedPerson(updatedCustomer);
                }}
              />
            </div>

            {/* Mobile: Chat panel (shown when not in desktop container) */}
            {isMobile && (
              <div className="chat-panel" style={{ display: 'flex', position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', maxHeight: '90vh', borderRadius: '20px 20px 0 0', zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
                <ChatInterface 
                  selectedPerson={selectedPerson}
                  conversation={conversation}
                  isTyping={isTyping}
                  messagesEndRef={messagesEndRef}
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  sendMessage={sendMessage}
                  inputRef={inputRef}
                  onClose={() => setShowInput(false)}
                  showInventory={showInventory}
                  setShowInventory={setShowInventory}
                  showNumbers={showNumbers}
                  setShowNumbers={setShowNumbers}
                  currentCar={currentCar}
                  attemptCloseDeal={attemptCloseDeal}
                  isMobile={true}
                  onDiscoveryAction={handleDiscoveryAction}
                  useAI={settings.useAI}
                  hasPerfectMatch={hasPerfectMatch}
                />
              </div>
            )}
          </>
        )}

        {/* Mobile-only: Inventory panel as modal */}
        {showInventory && isMobile && (
          <>
            <div className="panel-backdrop" onClick={() => setShowInventory(false)} />
            <div className="side-panel">
              <div className="panel-header">
                <h3>Inventory ({filteredInventory.length} cars)</h3>
                <button className="panel-close" onClick={() => setShowInventory(false)}>×</button>
              </div>
              <div className="panel-search">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search model, color, trim..."
                />
              </div>
              <div className="panel-content">
                {perfectCars.map(buildPerfectCard)}
                {inventoryForList.slice(0, 20).map(car => {
                  const categoryLabel = CATEGORY_UI_LABELS[car.category] ?? CATEGORY_UI_LABELS.any;
                  return (
                    <div key={car.id} className="inventory-item">
                      <div className="inventory-item-info">
                        <h4>{car.model} {car.trim}</h4>
                        <p>{car.color} • {categoryLabel} • ${car.price.toLocaleString()}</p>
                      </div>
                      <button
                        className="inventory-item-action"
                        onClick={() => {
                          showCarToCustomer(car);
                          setShowInventory(false);
                        }}
                      >
                        Show
                      </button>
                    </div>
                  );
                })}
                {inventoryForList.length > 20 && (
                  <div className="more-items">+{inventoryForList.length - 20} more...</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile-only: Numbers panel as modal (when chat is closed) */}
        {/* Mobile-only: Numbers panel as modal (when chat is closed) */}
        <NumbersPanel
            isOpen={showNumbers && !!currentCar && isMobile}
            onClose={() => setShowNumbers(false)}
            currentCar={currentCar}
            customSellingPrice={customSellingPrice}
            setCustomSellingPrice={setCustomSellingPrice}
            customOTDPrice={customOTDPrice}
            setCustomOTDPrice={setCustomOTDPrice}
            makeOffer={makeOffer}
            showDealClosed={showDealClosed}
            signDeal={signDeal}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            paymentAPR={paymentAPR}
            setPaymentAPR={setPaymentAPR}
            paymentTerm={paymentTerm}
            setPaymentTerm={setPaymentTerm}
            customPayment={customPayment}
            setCustomPayment={setCustomPayment}
            isMobile={true}
            customer={selectedPerson}
            onCustomerUpdate={(updatedCustomer) => {
               const index = customersRef.current.findIndex(c => c.id === updatedCustomer.id);
               if (index !== -1) customersRef.current[index] = updatedCustomer;
               if (selectedPerson?.id === updatedCustomer.id) setSelectedPerson(updatedCustomer);
            }}
        />

        {/* Settings panel */}
        {showSettings && (
          <>
            <div className="panel-backdrop" onClick={() => setShowSettings(false)} />
            <div className="settings-panel">
              <h3>⚙️ Settings</h3>
              <div className="settings-option">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.useAI}
                    onChange={(e) => setSettings(prev => ({ ...prev, useAI: e.target.checked }))}
                  />
                  Enable AI Conversations
                </label>
                
                {settings.useAI && (
                  <div className="ai-settings">
                    <div className="ai-field">
                      <label>AI Provider</label>
                      <select
                        value={settings.provider === 'local' && settings.apiBaseUrl === '/api/ai' ? 'proxy' : settings.provider === 'local' ? 'local' : settings.provider}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'proxy') {
                            setSettings(prev => ({ ...prev, provider: 'local', apiBaseUrl: '/api/ai' }));
                          } else if (val === 'local') {
                            setSettings(prev => ({ ...prev, provider: 'local', apiBaseUrl: 'http://localhost:1234/v1' }));
                          } else {
                            setSettings(prev => ({ ...prev, provider: val as any }));
                          }
                        }}
                      >
                        <option value="proxy">Curren&apos;s Server</option>
                        <option value="local">Local Model</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                      </select>
                    </div>

                    {settings.provider === 'anthropic' ? (
                      <div className="ai-field">
                        <label>Anthropic API Key</label>
                        <input
                          type="password"
                          placeholder="sk-ant-..."
                          value={settings.apiKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        />
                      </div>
                    ) : settings.apiBaseUrl === '/api/ai' ? (
                      <>
                        <div className="ai-field">
                          <label>AI Server</label>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            Using Curren&apos;s private server proxy.
                          </div>
                        </div>
                        <div className="ai-field">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                             <label style={{ margin: 0 }}>Connection Test</label>
                             {testStatus !== 'idle' && (
                               <span style={{
                                 fontSize: '0.75rem',
                                 color: testStatus === 'success' ? '#2ecc71' : testStatus === 'error' ? '#e74c3c' : '#f39c12'
                               }}>
                                 {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Connected!' : 'Failed'}
                               </span>
                             )}
                           </div>
                           <button
                             onClick={testConnection}
                             disabled={testStatus === 'testing'}
                             style={{
                               width: '100%',
                               padding: '8px',
                               background: testStatus === 'success' ? '#2ecc71' : '#3498db',
                               color: 'white',
                               border: 'none',
                               borderRadius: '6px',
                               cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
                               opacity: testStatus === 'testing' ? 0.7 : 1,
                               marginBottom: '8px'
                             }}
                           >
                             {testStatus === 'testing' ? 'Connecting...' : 'Test Connection'}
                           </button>
                           {testMessage && (
                             <div style={{
                               fontSize: '0.75rem',
                               padding: '8px',
                               borderRadius: '4px',
                               background: testStatus === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                               color: testStatus === 'success' ? '#27ae60' : '#c0392b',
                               border: `1px solid ${testStatus === 'success' ? '#2ecc71' : '#e74c3c'}`
                             }}>
                               {testMessage}
                             </div>
                           )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ai-field">
                          <label>Local Server URL</label>
                          <input
                            type="text"
                            placeholder="http://localhost:1234/v1"
                            value={settings.apiBaseUrl}
                            onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                          />
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                            OpenAI-compatible endpoint (LM Studio, Ollama, etc.)
                          </div>
                        </div>
                        <div className="ai-field">
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                             <label style={{ margin: 0 }}>Connection Test</label>
                             {testStatus !== 'idle' && (
                               <span style={{ 
                                 fontSize: '0.75rem', 
                                 color: testStatus === 'success' ? '#2ecc71' : testStatus === 'error' ? '#e74c3c' : '#f39c12' 
                               }}>
                                 {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? 'Connected!' : 'Failed'}
                               </span>
                             )}
                           </div>
                           <button
                             onClick={testConnection}
                             disabled={testStatus === 'testing' || !settings.apiBaseUrl}
                             style={{
                               width: '100%',
                               padding: '8px',
                               background: testStatus === 'success' ? '#2ecc71' : '#3498db',
                               color: 'white',
                               border: 'none',
                               borderRadius: '6px',
                               cursor: testStatus === 'testing' || !settings.apiBaseUrl ? 'not-allowed' : 'pointer',
                               opacity: testStatus === 'testing' || !settings.apiBaseUrl ? 0.7 : 1,
                               marginBottom: '8px'
                             }}
                           >
                             {testStatus === 'testing' ? 'Connecting...' : 'Test Connection'}
                           </button>
                           {testMessage && (
                             <div style={{ 
                               fontSize: '0.75rem', 
                               padding: '8px', 
                               borderRadius: '4px',
                               background: testStatus === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                               color: testStatus === 'success' ? '#27ae60' : '#c0392b',
                               border: `1px solid ${testStatus === 'success' ? '#2ecc71' : '#e74c3c'}`
                             }}>
                               {testMessage}
                             </div>
                           )}
                        </div>

                        <div className="ai-field">
                          <label>Model Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="local-model"
                            value={settings.modelName}
                            onChange={(e) => setSettings(prev => ({ ...prev, modelName: e.target.value }))}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {settings.useAI
                  ? settings.provider === 'anthropic'
                    ? 'Using Claude for dynamic conversations'
                    : settings.apiBaseUrl === '/api/ai'
                      ? 'Using Curren\'s private AI server'
                      : 'Using local model on your hardware'
                  : 'Using smart scripted responses (works offline)'}
              </p>
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button 
                  className="close-btn" 
                  style={{ background: 'var(--danger)', marginTop: '0', fontSize: '0.9rem', opacity: 0.9 }}
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all sales stats?')) {
                      setTotalSales(0);
                      setTotalProfit(0);
                      setLastSaleAmount(0);
                      setLastProfit(0);
                    }
                  }}
                >
                  Reset All Stats
                </button>
              </div>

              <button className="close-btn" onClick={() => setShowSettings(false)}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
