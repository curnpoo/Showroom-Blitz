export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  email: string | null;
  totalProfit: number;
  totalGross: number;
  salesCount: number;
  bestSessionProfit?: number;
  lastSessionProfit?: number;
  lastSessionGross?: number;
  lastSessionSales?: number;
  lastSessionAt?: string | null;
  mode?: string | null;
  rank?: number | null;
}

export interface PlayerSummary extends LeaderboardEntry {
  rank: number;
}
