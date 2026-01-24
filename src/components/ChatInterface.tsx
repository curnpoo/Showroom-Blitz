import React from 'react';
import { Send, Package, Calculator, TrendingUp } from 'lucide-react';
import { Customer, ConversationMessage, Car } from '../types/game';
import { OfferPaper } from './OfferPaper';

interface ChatInterfaceProps {
  selectedPerson: Customer;
  conversation: ConversationMessage[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  sendMessage: (msg?: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  showNumbers: boolean;
  setShowNumbers: (show: boolean) => void;
  currentCar: Car | null;
  attemptCloseDeal: () => void;
  isMobile: boolean;
}

export function ChatInterface({
  selectedPerson,
  conversation,
  isTyping,
  messagesEndRef,
  inputMessage,
  setInputMessage,
  sendMessage,
  inputRef,
  onClose,
  showInventory,
  setShowInventory,
  showNumbers,
  setShowNumbers,
  currentCar,
  attemptCloseDeal,
  isMobile,
}: ChatInterfaceProps) {
  
  const getInterestColor = (interest: number) => {
    if (interest > 60) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (interest > 30) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  };

  return (
    <>
      {/* Desk Scene Visualization */}
      <div className="desk-scene">
        <div className="desk-scene-characters">
          {/* Customer avatar - across the desk */}
          <div className="desk-character customer-side">
            <div 
              className="character-avatar" 
              style={{ background: selectedPerson.buyerType === 'cash' ? '#2ecc71' : '#3498db' }}
            >
              {selectedPerson.name.charAt(0)}
            </div>
            <div className="character-label">{selectedPerson.name}</div>
            <div className="buyer-badge" style={{ background: selectedPerson.buyerType === 'cash' ? '#2ecc71' : '#3498db' }}>
              {selectedPerson.buyerType === 'cash' ? '💵 Cash' : '💳 Payment'}
            </div>
          </div>
          
          {/* The desk with optional paper */}
          <div className="desk-surface">
            <div className="desk-top">
              <OfferPaper conversation={conversation} currentCar={currentCar} />
            </div>
          </div>
          
          {/* Player avatar - your side */}
          <div className="desk-character player-side">
            <div className="character-avatar player-avatar">
              YOU
            </div>
            <div className="character-label">Salesperson</div>
          </div>
        </div>
      </div>

      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{selectedPerson.name}</h3>
          <div className="buyer-info">
            {selectedPerson.buyerType === 'cash' ? '💵' : '💳'}
            {selectedPerson.buyerType === 'cash'
              ? ` Cash • Budget: $${selectedPerson.budget.toLocaleString()}`
              : ` Payment • Max: $${selectedPerson.maxPayment}/mo`}
          </div>
          <div className="personality">
            {selectedPerson.personality} • Patience: {selectedPerson.temper}/100
          </div>
        </div>
        <button className="chat-close" onClick={onClose}>×</button>
      </div>

      <div className="interest-bar-container">
        <div className="interest-bar-label">
          <span>Interest</span>
          <span>{selectedPerson.interest}%</span>
        </div>
        <div className="interest-bar">
          <div
            className="interest-bar-fill"
            style={{
              width: `${selectedPerson.interest}%`,
              background: getInterestColor(selectedPerson.interest),
            }}
          />
        </div>
      </div>

      <div className="chat-messages">
        {conversation.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isTyping && <div className="typing-indicator">typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {conversation.length === 0 ? (
          <button 
            onClick={() => sendMessage('Hello!')}
            className="chat-greet-btn"
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            👋 Say Hello
          </button>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="chat-input"
              placeholder="Type message..."
              autoFocus
            />
            <button onClick={() => sendMessage()} className="chat-send-btn">
              <Send size={18} />
            </button>
          </>
        )}
      </div>

      <div className="chat-actions" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '8px',
        padding: isMobile ? '12px 16px' : undefined,
        borderTop: isMobile ? '1px solid var(--border)' : undefined,
        background: isMobile ? 'rgba(0,0,0,0.2)' : undefined
      }}>
        <button
          className="action-btn inventory"
          onClick={() => { setShowInventory(!showInventory); if (!showInventory) setShowNumbers(false); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'auto', padding: '12px 8px' }}
        >
          <Package size={18} style={{ marginBottom: '4px' }} />
          Inventory
        </button>
        <button
          className="action-btn numbers"
          onClick={() => { setShowNumbers(!showNumbers); if (!showNumbers) setShowInventory(false); }}
          disabled={!currentCar}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'auto', padding: '12px 8px' }}
        >
          <Calculator size={18} style={{ marginBottom: '4px' }} />
          Numbers
        </button>
        <button
          onClick={attemptCloseDeal}
          disabled={!currentCar || (!conversation.some(msg => msg.offerDetails) && selectedPerson.interest < 40)}
          style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 'auto', 
            padding: '12px 8px',
            background: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? '#eab308' // Yellow-500
              : 'rgba(255, 255, 255, 0.05)',
            backgroundImage: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'none',
            backgroundColor: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? 'transparent'
              : '#e5e7eb', // Gray for disabled
            color: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? 'white'
              : '#9ca3af',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40) 
              ? 'pointer' 
              : 'not-allowed',
            boxShadow: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              : 'none',
            animation: currentCar && (conversation.some(msg => msg.offerDetails) || selectedPerson.interest >= 40)
              ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              : 'none',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={18} style={{ marginBottom: '4px' }} />
          Close Deal
        </button>
      </div>
    </>
  );
}
