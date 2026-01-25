import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, BookOpen, Calculator, Target, Gamepad2 } from 'lucide-react';

interface TipsModalProps {
  onClose: () => void;
}

export const TipsModal: React.FC<TipsModalProps> = ({ onClose }) => {
  const [openCategory, setOpenCategory] = useState<string | null>('getting-started');

  const toggleCategory = (id: string) => {
    setOpenCategory(openCategory === id ? null : id);
  };

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen size={20} />,
      content: [
        { title: 'The Goal', text: 'Sell cars to customers to make profit. Balance volume with gross profit per deal.' },
        { title: 'Movement', text: 'Click anywhere on the showroom floor to move your salesperson.' },
        { title: 'Customers', text: 'Customers enter from the top. Intercept them quickly before coworkers steal them!' }
      ]
    },
    {
      id: 'negotiation',
      title: 'Negotiation Tips',
      icon: <Target size={20} />,
      content: [
        { title: 'Personalities', text: 'Each customer has a personality (Friendly, Serious, etc). Tailor your approach.' },
        { title: 'Patience', text: 'Don\'t rush the close! Build rapport first to increase your chances.' },
        { title: 'Deal Breakers', text: 'Watch out for specific dislikes. Providing "Over MSRP" to a price-sensitive buyer is a quick way to lose a deal.' }
      ]
    },
    {
      id: 'finance-math',
      title: 'Desk Manager Math',
      icon: <Calculator size={20} />,
      content: [
        { title: 'Profit', text: 'Gross Profit = Selling Price - Invoice.' },
        { title: 'OTD (Out The Door)', text: 'The final price including Tax (7%) and Fees ($1000).' },
        { title: 'Monthly Payments', text: 'Payments are based on the OTD price, Term length, and Interest Rate (APR).' }
      ]
    },
    {
      id: 'game-modes',
      title: 'Game Modes',
      icon: <Gamepad2 size={20} />,
      content: [
        { title: 'Standard', text: 'Relaxed play. Focus on maximizing profit per deal.' },
        { title: 'Volume Run', text: 'Race against the clock (or other agents) to sell 10 cars as fast as possible. Margins matter less than speed!' },
        { title: 'Timed Mode', text: 'See how much profit you can generate in a fixed time window (3m, 5m, 10m).' }
      ]
    }
  ];

  return (
    <div className="start-screen-overlay" style={{ zIndex: 2000 }}>
      <div className="deal-modal" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span> Showroom Guide
          </h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '10px', flex: 1 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: openCategory === cat.id ? '#e8f4f8' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#1a1a1a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  <span style={{ color: '#2e7d32' }}>{cat.icon}</span>
                  {cat.title}
                </div>
                <span style={{ color: '#333' }}>{openCategory === cat.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
              </button>
              
              {openCategory === cat.id && (
                <div style={{ padding: '0 15px 15px', background: '#f5f5f5' }}>
                  {cat.content.map((item, idx) => (
                    <div key={idx} style={{ marginTop: '15px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.9rem', color: '#333', lineHeight: '1.4' }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px', textAlign: 'center' }}>
          <button 
            onClick={onClose}
            className="action-btn"
            style={{ width: '100%', padding: '12px' }}
          >
            Got it, Let's Sell!
          </button>
        </div>
      </div>
    </div>
  );
};
