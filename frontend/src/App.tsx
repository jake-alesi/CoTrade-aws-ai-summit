import { useState, useEffect } from 'react';
import { Trade, Analysis, UserPreferences } from './types';
import { analyzeTrade } from './engine';
import { usePoll } from './usePoll';
import { SAMPLE_TRADES } from './sample';
import './style.css';

function TradeCard({ trade, analysis, preferences }: { trade: Trade; analysis: Analysis; preferences: UserPreferences }) {
  const getBadgeClass = (decision: string) => {
    switch (decision) {
      case 'BUY': return 'badge ok';
      case 'SKIP': return 'badge warn';
      default: return 'badge';
    }
  };

  return (
    <div className="card trade">
      <div>
        <div className="title">{trade.member}</div>
        <div className="small">{trade.chamber} • {new Date(trade.timestamp).toLocaleDateString()}</div>
        
        <div className="kv">
          <span>Stock:</span>
          <span>{trade.ticker} ({trade.company})</span>
        </div>
        
        <div className="kv">
          <span>Type:</span>
          <span>{trade.type}</span>
        </div>
        
        {trade.amountText && (
          <div className="kv">
            <span>Amount:</span>
            <span>{trade.amountText}</span>
          </div>
        )}
        
        {trade.committees && trade.committees.length > 0 && (
          <div className="kv">
            <span>Committees:</span>
            <span>{trade.committees.join(', ')}</span>
          </div>
        )}
        
        {analysis.matchedCommittee && (
          <div className="kv">
            <span>Matched:</span>
            <span>{analysis.matchedCommittee}</span>
          </div>
        )}
        
        {preferences.budget && trade.amountMin && trade.amountMax && (
          <div className="kv">
            <span>Budget Fit:</span>
            <span style={{ color: (trade.amountMax <= preferences.budget) ? 'var(--ok)' : 'var(--bad)' }}>
              {trade.amountMax <= preferences.budget ? 'Within Budget' : 'Over Budget'}
            </span>
          </div>
        )}
        
        {preferences.preferredCommittees.length > 0 && trade.committees && (
          <div className="kv">
            <span>Preferred:</span>
            <span style={{ color: trade.committees.some(c => preferences.preferredCommittees.includes(c)) ? 'var(--ok)' : 'var(--muted)' }}>
              {trade.committees.some(c => preferences.preferredCommittees.includes(c)) ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>
      
      <div className={getBadgeClass(analysis.decision)}>
        {analysis.decision} ({analysis.confidence}%)
      </div>
    </div>
  );
}

function UserPreferencesPanel({ preferences, setPreferences }: { 
  preferences: UserPreferences; 
  setPreferences: (prefs: UserPreferences) => void; 
}) {
  const handleChange = (field: keyof UserPreferences, value: any) => {
    setPreferences({ ...preferences, [field]: value });
  };

  return (
    <div className="card">
      <div className="title">Your Preferences</div>
      <div className="sep"></div>
      
      <div className="kv">
        <span>Budget:</span>
        <input
          className="input"
          type="number"
          placeholder="10000"
          value={preferences.budget || ''}
          onChange={(e) => handleChange('budget', parseInt(e.target.value) || 0)}
        />
      </div>
      
      <div className="kv">
        <span>Confidence Threshold:</span>
        <input
          className="input"
          type="number"
          min="0"
          max="100"
          placeholder="60"
          value={preferences.confidenceThreshold || ''}
          onChange={(e) => handleChange('confidenceThreshold', parseInt(e.target.value) || 60)}
        />
      </div>
      
      <div className="kv">
        <span>Max Positions:</span>
        <input
          className="input"
          type="number"
          min="1"
          max="20"
          placeholder="5"
          value={preferences.maxPositions || ''}
          onChange={(e) => handleChange('maxPositions', parseInt(e.target.value) || 5)}
        />
      </div>
      
      <div className="kv">
        <span>Risk Tolerance:</span>
        <select
          className="input"
          value={preferences.riskTolerance}
          onChange={(e) => handleChange('riskTolerance', e.target.value as 'low' | 'medium' | 'high')}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      
      <div className="kv">
        <span>Preferred Committees:</span>
        <input
          className="input"
          type="text"
          placeholder="Energy and Commerce, Financial Services"
          value={preferences.preferredCommittees.join(', ')}
          onChange={(e) => handleChange('preferredCommittees', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        />
      </div>
      
      <div className="kv">
        <span>Notifications:</span>
        <input
          type="checkbox"
          checked={preferences.notificationEnabled}
          onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
        />
      </div>
    </div>
  );
}

function NotificationPanel({ trades, analyses, preferences }: { 
  trades: Trade[]; 
  analyses: Analysis[]; 
  preferences: UserPreferences;
}) {
  const buyTrades = trades.filter((_, i) => analyses[i]?.decision === 'BUY');
  
  if (!preferences.notificationEnabled) {
    return (
      <div className="card notice">
        <div className="title">Notifications Disabled</div>
        <div className="small">Enable notifications in your preferences to see trade alerts.</div>
      </div>
    );
  }
  
  if (buyTrades.length === 0) {
    return (
      <div className="card notice">
        <div className="title">No Buy Recommendations</div>
        <div className="small">No trades meet your criteria for buy recommendations at this time.</div>
      </div>
    );
  }

  return (
    <div className="card notice">
      <div className="title">🚨 Trade Alerts ({buyTrades.length})</div>
      <div className="small">Members with committee alignment are trading relevant stocks</div>
      
      {buyTrades.map((trade) => {
        const analysis = analyses[trades.indexOf(trade)];
        return (
          <div key={trade.id} style={{ marginTop: '8px' }}>
            <div className="small">
              <strong>{trade.member}</strong> bought {trade.ticker} 
              {analysis.matchedCommittee && ` (${analysis.matchedCommittee})`}
            </div>
            <div className="small" style={{ color: 'var(--muted)' }}>
              Confidence: {analysis.confidence}% • {trade.amountText}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [feedUrl, setFeedUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [useSample, setUseSample] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    budget: 10000,
    confidenceThreshold: 60,
    maxPositions: 5,
    preferredCommittees: ['Energy and Commerce', 'Financial Services'],
    riskTolerance: 'medium',
    notificationEnabled: true
  });
  
  const feedUrlFromEnv = import.meta.env.VITE_TRADES_FEED_URL;
  const defaultBackendUrl = 'http://localhost:5001/api/trades';
  const { data: polledData, loading, error } = usePoll({ 
    url: feedUrl || feedUrlFromEnv || defaultBackendUrl,
    enabled: !useSample
  });

  useEffect(() => {
    if (useSample) {
      setTrades(SAMPLE_TRADES);
    } else if (polledData.length > 0) {
      setTrades(polledData);
    }
  }, [useSample, polledData]);

  useEffect(() => {
    if (trades.length > 0) {
      const newAnalyses = trades.map(trade => analyzeTrade(trade, undefined, preferences));
      setAnalyses(newAnalyses);
    }
  }, [trades, preferences]);

  const handleJsonSubmit = () => {
    try {
      const parsedTrades: Trade[] = JSON.parse(jsonInput);
      setTrades(parsedTrades);
      setUseSample(false);
    } catch (err) {
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="h1">Congress Trade Notifier</h1>
        <div className="row">
          <button 
            className="button" 
            onClick={() => setUseSample(!useSample)}
          >
            {useSample ? 'Use Backend API' : 'Use Sample Data'}
          </button>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="card">
            <div className="title">Data Source</div>
            <div className="sep"></div>
            
            {useSample ? (
              <div>
                <div className="small">Using sample data</div>
                <button className="button" onClick={() => setUseSample(false)}>
                  Switch to Backend API
                </button>
              </div>
            ) : (
              <div>
                <div className="small">Using Flask backend API (http://localhost:5002/api/trades)</div>
                <div className="small" style={{ marginTop: '8px' }}>
                  Or enter custom URL:
                </div>
                <input
                  className="input"
                  type="url"
                  placeholder="Enter custom trades feed URL"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                />
                <div className="small" style={{ marginTop: '8px' }}>
                  Or paste JSON data below:
                </div>
                <textarea
                  className="input"
                  placeholder="Paste JSON trades array here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={4}
                />
                <button className="button" onClick={handleJsonSubmit}>
                  Load JSON Data
                </button>
              </div>
            )}
            
            {loading && <div className="small">Loading...</div>}
            {error && <div className="small" style={{ color: 'var(--bad)' }}>Error: {error}</div>}
          </div>

          <UserPreferencesPanel preferences={preferences} setPreferences={setPreferences} />
          
          <NotificationPanel trades={trades} analyses={analyses} preferences={preferences} />
        </div>

        <div>
          <div className="card">
            <div className="title">Recent Trades ({trades.length})</div>
            <div className="sep"></div>
            
            {trades.length === 0 ? (
              <div className="small">No trades loaded</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trades.map((trade, i) => (
                  <TradeCard 
                    key={trade.id} 
                    trade={trade} 
                    analysis={analyses[i] || { decision: 'SKIP', confidence: 0, rationale: [] }}
                    preferences={preferences}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
