import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
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
  SessionStats
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
import { generateResponse, getAIResponse, resolveSpecialPhrase } from './utils/responseGenerator';
import { NumbersPanel } from './components/NumbersPanel';
import { CustomerNotes } from './components/CustomerNotes';
import { ChatInterface } from './components/ChatInterface';
import { useGameLoop } from './hooks/useGameLoop';
import { sessionReducer, initialSessionState } from './reducers/sessionReducer';

type UiPanel = 'none' | 'dealClosed' | 'lostDeal' | 'inventory' | 'numbers' | 'settings' | 'tips';

const CANVAS_WIDTH = 800;
const MOBILE_CANVAS_WIDTH = 400;

function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Customer | null>(null);
  const [uiPanel, setUiPanel] = useState<UiPanel>('none');
  const [currentCar, setCurrentCar] = useState<CarType | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [session, dispatchSession] = useReducer(sessionReducer, initialSessionState);
  const [customSellingPrice, setCustomSellingPrice] = useState(0);
  const [customOTDPrice, setCustomOTDPrice] = useState(0);
  const [customPayment, setCustomPayment] = useState(0);
  const [paymentTerm, setPaymentTerm] = useState(72);
  const [paymentAPR, setPaymentAPR] = useState(6.9);
  const [downPayment, setDownPayment] = useState(0);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('showroom_settings');
    const defaults = {
      useAI: false,
      apiKey: '',
      provider: 'anthropic' as const,
      apiBaseUrl: '/api/lm-studio',
      modelName: 'claude-3-sonnet-20240229',
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
      return {
        ...defaults,
        ...parsed,
        timer: {
          ...defaults.timer,
          ...(parsed.timer || {}),
        },
      };
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return defaults;
    }
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    gross: 0,
    profit: 0,
    salesCount: 0,
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const testConnection = async () => {
    if (!settings.apiBaseUrl) return;
    
    setTestStatus('testing');
    setTestMessage('');
    
    try {
      // LM Studio / OpenAI compatible check
      // We try to fetch the /models endpoint which is standard
      let baseUrl = settings.apiBaseUrl;
      
      // Clean up URL if it has /chat/completions at the end
      if (baseUrl.endsWith('/chat/completions')) {
        baseUrl = baseUrl.replace('/chat/completions', '');
      }
      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/+$/, '');
      
      const url = `${baseUrl}/models`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
           // Some CORS setups need minimal headers
        }
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    speed: 3,
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

  // Get canvas scale factor for responsive sizing
  const getCanvasScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const targetWidth = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
    return canvas.offsetWidth / targetWidth;
  }, [isMobile]);

  const spawnNewCustomer = useCallback(() => {
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

  // Timer logic: one interval per "playing" session. Do not depend on timeLeft so the effect does not re-run every second.
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (gameState !== 'playing' || showTimeUp || (!settings.timer.enabled && settings.gameMode !== 'volume')) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (settings.gameMode === 'volume') {
          return prev + 1;
        }
        if (prev <= 1) {
          setShowTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState, settings.timer.enabled, settings.gameMode, showTimeUp]);

  useGameLoop({
    canvasRef,
    isMobile,
    gameState,
    customersRef,
    coworkersRef,
    desksRef,
    playerRef,
    showInput,
    selectedPerson,
    spawnNewCustomer,
  });

  // Canvas click/touch handlers (game loop lives in useGameLoop)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

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
            setUiPanel('none');
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

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleClick);
    };
  }, [gameState, getCanvasScale, isMobile, showInput]);

  const handleDiscoveryAction = async (type: 'budget' | 'type' | 'features' | 'model') => {
    if (!selectedPerson) return;
    
    // Find real customer object to ensure stats sync with game loop
    const realCustomer = customersRef.current.find(c => c.id === selectedPerson.id);
    if (!realCustomer) return;

    let question = "";
    let messageType: any = "";

    switch (type) {
      case 'budget':
        question = "What is your budget for this purchase?";
        messageType = 'ask_budget';
        break;
      case 'type':
        question = "What type of vehicle are you looking for?";
        messageType = 'ask_type';
        break;
      case 'features':
        question = "Are there any specific features you need?";
        messageType = 'ask_features';
        break;
      case 'model':
        question = "Do you have a specific model in mind?";
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
      setTimeout(() => setUiPanel('lostDeal'), 1000);
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
      setTimeout(() => setUiPanel('lostDeal'), 1000);
      return; // Exit early
    }
    
    // Force state update by creating a shallow clone of the updated real customer
    setSelectedPerson({ ...realCustomer });
    
    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);
  };

  const showCarToCustomer = async (car: CarType) => {
    if (!selectedPerson) return;
    
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
      setTimeout(() => setUiPanel('lostDeal'), 1000);
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
      dispatchSession({ type: 'SET_AGREED_OFFER', price, offerType: type });
      // Don't auto-close! Wait for player to click Close Deal button
      // But we can give a hint in the response or trust the "dealAccepted" flag for internal logic if needed
    } else if (isLost) {
      selectedPerson.isLost = true;
      selectedPerson.conversationPhase = 'closed';
      setTimeout(() => setUiPanel('lostDeal'), 1000);
    } else {
      selectedPerson.conversationPhase = 'negotiation';
    }

    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);

    // FIX: On mobile, close the Numbers/Inventory panels so the user can see the chat/response
    if (isMobile) {
      setUiPanel('none');
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

  const attemptCloseDeal = () => {
    if (!selectedPerson || !currentCar) return;

    // Increment close attempts
    selectedPerson.closeAttempts = (selectedPerson.closeAttempts || 0) + 1;

    // Check if customer already committed via "take it or leave it"
    const isCommitted = selectedPerson.committedToBuy === true;

    // Price to use for "likes the price" check: agreed price, or last offer from conversation if none set
    const lastOfferMsg = [...conversation].reverse().find(m => (m as ConversationMessage).offerDetails);
    const lastOffer = lastOfferMsg && (lastOfferMsg as ConversationMessage).offerDetails;
    const lastOfferMatchesBuyerType = lastOffer && (
      (selectedPerson.buyerType === 'payment' && lastOffer.type === 'payment') ||
      (selectedPerson.buyerType === 'cash' && lastOffer.type !== 'payment')
    );
    const priceToCheck = session.agreedPrice > 0
      ? session.agreedPrice
      : (lastOfferMatchesBuyerType && lastOffer && typeof lastOffer.price === 'number')
        ? lastOffer.price  // same units as effectiveBudget: monthly for payment, dollars for otd/selling
        : 0;

    // If the customer's LAST message clearly said they want to buy (deal, I'll take it, etc.), close the deal
    const reversedConv = [...conversation].reverse();
    const lastCustomerMsg = reversedConv.find(m => m.sender === 'customer');
    const customerJustSaidYes = lastCustomerMsg && (() => {
      const t = lastCustomerMsg.text.toLowerCase();
      const buyWords = /\b(deal|sold|i'll take it|i will take it|lets do it|let's do it|yes|accept|ready to sign|where do i sign|we have a deal)\b/i;
      const negated = /\b(not|n't|won't|can't)\s+(ready|buy|deal|sign|take|accept)\b/i;
      return buyWords.test(t) && !negated.test(t);
    })();

    if (customerJustSaidYes || isCommitted) {
      // They already said they want to buy — close the deal. If we have price and commitment, finalize immediately.
      if (isCommitted && (session.agreedPrice > 0 || (lastOffer && typeof lastOffer.price === 'number'))) {
        if (session.agreedPrice === 0 && lastOffer) {
          dispatchSession({ type: 'SET_AGREED_OFFER', price: lastOffer.price, offerType: (lastOffer.type as OfferType) ?? 'otd' });
        }
        setUiPanel('dealClosed');
        return;
      }
      // Otherwise do a short confirmation exchange
      const closingQuestions = [
        "Are you ready to sign the paperwork and drive this home today?",
        "So, do we have a deal?",
        "Does this all look good enough to put your name on it today?"
      ];
      const playerMessage = closingQuestions[Math.floor(Math.random() * closingQuestions.length)];
      setConversation(prev => [...prev, { sender: 'player', text: playerMessage }]);
      setIsTyping(true);
      setTimeout(() => {
        const responses: Record<string, string> = {
          friendly: "You know what? Let's do it! I'm excited!",
          serious: "Acceptable. Let's proceed with the paperwork.",
          skeptical: "Fine, you earned it. The deal is fair enough.",
          enthusiastic: "YES! Let's do it! I'm SO ready to drive this home!",
          analytical: "The numbers align with my targeted metrics. I accept."
        };
        setConversation(prev => [...prev, { sender: 'customer', text: responses[selectedPerson.personality], sentiment: 'happy' }]);
        selectedPerson.conversationPhase = 'closed';
        if (session.agreedPrice === 0 && lastOffer) {
          dispatchSession({ type: 'SET_AGREED_OFFER', price: lastOffer.price, offerType: (lastOffer.type as OfferType) ?? 'otd' });
        }
        setUiPanel('dealClosed');
        setIsTyping(false);
      }, 800);
      return;
    }

    // FIRST: Check if customer likes the car AND the price (use last offer when agreedPrice not set)
    const likesTheCar = customerLikesTheCar(selectedPerson, currentCar);
    const likesThePrice = priceToCheck > 0 && customerLikesThePrice(selectedPerson, priceToCheck);

    // ATTRITION / PRESSURE SALE LOGIC
    // If we've tried 3+ times and price is within 20% of base budget, give a small extra chance
    const baseBudget = selectedPerson.buyerType === 'cash' ? selectedPerson.budget : selectedPerson.maxPayment;
    const isWithin20Percent = priceToCheck > 0 && (priceToCheck <= baseBudget * 1.2);
    const isAttritionSuccess = selectedPerson.closeAttempts >= 3 && isWithin20Percent && Math.random() < 0.15;

    // If either condition fails, provide specific feedback
    if (!isAttritionSuccess && (!likesTheCar || !likesThePrice)) {
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
          setTimeout(() => setUiPanel('lostDeal'), 1000);
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
    // Analyze context BEFORE adding player message (reuse reversedConv/lastCustomerMsg from above)
    let contextBonus = 0;

    if (lastCustomerMsg) {
      const text = lastCustomerMsg.text.toLowerCase();
      // If they literally just said they want to buy, guarantee success
      // Check for buy keywords AND ensure they aren't negated closely (e.g. "not ready", "won't buy")
      const hasBuyWord = /\b(buy|purchase|deal|take it|sign|ready|prepared|accept)\b/.test(text);
      const hasNegation = /\b(not|n't|won't|can't)\s+(ready|buy|purchase|deal|sign|take|accept)\b/.test(text);

      if (hasBuyWord && !hasNegation) {
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
      const isSuccess = (roll < successChance) || isAttritionSuccess;
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
        if (session.agreedPrice === 0) {
           dispatchSession({ type: 'SET_AGREED_OFFER', price: customSellingPrice, offerType: 'selling' });
        }
        setUiPanel('dealClosed');

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
          setTimeout(() => setUiPanel('lostDeal'), 1000);
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
    
    if (session.agreedType === 'selling') {
      // Selling price offer - profit is selling price minus invoice
      profit = session.agreedPrice - currentCar.invoice;
      saleAmount = session.agreedPrice + currentCar.fees + Math.round(session.agreedPrice * 0.07);
    } else if (session.agreedType === 'otd') {
      // OTD offer - need to back out tax and fees to get selling price
      // OTD = selling + tax(7%) + fees
      // OTD = selling + (selling * 0.07) + fees
      // OTD - fees = selling * 1.07
      // selling = (OTD - fees) / 1.07
      const sellingPrice = Math.round((session.agreedPrice - currentCar.fees) / 1.07);
      profit = sellingPrice - currentCar.invoice;
      saleAmount = session.agreedPrice;
    } else if (session.agreedType === 'payment') {
      // Payment offer - use the OTD price that was being financed
      // The customOTDPrice is what they're financing
      const sellingPrice = Math.round((customOTDPrice - currentCar.fees) / 1.07);
      profit = sellingPrice - currentCar.invoice;
      saleAmount = customOTDPrice;
    }

    dispatchSession({ type: 'DEAL_CLOSED', saleAmount, profit });
    
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
        setUiPanel('none');
        setShowTimeUp(true); 
        return; // Stop execution
      }
    }

    setUiPanel('none');
    setShowInput(false);
    setSelectedPerson(null);
    setConversation([]);
    setCurrentCar(null);

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
    
    setUiPanel('none');
    setShowInput(false);
    setSelectedPerson(null);
    setConversation([]);
    setCurrentCar(null);

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
    let newPhase: typeof selectedPerson.conversationPhase | undefined;
    let isLost = false;
    let dealAccepted = false;

    // Single source of truth for "take it or leave it" and "inventory admission"
    const specialResult = resolveSpecialPhrase(userMsg, selectedPerson, currentCar);
    if (specialResult) {
      response = specialResult.response;
      interestChange = specialResult.interestChange;
      newPhase = specialResult.newPhase;
      isLost = !!specialResult.isLost;
      dealAccepted = !!specialResult.dealAccepted;
    } else if (settings.useAI && (settings.apiKey || settings.provider === 'local')) {
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
      isLost = !!result.isLost;
      dealAccepted = !!result.dealAccepted;
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
      // Customer is committed to buying! Set agreed price from last offer in conversation so "Close Deal" succeeds.
      const lastOfferMsg = [...conversation].reverse().find(m => (m as ConversationMessage).offerDetails);
      const details = lastOfferMsg && (lastOfferMsg as ConversationMessage).offerDetails;
      if (details && typeof details.price === 'number') {
        dispatchSession({ type: 'SET_AGREED_OFFER', price: details.price, offerType: (details.type as OfferType) ?? 'otd' });
      }
      selectedPerson.committedToBuy = true;
      selectedPerson.conversationPhase = 'closed';
    }
    
    if (isLost) {
      selectedPerson.isLost = true;
      selectedPerson.conversationPhase = 'closed';
      setTimeout(() => setUiPanel('lostDeal'), 1000);
    }
    setConversation(prev => [...prev, { sender: 'customer', text: response }]);
    setIsTyping(false);
  };

  const filteredInventory = inventoryRef.current.filter(car =>
    car.model.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    car.color.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    car.trim.toLowerCase().includes(inventorySearch.toLowerCase())
  );



  // Intro screen
  if (gameState === 'intro') {
    return (
      <div className="intro-screen">
        <div className="intro-card">
          <h1>Showroom Blitz</h1>
          <p className="subtitle">Master the art of car sales</p>
          
          <div className="features">
            <div className="feature">
              <div className="feature-icon green">
                <DollarSign size={18} />
              </div>
              <span>Negotiate deals with dynamic customers</span>
            </div>
            <div className="feature">
              <div className="feature-icon blue">
                <Users size={18} />
              </div>
              <span>Each customer has unique personality & budget</span>
            </div>
            <div className="feature">
              <div className="feature-icon orange">
                <Car size={18} />
              </div>
              <span>100 vehicles in your inventory</span>
            </div>
          </div>

          <div className="timer-config">
            <h3>Timed Session Settings</h3>
            <div className="toggle-group">
              <button 
                className={`toggle-btn ${settings.timer.enabled ? 'active' : ''}`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  timer: { ...prev.timer, enabled: !prev.timer.enabled }
                }))}
              >
                Timer: {settings.timer.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div className="toggle-group" style={{ marginTop: '15px' }}>
              <h3>Game Mode</h3>
               <div className="mode-toggle" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className={`toggle-btn ${settings.gameMode === 'standard' ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({ ...prev, gameMode: 'standard' }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #444', background: settings.gameMode === 'standard' ? 'var(--primary, #3498db)' : 'transparent', color: settings.gameMode === 'standard' ? 'white' : '#666', cursor: 'pointer' }}
                >
                  Standard
                </button>
                <button
                  className={`toggle-btn ${settings.gameMode === 'volume' ? 'active' : ''}`}
                  onClick={() => setSettings(prev => ({ ...prev, gameMode: 'volume', timer: { ...prev.timer, enabled: false } }))} 
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #444', background: settings.gameMode === 'volume' ? 'var(--primary, #3498db)' : 'transparent', color: settings.gameMode === 'volume' ? 'white' : '#666', cursor: 'pointer' }}
                >
                  Volume Run
                </button>
               </div>
               {settings.gameMode === 'volume' && (
                 <p style={{ fontSize: '0.9rem', color: '#e74c3c', marginTop: '8px', fontWeight: 'bold' }}>
                   ⚠️ 10 Cars Total • Race against the clock!
                 </p>
               )}
            </div>

            {settings.timer.enabled && settings.gameMode === 'standard' && (
              <div className="duration-group">
                {[3, 5, 10].map(d => (
                  <button
                    key={d}
                    className={`duration-btn ${settings.timer.duration === d ? 'active' : ''}`}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      timer: { ...prev.timer, duration: d as 3 | 5 | 10 }
                    }))}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="start-button"
            onClick={() => {
              setGameState('playing');
              setUiPanel('none');
              dispatchSession({ type: 'RESET_SESSION' });
              customersRef.current.forEach(c => c.active = true);
              
              if (settings.gameMode === 'volume') {
                inventoryRef.current = generateInventory(10);
                setTimeLeft(0); // Count up starts at 0
                setSessionStats({ gross: 0, profit: 0, salesCount: 0 });
              } else if (settings.timer.enabled) {
                // Determine inventory size? Standard is 100 usually, re-generate or keep?
                // Existing code generated 10 on load? No, it did 100 in useRef(generateInventory(100)).
                // We should probably reset inventory to 100 if switching back to standard.
                inventoryRef.current = generateInventory(100);
                setTimeLeft(settings.timer.duration * 60);
                setSessionStats({ gross: 0, profit: 0, salesCount: 0 });
              } else {
                 // Standard no timer, ensure full inventory
                 inventoryRef.current = generateInventory(100);
              }
            }}
          >
            Open Showroom
          </button>

          <button
            className="secondary-button"
            style={{ 
              marginTop: '15px', 
              background: 'transparent', 
              color: '#666', 
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '0.9rem'
            }}
            onClick={() => setUiPanel('tips')}
          >
            <HelpCircle size={16} /> Tip Sheet & Rules
          </button>
        </div>
        
        {uiPanel === 'tips' && <TipsModal onClose={() => setUiPanel('none')} />}
      </div>
    );
  }

  // Game screen
  return (
    <div className="game-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Stats overlay */}
        {session.lastSaleAmount > 0 && (
          <div className="stats-overlay">
            <div className={`profit ${session.lastProfit < 0 ? 'loss' : ''}`}>
              {session.lastProfit < 0 ? '-' : ''}${Math.abs(session.lastProfit).toLocaleString()} Profit
            </div>
            <div className="total">Total Sales: ${session.totalSales.toLocaleString()}</div>
            <div className={`profit ${session.totalProfit < 0 ? 'loss' : ''}`}>
              Total Profit: {session.totalProfit < 0 ? '-' : ''}${Math.abs(session.totalProfit).toLocaleString()}
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
        <button className="settings-btn" onClick={() => setUiPanel('settings')}>
          <Settings size={20} />
        </button>

        {/* Deal closed modal */}
        {uiPanel === 'dealClosed' && currentCar && (
          <div className="deal-modal">
            <h2>🎉 SOLD!</h2>
            <p className="price">
              ${session.agreedPrice.toLocaleString()} {session.agreedType === 'otd' ? 'OTD' : session.agreedType === 'payment' ? '/mo' : 'Selling Price'}
            </p>
            <p className={`profit-display ${(
              session.agreedPrice - (session.agreedType === 'otd' ? currentCar.fees + currentCar.tax : 0) - currentCar.invoice
            ) < 0 ? 'loss' : ''}`}>
              Profit: {(
                session.agreedType === 'otd' 
                  ? Math.round((session.agreedPrice - currentCar.fees) / 1.07) - currentCar.invoice
                  : session.agreedType === 'payment'
                    ? Math.round((customOTDPrice - currentCar.fees) / 1.07) - currentCar.invoice
                    : session.agreedPrice - currentCar.invoice
              ).toLocaleString()}
            </p>
            <button onClick={signDeal}>Sign Deal</button>
          </div>
        )}

        {/* Lost deal modal */}
        {uiPanel === 'lostDeal' && selectedPerson && (
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
                  showInventory={uiPanel === 'inventory'}
                  setShowInventory={(show) => setUiPanel(show ? 'inventory' : 'none')}
                  showNumbers={uiPanel === 'numbers'}
                  setShowNumbers={(show) => setUiPanel(show ? 'numbers' : 'none')}
                  currentCar={currentCar}
                  attemptCloseDeal={attemptCloseDeal}
                  isMobile={false}
                  onDiscoveryAction={handleDiscoveryAction}
                  showNotes={false}
                  useAI={settings.useAI}
                />
              </div>

              {/* Desktop: Inventory panel next to chat */}
              {uiPanel === 'inventory' && (
                <div className="side-panel in-container inventory-panel">
                  <div className="panel-header">
                    <h3>Inventory ({filteredInventory.length} cars)</h3>
                    <button className="panel-close" onClick={() => setUiPanel('none')}>×</button>
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
                    {filteredInventory.map(car => (
                      <div key={car.id} className="inventory-item">
                        <div className="inventory-item-info">
                          <h4>{car.model} {car.trim}</h4>
                          <p>{car.color} • ${car.price.toLocaleString()}</p>
                        </div>
                        <button
                          className="inventory-item-action"
                          onClick={() => {
                            showCarToCustomer(car);
                            setUiPanel('none');
                          }}
                        >
                          Show
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desktop: Numbers panel next to chat */}
              {/* Desktop: Numbers panel next to chat */}
              <NumbersPanel
                isOpen={uiPanel === 'numbers' && !!currentCar}
                onClose={() => setUiPanel('none')}
                currentCar={currentCar}
                customSellingPrice={customSellingPrice}
                setCustomSellingPrice={setCustomSellingPrice}
                customOTDPrice={customOTDPrice}
                setCustomOTDPrice={setCustomOTDPrice}
                makeOffer={makeOffer}
                showDealClosed={uiPanel === 'dealClosed'}
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
                  showInventory={uiPanel === 'inventory'}
                  setShowInventory={(show) => setUiPanel(show ? 'inventory' : 'none')}
                  showNumbers={uiPanel === 'numbers'}
                  setShowNumbers={(show) => setUiPanel(show ? 'numbers' : 'none')}
                  currentCar={currentCar}
                  attemptCloseDeal={attemptCloseDeal}
                  isMobile={true}
                  onDiscoveryAction={handleDiscoveryAction}
                />
              </div>
            )}
          </>
        )}

        {/* Mobile-only: Inventory panel as centered modal (does not fill screen) */}
        {uiPanel === 'inventory' && isMobile && (
          <>
            <div className="panel-backdrop" onClick={() => setUiPanel('none')} />
            <div className="side-panel inventory-modal inventory-panel">
              <div className="panel-header">
                <h3>Inventory ({filteredInventory.length} cars)</h3>
                <button className="panel-close" onClick={() => setUiPanel('none')}>×</button>
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
                {filteredInventory.map(car => (
                  <div key={car.id} className="inventory-item">
                    <div className="inventory-item-info">
                      <h4>{car.model} {car.trim}</h4>
                      <p>{car.color} • ${car.price.toLocaleString()}</p>
                    </div>
                    <button
                      className="inventory-item-action"
                      onClick={() => {
                        showCarToCustomer(car);
                        setUiPanel('none');
                      }}
                    >
                      Show
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mobile-only: Numbers panel as modal (when chat is closed) */}
        {/* Mobile-only: Numbers panel as modal (when chat is closed) */}
        <NumbersPanel
            isOpen={uiPanel === 'numbers' && !!currentCar && isMobile}
            onClose={() => setUiPanel('none')}
            currentCar={currentCar}
            customSellingPrice={customSellingPrice}
            setCustomSellingPrice={setCustomSellingPrice}
            customOTDPrice={customOTDPrice}
            setCustomOTDPrice={setCustomOTDPrice}
            makeOffer={makeOffer}
            showDealClosed={uiPanel === 'dealClosed'}
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
        {uiPanel === 'settings' && (
          <>
            <div className="panel-backdrop" onClick={() => setUiPanel('none')} />
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
                        value={settings.provider}
                        onChange={(e) => setSettings(prev => ({ ...prev, provider: e.target.value as any }))}
                      >
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="local">Local / OpenAI Compatible</option>
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
                    ) : (
                      <>
                        <div className="ai-field">
                          <label>API Base URL</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="/api/lm-studio"
                              value={settings.apiBaseUrl}
                              onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                            />
                            <button
                                style={{ padding: '0 12px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                onClick={() => setSettings(prev => ({ ...prev, apiBaseUrl: '/api/lm-studio' }))}
                                title="Use Safe Proxy"
                            >
                              Use Proxy
                            </button>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                            Default: /api/lm-studio (Fixes CORS issues)
                          </div>
                          
                          {/* Cloud-to-Local Warning */}
                          {window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1' && 
                           settings.apiBaseUrl && 
                           (settings.apiBaseUrl.includes('localhost') || settings.apiBaseUrl.includes('127.0.0.1')) && (
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '10px', 
                              background: '#fff3cd', 
                              color: '#856404', 
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              border: '1px solid #ffeeba'
                            }}>
                              <strong>⚠️ Connection Warning</strong><br/>
                              You are running this app from the cloud ({window.location.hostname}), but trying to connect to a local server ({settings.apiBaseUrl}).<br/><br/>
                              The cloud cannot "see" your computer's localhost.<br/><br/>
                              <strong>Fix:</strong> Use <a href="https://ngrok.com" target="_blank" rel="noreferrer">ngrok</a> to create a public URL for your local server:<br/>
                              <code>ngrok http 1234</code>
                            </div>
                          )}
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
                          <label>Model Name</label>
                          <input
                            type="text"
                            placeholder="local-model"
                            value={settings.modelName}
                            onChange={(e) => setSettings(prev => ({ ...prev, modelName: e.target.value }))}
                          />
                        </div>
                        <div className="ai-field">
                          <label>API Key (Optional)</label>
                          <input
                            type="password"
                            placeholder="lm-studio"
                            value={settings.apiKey}
                            onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
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
                    : 'Using Local/Compatible model'
                  : 'Using smart scripted responses (works offline)'}
              </p>
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button 
                  className="close-btn" 
                  style={{ background: 'var(--danger)', marginTop: '0', fontSize: '0.9rem', opacity: 0.9 }}
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all sales stats?')) {
                      dispatchSession({ type: 'RESET_SESSION' });
                    }
                  }}
                >
                  Reset All Stats
                </button>
              </div>

              <button className="close-btn" onClick={() => setUiPanel('none')}>
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
