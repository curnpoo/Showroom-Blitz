import { ConversationMessage, Car } from '../types/game';

interface OfferPaperProps {
  conversation: ConversationMessage[];
  currentCar: Car | null;
}

export function OfferPaper({ conversation, currentCar }: OfferPaperProps) {
  // Find the last offer in conversation
  const lastOffer = [...conversation].reverse().find(msg => msg.offerDetails);
  
  if (!lastOffer?.offerDetails || !currentCar) return null;

  const { type: offerType, price: offerPrice } = lastOffer.offerDetails;

  return (
    <div className="offer-paper">
      <div className="paper-header">
        {offerType === 'payment' ? 'PAYMENT' : offerType === 'otd' ? 'OTD' : 'OFFER'}
      </div>
      <div className="paper-car">{currentCar.model}</div>
      <div className="paper-price">
        {offerType === 'payment' 
          ? `$${offerPrice}/mo` 
          : `$${offerPrice?.toLocaleString()}`}
      </div>
    </div>
  );
}
