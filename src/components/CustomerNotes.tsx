
import { useEffect, useRef, useState } from 'react';
import { Customer, VehicleCategory } from '../types/game';
import { Search, DollarSign, List, Car } from 'lucide-react';

interface CustomerNotesProps {
  customer: Customer;
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  suv: '⛽️ SUV',
  sedan: '⛽️ Sedan',
  electric: '⚡️ Electric',
  affordable: '⛽️ Economy',
  luxury: '⛽️ Luxury',
  any: 'Flexible',
};

const NOTES_POP_STYLES = `
@keyframes notePopIn {
  0% {
    transform: scale(0.8) translateY(-10px);
    opacity: 0;
    filter: brightness(1.5);
  }
  50% {
    transform: scale(1.08) translateY(0);
    opacity: 1;
    filter: brightness(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(1);
  }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.note-item.pop {
  animation: notePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(
    90deg,
    rgba(255, 215, 0, 0.15) 0%,
    rgba(255, 140, 0, 0.25) 50%,
    rgba(255, 215, 0, 0.15) 100%
  );
  background-size: 200% 100%;
  animation: notePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
             shimmer 1s ease-in-out;
  border: 2px solid rgba(255, 140, 0, 0.4);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3),
              0 0 20px rgba(255, 215, 0, 0.2);
  border-radius: 6px;
  padding: 8px;
}
`;

type PreferenceKey = 'budget' | 'type' | 'features' | 'model';
const NOTE_KEYS: PreferenceKey[] = ['budget', 'type', 'features', 'model'];

export function CustomerNotes({ customer }: CustomerNotesProps) {
  const { revealedPreferences, buyerType, budget, maxPayment, desiredDown, desiredCategory, desiredFeatures, desiredModel } = customer;
  const [popState, setPopState] = useState<Record<PreferenceKey, boolean>>({
    budget: false,
    type: false,
    features: false,
    model: false,
  });
  const prevRevealedRef = useRef(customer.revealedPreferences);
  const popTimeoutsRef = useRef<Record<PreferenceKey, ReturnType<typeof setTimeout> | null>>({
    budget: null,
    type: null,
    features: null,
    model: null,
  });

  useEffect(() => {
    const prev = prevRevealedRef.current;
    NOTE_KEYS.forEach(key => {
      if (!prev[key] && customer.revealedPreferences[key]) {
        setPopState(state => ({ ...state, [key]: true }));
        if (popTimeoutsRef.current[key]) {
          clearTimeout(popTimeoutsRef.current[key]!);
        }
        popTimeoutsRef.current[key] = setTimeout(() => {
          setPopState(state => ({ ...state, [key]: false }));
          popTimeoutsRef.current[key] = null;
        }, 350);
      }
    });
    prevRevealedRef.current = customer.revealedPreferences;
  }, [customer.revealedPreferences]);

  useEffect(() => {
    return () => {
      NOTE_KEYS.forEach(key => {
        const timeout = popTimeoutsRef.current[key];
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const getNoteClass = (key: PreferenceKey) => popState[key] ? 'note-item pop' : 'note-item';

  return (
    <>
      <style>{NOTES_POP_STYLES}</style>
      <div className="customer-notes" style={{
        background: '#fff9db',
        border: '1px solid #e6dbb9',
        borderRadius: '8px',
        padding: '10px',
        marginBottom: '10px',
        fontSize: '0.85rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
      <div style={{ 
        fontSize: '0.75rem', 
        fontWeight: '700', 
        color: '#8c8c8c', 
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Customer Notes
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        
        {/* BUDGET ITEM */}
        <div className={getNoteClass('budget')}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '2px' }}>
            <DollarSign size={12} style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: '600' }}>Budget</span>
          </div>
          <div style={{ color: revealedPreferences.budget ? '#000' : '#aaa', fontStyle: revealedPreferences.budget ? 'normal' : 'italic', fontSize: '0.8rem' }}>
            {revealedPreferences.budget ? (
              buyerType === 'cash' 
                ? `$${budget.toLocaleString()} Cash` 
                : (
                  <div>
                    <div>{`$${maxPayment}/mo Max`}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{`$${desiredDown.toLocaleString()} Down`}</div>
                  </div>
                )
            ) : (
              'Unknown'
            )}
          </div>
        </div>

        {/* TYPE ITEM */}
        <div className={getNoteClass('type')}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '2px' }}>
            <Car size={12} style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: '600' }}>Type</span>
          </div>
          <div style={{ color: revealedPreferences.type ? '#000' : '#aaa', fontStyle: revealedPreferences.type ? 'normal' : 'italic' }}>
            {revealedPreferences.type ? (
              CATEGORY_LABELS[desiredCategory]
            ) : (
              'Unknown'
            )}
          </div>
        </div>

        {/* FEATURES ITEM */}
        <div className={getNoteClass('features')} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '2px' }}>
            <List size={12} style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: '600' }}>Must Haves</span>
          </div>
          <div style={{ color: revealedPreferences.features ? '#000' : '#aaa', fontStyle: revealedPreferences.features ? 'normal' : 'italic' }}>
            {revealedPreferences.features ? (
              desiredFeatures.map(f => f.replace('_', ' ')).join(', ')
            ) : (
              'Unknown'
            )}
          </div>
        </div>

        {/* MODEL ITEM */}
        <div className={getNoteClass('model')} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '2px' }}>
            <Search size={12} style={{ marginRight: '4px' }} />
            <span style={{ fontWeight: '600' }}>Specific Model</span>
          </div>
          <div style={{ color: revealedPreferences.model ? '#000' : '#aaa', fontStyle: revealedPreferences.model ? 'normal' : 'italic' }}>
            {revealedPreferences.model ? (
              desiredModel || 'None'
            ) : (
              'Unknown'
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
