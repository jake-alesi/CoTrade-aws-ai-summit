import { Analysis, Context, Trade, UserPreferences } from './types';

const DEFAULT_CONTEXT: Context = {
  committeeKeywords: {
    'Energy and Commerce': ['energy', 'oil', 'gas', 'utilities', 'telecom', 'pharma', 'biotech', 'health'],
    'Financial Services': ['bank', 'fintech', 'insurance', 'asset', 'broker', 'exchange', 'payment'],
    'Armed Services': ['defense', 'aerospace', 'military', 'weapons', 'contractor'],
    'Agriculture': ['agri', 'farm', 'crop', 'fertilizer', 'food'],
    'Transportation and Infrastructure': ['airline', 'rail', 'shipping', 'logistics', 'infrastructure', 'autonomous'],
    'Judiciary': ['legal', 'antitrust', 'litigation', 'privacy'],
    'Homeland Security': ['cyber', 'surveillance', 'security', 'border'],
    'Science, Space, and Technology': ['semiconductor', 'chip', 'ai', 'software', 'space', 'satellite', 'cloud'],
    'Health, Education, Labor, and Pensions': ['health', 'biotech', 'education', 'workforce']
  },
  companyDeals: {}
};

function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }

export function analyzeTrade(trade: Trade, ctx?: Partial<Context>, preferences?: UserPreferences): Analysis {
  const context = { ...DEFAULT_CONTEXT, ...ctx };
  const rationale: string[] = [];
  let confidence = 50; // base confidence
  let matchedCommittee: string | null = null;

  // Check committee alignment
  if (trade.committees && trade.committees.length > 0) {
    for (const committee of trade.committees) {
      const keywords = context.committeeKeywords[committee] || [];
      const companyName = (trade.company || '').toLowerCase();
      const ticker = trade.ticker.toLowerCase();
      
      const hasKeywordMatch = keywords.some(keyword => 
        companyName.includes(keyword) || ticker.includes(keyword)
      );
      
      if (hasKeywordMatch) {
        matchedCommittee = committee;
        confidence += 25;
        rationale.push(`Committee alignment: ${committee} member trading in relevant sector`);
        
        // Bonus for preferred committees
        if (preferences?.preferredCommittees?.includes(committee)) {
          confidence += 15;
          rationale.push(`Preferred committee: ${committee}`);
        }
        break;
      }
    }
  }

  // Check trade type
  if (trade.type === 'purchase') {
    confidence += 15;
    rationale.push('Purchase signal: Member buying stock');
  } else if (trade.type === 'sale' || trade.type === 'sale_full') {
    confidence -= 10;
    rationale.push('Sale signal: Member selling stock');
  }

  // Check amount size (if available)
  if (trade.amountMin && trade.amountMax) {
    const avgAmount = (trade.amountMin + trade.amountMax) / 2;
    if (avgAmount > 100000) {
      confidence += 10;
      rationale.push('Large trade size indicates confidence');
    } else if (avgAmount < 10000) {
      confidence -= 5;
      rationale.push('Small trade size may indicate uncertainty');
    }
    
    // Check against user budget
    if (preferences?.budget && avgAmount > preferences.budget) {
      confidence -= 20;
      rationale.push(`Trade amount ($${avgAmount.toLocaleString()}) exceeds budget ($${preferences.budget.toLocaleString()})`);
    }
  }

  // Check for recent activity (simplified)
  const tradeDate = new Date(trade.timestamp);
  const daysSinceTrade = (Date.now() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceTrade < 7) {
    confidence += 5;
    rationale.push('Recent trade activity');
  }

  // Risk tolerance adjustments
  if (preferences?.riskTolerance) {
    switch (preferences.riskTolerance) {
      case 'low':
        confidence -= 10;
        rationale.push('Conservative risk tolerance applied');
        break;
      case 'high':
        confidence += 5;
        rationale.push('Aggressive risk tolerance applied');
        break;
    }
  }

  // Decision logic with user threshold
  const threshold = preferences?.confidenceThreshold || 60;
  const decision = confidence >= threshold ? 'BUY' : 'SKIP';
  
  if (decision === 'SKIP') {
    if (confidence < threshold) {
      rationale.push(`Confidence (${confidence}%) below threshold (${threshold}%)`);
    } else {
      rationale.push('Insufficient confidence for recommendation');
    }
  }

  return {
    decision,
    confidence: clamp(confidence),
    rationale,
    matchedCommittee
  };
}
