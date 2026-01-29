import React from 'react';
import { Package, Calculator, TrendingUp } from 'lucide-react';
import { Customer, ConversationMessage, Car } from '../types/game';
import { CustomerNotes } from './CustomerNotes';

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
  onDiscoveryAction: (type: 'budget' | 'type' | 'features' | 'model') => void;
  showNotes?: boolean;
  useAI?: boolean;
  hasPerfectMatch: boolean;
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
  onDiscoveryAction,
  showNotes = true,
  useAI = false,
  hasPerfectMatch,
}: ChatInterfaceProps) {
  
  const getInterestColor = (interest: number) => {
    if (interest > 60) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (interest > 30) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  };

  const canCloseDeal = !!currentCar && (
    conversation.some(msg => msg.offerDetails) ||
    selectedPerson.interest >= 40 ||
    selectedPerson.conversationPhase === 'closed'
  );
  const customerAccepted = selectedPerson.conversationPhase === 'closed';

  return (
    <>
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar in header */}
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              background: selectedPerson.buyerType === 'cash' ? '#2ecc71' : '#3498db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            {selectedPerson.name.charAt(0)}
          </div>
          
          <div className="chat-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedPerson.name}</h3>
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '2px 6px', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}>
                {selectedPerson.buyerType === 'cash' ? '💵 Cash' : '💳 Finance'}
              </span>
            </div>
            <div className="personality" style={{ marginTop: '2px' }}>
              {selectedPerson.personality} • Patience: {selectedPerson.temper}/100
            </div>
          </div>
        </div>
        <button className="chat-close" onClick={onClose}>×</button>
      </div>
      
      {showNotes && (
        <div style={{ padding: '0 15px' }}>
          <CustomerNotes customer={selectedPerson} />
        </div>
      )}

      {/* Compact Offer Status - Only show if current car exists */}
      {currentCar && (
        <div style={{ 
          margin: '0 15px 8px 15px', 
          padding: '8px 12px', 
          background: 'rgba(0,0,0,0.2)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', color: '#fff' }}>{currentCar.model} {currentCar.trim}</span>
            <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{currentCar.color}</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {/* Show list price */}
            <div style={{ fontWeight: '700', color: '#2ecc71' }}>
              ${currentCar.price.toLocaleString()}
            </div>
            
            {/* Show current offer if any */}
            {(() => {
              const lastOffer = [...conversation].reverse().find(msg => msg.offerDetails);
              if (lastOffer?.offerDetails) {
                 const { type, price } = lastOffer.offerDetails;
                 return (
                   <div style={{ fontSize: '0.7rem', color: '#f39c12', marginTop: '2px' }}>
                     Offer: {type === 'payment' ? `$${price}/mo` : `$${price.toLocaleString()}`}
                   </div>
                 );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      <div className="interest-bar-container">
        <div className="interest-bar-label">
          <span>{useAI ? 'Satisfaction' : 'Interest'}</span>
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
        {isTyping && (
          <div className="typing-indicator">
            {useAI ? 'loading ai modal, one sec...' : 'typing...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {useAI ? (
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="chat-input"
            placeholder="Type message..."
          />
        ) : (
          <div className="scripted-replies">
        {conversation.length === 0 && (
          <button
            onClick={() => sendMessage('Hello!')}
            className="scripted-reply-btn"
          >
            👋 Say Hello
          </button>
        )}
        {conversation.length > 0 && (() => {
          const order: Array<'type' | 'features' | 'budget' | 'model'> = ['type', 'features', 'budget', 'model'];
          const stageLabels: Record<typeof order[number], string> = {
            type: 'Looking For?',
            features: 'Needs?',
            budget: 'Budget?',
            model: 'Specific model?',
          };
          const nextStage = order.find(stage => !selectedPerson.revealedPreferences[stage]);
          // Only show "No other options?" after basic needs (type, features, budget) are discovered
          const basicNeedsDiscovered = selectedPerson.revealedPreferences.type &&
                                       selectedPerson.revealedPreferences.features &&
                                       selectedPerson.revealedPreferences.budget;
          return (
            <>
              {nextStage && (
                <button
                  onClick={() => onDiscoveryAction(nextStage)}
                  className="scripted-reply-btn"
                >
                  {stageLabels[nextStage]}
                </button>
              )}
              {basicNeedsDiscovered && !hasPerfectMatch && (
                <button
                  onClick={() => sendMessage("No other options?")}
                  className="scripted-reply-btn"
                >
                  No Other Options?
                </button>
              )}
            </>
          );
        })()}
      </div>
        )}
      </div>

      <div className="chat-actions">
        <button
          className="action-btn inventory"
          onClick={() => {
            if (showInventory) {
              setShowInventory(false);
            } else {
              setShowInventory(true);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'auto', padding: '12px 8px' }}
        >
          <Package size={18} style={{ marginBottom: '4px' }} />
          Inventory
        </button>
        <button
          className="action-btn numbers"
          onClick={() => {
            if (showNumbers) {
              setShowNumbers(false);
            } else {
              setShowNumbers(true);
            }
          }}
          disabled={!currentCar}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'auto', padding: '12px 8px' }}
        >
          <Calculator size={18} style={{ marginBottom: '4px' }} />
          Numbers
        </button>
        <button
          onClick={attemptCloseDeal}
          disabled={!canCloseDeal}
          style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 'auto', 
            padding: '12px 8px',
            background: canCloseDeal ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
            backgroundImage: canCloseDeal
              ? (customerAccepted ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
              : 'none',
            backgroundColor: canCloseDeal ? 'transparent' : '#e5e7eb',
            color: canCloseDeal ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: canCloseDeal ? 'pointer' : 'not-allowed',
            boxShadow: canCloseDeal ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
            animation: canCloseDeal ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={18} style={{ marginBottom: '4px' }} />
          {customerAccepted ? 'Finalize deal' : 'Close Deal'}
        </button>
      </div>
    </>
  );
}
