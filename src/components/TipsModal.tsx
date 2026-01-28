import React, { useState } from 'react';
import { X, ChevronRight, ChevronDown, BookOpen, Calculator, Target, Gamepad2, Zap, TrendingUp } from 'lucide-react';

interface TipsModalProps {
  onClose: () => void;
}

export const TipsModal: React.FC<TipsModalProps> = ({ onClose }) => {
  const [openCategory, setOpenCategory] = useState<string | null>('how-to-play');

  const toggleCategory = (id: string) => {
    setOpenCategory(openCategory === id ? null : id);
  };

  const categories = [
    {
      id: 'how-to-play',
      title: 'How to Play',
      icon: <BookOpen size={20} />,
      content: [
        { title: 'Your Goal', text: 'You are a car salesperson competing against 3 AI coworkers. Intercept customers, match them with vehicles, and close deals to maximize your profit.' },
        { title: 'Movement', text: 'Click anywhere on the showroom floor to move your character. Position yourself strategically near the entrance to intercept incoming customers first.' },
        { title: 'Customer Flow', text: 'Customers spawn at the top of the showroom and wander around looking at cars. Reach them quickly before your AI competitors do - they\'re aggressive!' },
        { title: 'Starting Conversations', text: 'Click on a customer to engage them. You\'ll see their name, personality type, and budget. Pay attention to these details - they determine negotiation success.' },
        { title: 'Vehicle Selection', text: 'Browse your inventory and select a vehicle that fits their budget and preferences. The conversation panel shows their reactions and hints about what they want.' }
      ]
    },
    {
      id: 'negotiation',
      title: 'Negotiation System',
      icon: <Target size={20} />,
      content: [
        { title: 'Customer Personalities', text: 'Each customer has a personality (Friendly, Serious, Skeptical, Eager, Indecisive, Budget-Conscious) that affects how they negotiate. Friendly customers accept deals easier; Budget-Conscious ones scrutinize every dollar.' },
        { title: 'Reading the Room', text: 'Watch the conversation dialogue. Customers will express interest, concerns, or objections. If they mention price worries, they may need a lower payment or better terms.' },
        { title: 'Deal Components', text: 'You control: Selling Price, Down Payment, Term Length (months), and Interest Rate (APR). Adjust these to find a deal that works for both parties.' },
        { title: 'Close Timing', text: 'Don\'t rush! Make 3-5 conversation exchanges before presenting numbers. Building rapport first increases acceptance rates by up to 50%.' },
        { title: 'Deal Breakers', text: 'Avoid red flags: Offering way over MSRP to price-sensitive buyers, super long terms to serious customers, or high rates to skeptics. Match your offer to their personality.' }
      ]
    },
    {
      id: 'finance-math',
      title: 'Finance & Profit Math',
      icon: <Calculator size={20} />,
      content: [
        { title: 'Gross Profit', text: 'Your profit = Selling Price - Invoice Cost. The system shows this automatically. Aim for $1,000-$5,000 per deal depending on vehicle price.' },
        { title: 'MSRP vs Invoice', text: 'MSRP is the manufacturer\'s suggested retail price. Invoice is what the dealer paid. You can sell anywhere in between (or above MSRP if the customer loves it).' },
        { title: 'OTD Price', text: 'Out The Door price = Selling Price + Tax (7%) + Dealer Fees ($1,000). This is what the customer actually pays, and what monthly payments are based on.' },
        { title: 'Monthly Payment Formula', text: 'Calculated using OTD price, down payment, term length, and APR. Lower selling price, higher down payment, longer term, or lower rate = lower monthly payment.' },
        { title: 'Profit vs Volume', text: 'High profit per deal is great, but selling more cars faster can be better overall. In Standard mode, take your time. In Volume Run, prioritize speed!' }
      ]
    },
    {
      id: 'best-practices',
      title: 'Best Practices & Pro Tips',
      icon: <TrendingUp size={20} />,
      content: [
        { title: 'Speed is Everything', text: 'Position yourself near the entrance. The first salesperson to reach a customer usually gets them. Your AI competitors are fast!' },
        { title: 'Know Your Inventory', text: 'Before engaging customers, quickly scan your inventory. Know what price ranges you have available so you can match customers to vehicles quickly.' },
        { title: 'Budget Matching', text: 'If a customer says "$40k budget," don\'t show them an $80k car. Stay within 10-20% of their stated budget for best results.' },
        { title: 'Payment-Focused Closing', text: 'Most customers care more about monthly payments than total price. If they balk at the price, try increasing the term or lowering the rate to get payments down.' },
        { title: 'Read Personality Cues', text: 'Friendly/Eager = You can be more aggressive with pricing. Skeptical/Serious = Keep offers very fair. Budget-Conscious = Focus on low payments and value.' },
        { title: 'Don\'t Cherry-Pick in Volume Mode', text: 'In Volume Run (10 cars), don\'t waste time finding the "perfect" vehicle. Match the budget range and close FAST. Every second counts!' },
        { title: 'Track Your Metrics', text: 'The stats overlay shows your total sales, profit, and last deal performance. In timed modes, balance speed with profit - sometimes a quick $800 deal beats waiting for a $3,000 one.' },
        { title: 'Learn from Rejections', text: 'If deals get rejected, the customer usually tells you why in the conversation. Adjust your next offer accordingly - maybe lower the rate or add more down payment.' }
      ]
    },
    {
      id: 'game-modes',
      title: 'Game Modes Explained',
      icon: <Gamepad2 size={20} />,
      content: [
        { title: 'Standard Mode', text: '100-vehicle inventory. No time pressure. Perfect for learning the game, practicing negotiation, and maximizing profit per deal. Take your time and master the art of the sale.' },
        { title: 'Volume Run Mode', text: '10-vehicle inventory. Race to sell all 10 cars as fast as possible. Profit margins matter less than speed - accept lower gross to move units faster. Great for competitive play!' },
        { title: 'Timed Standard Mode', text: 'Standard 100-car inventory with a countdown timer (3, 5, or 10 minutes). Maximize total profit before time runs out. Balances speed with deal quality - you need both!' }
      ]
    },
    {
      id: 'quick-reference',
      title: 'Quick Reference',
      icon: <Zap size={20} />,
      content: [
        { title: 'Controls', text: 'Click floor to move • Click customer to engage • Click vehicle to show • Click "Present Deal" to close' },
        { title: 'Good Deal Checklist', text: '✓ Within customer budget • ✓ 3+ conversation turns • ✓ Selling price near MSRP • ✓ Monthly payment affordable • ✓ Matches personality style' },
        { title: 'Common Mistakes', text: '✗ Rushing the close • ✗ Ignoring personality type • ✗ Way over MSRP on Budget-Conscious buyers • ✗ Letting competitors reach customers first' },
        { title: 'Keyboard Shortcuts', text: 'ESC = Close modal • Click outside modal = Close' }
      ]
    }
  ];

  return (
    <div className="start-screen-overlay" style={{ zIndex: 2000 }}>
      <div className="deal-modal" style={{
        maxWidth: '700px',
        width: '90%',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#2f3136',
        border: '1px solid #202225'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #202225',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#dcddde'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span> Showroom Guide
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#40444b'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={24} color="#b9bbbe" />
          </button>
        </div>

        <div style={{
          overflowY: 'auto',
          paddingRight: '10px',
          flex: 1
        }}>
          {categories.map(cat => (
            <div key={cat.id} style={{
              marginBottom: '12px',
              border: '1px solid #202225',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#36393f'
            }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: openCategory === cat.id ? '#40444b' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#dcddde',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (openCategory !== cat.id) e.currentTarget.style.background = '#3a3d42';
                }}
                onMouseLeave={(e) => {
                  if (openCategory !== cat.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  <span style={{ color: '#5865F2' }}>{cat.icon}</span>
                  <span style={{ color: '#dcddde' }}>{cat.title}</span>
                </div>
                <span style={{ color: '#b9bbbe' }}>
                  {openCategory === cat.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>

              {openCategory === cat.id && (
                <div style={{
                  padding: '16px',
                  background: '#2f3136',
                  borderTop: '1px solid #202225'
                }}>
                  {cat.content.map((item, idx) => (
                    <div key={idx} style={{
                      marginBottom: idx < cat.content.length - 1 ? '16px' : '0',
                      paddingBottom: idx < cat.content.length - 1 ? '16px' : '0',
                      borderBottom: idx < cat.content.length - 1 ? '1px solid #202225' : 'none'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '6px',
                        color: '#dcddde',
                        fontSize: '0.9rem'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#b9bbbe',
                        lineHeight: '1.5'
                      }}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid #202225',
          paddingTop: '16px',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: '#5865F2',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(88, 101, 242, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4752c4';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(88, 101, 242, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5865F2';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(88, 101, 242, 0.3)';
            }}
          >
            Got it, Let's Sell! 🚗
          </button>
        </div>
      </div>
    </div>
  );
};
