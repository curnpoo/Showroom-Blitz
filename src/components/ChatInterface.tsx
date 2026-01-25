import React from 'react';
import { Send, Package, Calculator, TrendingUp } from 'lucide-react';
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
}: ChatInterfaceProps) {
  
  const getInterestColor = (interest: number) => {
    if (interest > 60) return 'linear-gradient(90deg, #2ecc71, #27ae60)';
    if (interest > 30) return 'linear-gradient(90deg, #f39c12, #e67e22)';
    return 'linear-gradient(90deg, #e74c3c, #c0392b)';
  };

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

      <div className="chat-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Discovery Action Bar */}
        {(selectedPerson.conversationPhase === 'greeting' || selectedPerson.conversationPhase === 'needs_discovery') && (
          <div className="discovery-actions" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', width: '100%' }}>
            {!selectedPerson.revealedPreferences.budget && (
              <button 
                onClick={() => onDiscoveryAction('budget')}
                style={{ 
                  flex: 1, 
                  whiteSpace: 'nowrap', 
                  fontSize: '0.75rem', 
                  padding: '6px 8px', 
                  background: '#e0f2fe', 
                  color: '#0284c7', 
                  border: '1px solid #bae6fd', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Ask Budget
              </button>
            )}
            {!selectedPerson.revealedPreferences.type && (
              <button 
                onClick={() => onDiscoveryAction('type')}
                style={{ 
                  flex: 1, 
                  whiteSpace: 'nowrap', 
                  fontSize: '0.75rem', 
                  padding: '6px 8px', 
                  background: '#f0fdf4', 
                  color: '#16a34a', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Ask Type
              </button>
            )}
            {!selectedPerson.revealedPreferences.features && (
              <button 
                onClick={() => onDiscoveryAction('features')}
                style={{ 
                  flex: 1, 
                  whiteSpace: 'nowrap', 
                  fontSize: '0.75rem', 
                  padding: '6px 8px', 
                  background: '#fdf4ff', 
                  color: '#c026d3', 
                  border: '1px solid #f5d0fe', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Ask Needs
              </button>
            )}
            {!selectedPerson.revealedPreferences.model && (
              <button 
                onClick={() => onDiscoveryAction('model')}
                style={{ 
                  flex: 1, 
                  whiteSpace: 'nowrap', 
                  fontSize: '0.75rem', 
                  padding: '6px 8px', 
                  background: '#fff7ed', 
                  color: '#ea580c', 
                  border: '1px solid #fed7aa', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Ask Model
              </button>
            )}
          </div>
        )}
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
            />
            <button onClick={() => sendMessage()} className="chat-send-btn">
              <Send size={18} />
            </button>
          </>
        )}
      </div>

      <div className="chat-actions">
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
