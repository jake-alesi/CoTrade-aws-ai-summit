import { Trade } from './types';

export const SAMPLE_TRADES: Trade[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    member: 'Nancy Pelosi',
    chamber: 'House',
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    type: 'purchase',
    amountMin: 50000,
    amountMax: 100000,
    amountText: '$50K-$100K',
    committees: ['Science, Space, and Technology'],
    description: 'Purchase of NVIDIA stock',
    source: 'Capitol Trades'
  },
  {
    id: '2',
    timestamp: '2024-01-14T14:20:00Z',
    member: 'Josh Hawley',
    chamber: 'Senate',
    ticker: 'TSLA',
    company: 'Tesla, Inc.',
    type: 'sale',
    amountMin: 15000,
    amountMax: 50000,
    amountText: '$15K-$50K',
    committees: ['Commerce, Science, and Transportation'],
    description: 'Sale of Tesla stock',
    source: 'Capitol Trades'
  },
  {
    id: '3',
    timestamp: '2024-01-13T09:15:00Z',
    member: 'Alexandria Ocasio-Cortez',
    chamber: 'House',
    ticker: 'AAPL',
    company: 'Apple Inc.',
    type: 'purchase',
    amountMin: 1000,
    amountMax: 15000,
    amountText: '$1K-$15K',
    committees: ['Financial Services'],
    description: 'Purchase of Apple stock',
    source: 'Capitol Trades'
  },
  {
    id: '4',
    timestamp: '2024-01-12T16:45:00Z',
    member: 'Ted Cruz',
    chamber: 'Senate',
    ticker: 'META',
    company: 'Meta Platforms, Inc.',
    type: 'purchase',
    amountMin: 25000,
    amountMax: 50000,
    amountText: '$25K-$50K',
    committees: ['Judiciary', 'Commerce, Science, and Transportation'],
    description: 'Purchase of Meta stock',
    source: 'Capitol Trades'
  },
  {
    id: '5',
    timestamp: '2024-01-11T11:30:00Z',
    member: 'Marco Rubio',
    chamber: 'Senate',
    ticker: 'GOOGL',
    company: 'Alphabet Inc.',
    type: 'sale_full',
    amountMin: 100000,
    amountMax: 250000,
    amountText: '$100K-$250K',
    committees: ['Foreign Relations', 'Intelligence'],
    description: 'Full sale of Alphabet stock',
    source: 'Capitol Trades'
  }
];
