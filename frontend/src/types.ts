export type Trade = {
  id: string;                    // unique id from source if available, else derived
  timestamp: string;             // ISO string
  member: string;                // e.g., "Nancy Pelosi"
  chamber?: 'House' | 'Senate';
  ticker: string;                // e.g., "NVDA"
  company?: string;              // e.g., "NVIDIA Corp"
  type: 'purchase' | 'sale' | 'exchange' | 'sale_full' | 'sale_partial';
  amountMin?: number;            // parsed lower bound if available
  amountMax?: number;            // parsed upper bound if available
  amountText?: string;           // original string if ranges
  committees?: string[];         // committees the member is on
  description?: string;          // free text description from feed
  source?: string;               // attribution
};

export type Analysis = {
  decision: 'BUY' | 'SKIP';
  confidence: number;            // 0..100
  rationale: string[];           // bullet list of reasons
  matchedCommittee?: string | null;
};

export type Context = {
  committeeKeywords: Record<string, string[]>;   // committee -> keywords
  companyDeals: Record<string, string[]>;        // company -> committees
};

export type UserPreferences = {
  budget: number;                    // maximum amount willing to invest
  confidenceThreshold: number;      // minimum confidence % to show recommendations
  maxPositions: number;              // maximum number of positions to track
  preferredCommittees: string[];    // committees to prioritize
  riskTolerance: 'low' | 'medium' | 'high';
  notificationEnabled: boolean;      // whether to show notifications
};
