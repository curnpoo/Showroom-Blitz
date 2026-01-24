import React from 'react';
import { Customer, VehicleCategory } from '../types/game';
import { Search, DollarSign, List, Car } from 'lucide-react';

interface CustomerNotesProps {
  customer: Customer;
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  suv: 'SUV',
  sedan: 'Sedan',
  electric: 'Electric',
  hybrid: 'Hybrid',
  affordable: 'Economy',
  luxury: 'Luxury',
  any: 'Flexible',
};

export function CustomerNotes({ customer }: CustomerNotesProps) {
  const { revealedPreferences, buyerType, budget, maxPayment, desiredDown, desiredCategory, desiredFeatures, desiredModel } = customer;

  return (
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
        <div className="note-item">
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
        <div className="note-item">
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
        <div className="note-item" style={{ gridColumn: 'span 2' }}>
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
        <div className="note-item" style={{ gridColumn: 'span 2' }}>
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
  );
}
