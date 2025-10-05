from flask import Flask, jsonify
from flask_cors import CORS
from trades_scraper import scrape_recent
import pandas as pd
from datetime import datetime
import csv
from collections import defaultdict
import openai
import os

app = Flask(__name__)
CORS(app)

# Load person_committees.csv
person_committees = defaultdict(list)
person_chamber = {}
with open("person_committees.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row["Person"]
        committees = [c.strip() for c in row["Committees"].split(",") if c.strip()]
        person_committees[name] = committees
        person_chamber[name] = row.get("Chamber", "")

# OpenAI key
openai.api_key = os.getenv("OPENAI_API_KEY")

def score_trade_with_llm(trade):
    """Call LLM to score trade"""
    member = trade["member"]
    ticker = trade["ticker"]
    company = trade["company"]
    committees = person_committees.get(member, [])
    chamber = person_chamber.get(member, "")

    prompt = f"""
You are a stock trading analysis engine. You are given a trade by a member of Congress:

Member: {member}
Chamber: {chamber}
Company: {company}
Ticker: {ticker}
Committees: {', '.join(committees)}

Score this trade according to:
1. committee_alignment (0-10)
2. past_year_portfolio_performance (0-10)
3. committee_role (0-10)
Return a weighted average:
committee_alignment=50%, past_year_portfolio_performance=30%, committee_role=20%
Return only JSON with fields:
weighted_average, committee_alignment, past_year_portfolio_performance, committee_role, matched_committee
"""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert financial and political analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        content = response.choices[0].message["content"]
        import json
        result = json.loads(content)
    except Exception as e:
        result = {
            "weighted_average": None,
            "committee_alignment": None,
            "past_year_portfolio_performance": None,
            "committee_role": None,
            "matched_committee": None
        }

    # Add basic info
    result.update({"member": member, "ticker": ticker, "company": company})
    return result

def convert_to_frontend_format(df):
    """Convert scraped data to frontend Trade format"""
    trades = []
    for _, row in df.iterrows():
        try:
            if pd.notna(row.get('traded_date')):
                traded_date = pd.to_datetime(row['traded_date']).isoformat() + 'Z'
            else:
                traded_date = datetime.now().isoformat() + 'Z'
        except:
            traded_date = datetime.now().isoformat() + 'Z'

        politician = str(row.get('politician', ''))
        chamber = 'House' if 'House' in politician else 'Senate' if 'Senate' in politician else None
        member_name = politician.replace('Republican', '').replace('Democrat', '').replace('House', '').replace('Senate', '').strip()
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
            "committees": person_committees.get(member_name, []),
            "description": f"{row.get('transaction_type', 'Trade')} of {issuer}",
            "source": "Capitol Trades Scraper"
        }
        trades.append(trade)
    return trades

@app.route('/api/trades')
def get_trades():
    try:
        df = scrape_recent(page=1)
        if df.empty:
            return jsonify({
                "trades": [],
                "message": "No trades found",
                "success": False,
                "count": 0
            })

        trades = convert_to_frontend_format(df)

        # Score trades via LLM
        enriched_trades = []
        for trade in trades:
            score = score_trade_with_llm(trade)
            trade.update({"analysis": score})
            enriched_trades.append(trade)

        return jsonify({
            "trades": enriched_trades,
            "message": f"Successfully scraped and scored {len(trades)} trades",
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