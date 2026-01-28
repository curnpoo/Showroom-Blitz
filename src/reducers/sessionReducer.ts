import type { OfferType } from '../types/game';

export interface SessionState {
  totalSales: number;
  lastSaleAmount: number;
  agreedPrice: number;
  agreedType: OfferType;
  lastProfit: number;
  totalProfit: number;
}

export type SessionAction =
  | { type: 'DEAL_CLOSED'; saleAmount: number; profit: number }
  | { type: 'SET_AGREED_OFFER'; price: number; offerType: OfferType }
  | { type: 'RESET_SESSION' };

const initial: SessionState = {
  totalSales: 0,
  lastSaleAmount: 0,
  agreedPrice: 0,
  agreedType: 'selling',
  lastProfit: 0,
  totalProfit: 0,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'DEAL_CLOSED':
      return {
        ...state,
        lastSaleAmount: action.saleAmount,
        lastProfit: action.profit,
        totalProfit: state.totalProfit + action.profit,
        totalSales: state.totalSales + action.saleAmount,
      };
    case 'SET_AGREED_OFFER':
      return {
        ...state,
        agreedPrice: action.price,
        agreedType: action.offerType,
      };
    case 'RESET_SESSION':
      return { ...initial };
    default:
      return state;
  }
}

export const initialSessionState: SessionState = initial;
