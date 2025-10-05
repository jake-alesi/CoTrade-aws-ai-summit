from flask import Flask, jsonify
from flask_cors import CORS
from trades_scraper import scrape_recent
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

def convert_to_frontend_format(df):
    """Convert scraped data to frontend Trade format"""
    trades = []
    for _, row in df.iterrows():
        # Parse dates
        try:
            if pd.notna(row.get('traded_date')):
                # Convert date format to ISO
                traded_date = pd.to_datetime(row['traded_date']).isoformat() + 'Z'
            else:
                traded_date = datetime.now().isoformat() + 'Z'
        except:
            traded_date = datetime.now().isoformat() + 'Z'
        
        # Extract chamber from politician string
        politician = str(row.get('politician', ''))
        chamber = 'House' if 'House' in politician else 'Senate' if 'Senate' in politician else None
        
        # Clean politician name
        member_name = politician.replace('Republican', '').replace('Democrat', '').replace('House', '').replace('Senate', '').strip()
        
        # Extract ticker from issuer
        issuer = str(row.get('issuer', ''))
        ticker_match = issuer.split(':')[0] if ':' in issuer else issuer.split()[-1] if issuer else 'UNKNOWN'
        
        trade = {
            "id": f"scraped_{row.name}",
            "timestamp": traded_date,
            "member": member_name,
            "chamber": chamber,
            "ticker": ticker_match,
            "company": issuer,
            "type": "purchase" if str(row.get('transaction_type', '')).lower() == 'buy' else "sale",
            "amountText": str(row.get('amount_range', 'Unknown')),
            "committees": [],  # Would need committee data integration
            "description": f"{row.get('transaction_type', 'Trade')} of {issuer}",
            "source": "Capitol Trades Scraper"
        }
        trades.append(trade)

    print(trades)
    
    return trades

@app.route('/api/trades')
def get_trades():
    try:
        # Scrape recent trades
        df = scrape_recent(page=1)
        
        if df.empty:
            return jsonify({
                "trades": [],
                "message": "No trades found",
                "success": False,
                "count": 0
            })
        
        # Convert to frontend format
        trades = convert_to_frontend_format(df)
        
        return jsonify({
            "trades": trades,
            "message": f"Successfully scraped {len(trades)} trades",
            "success": True,
            "count": len(trades)
        })
        
    except Exception as e:
        return jsonify({
            "trades": [],
            "message": f"Error scraping trades: {str(e)}",
            "success": False,
            "count": 0
        })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)