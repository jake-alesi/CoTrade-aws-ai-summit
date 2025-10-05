# pip install requests beautifulsoup4 lxml pandas
import re, time, random, requests, pandas as pd
from bs4 import BeautifulSoup


URL = "https://www.capitoltrades.com/trades"


SESSION = requests.Session()
SESSION.headers.update({
   # realistic desktop UA + accept headers
   "User-Agent": (
       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
       "AppleWebKit/537.36 (KHTML, like Gecko) "
       "Chrome/120.0.0.0 Safari/537.36"
   ),
   "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
   "Accept-Language": "en-US,en;q=0.9",
   "Cache-Control": "no-cache",
   "Pragma": "no-cache",
})


def fetch_html(url: str) -> str:
   r = SESSION.get(url, timeout=30)
   r.raise_for_status()
   return r.text


def plan_a_table(html: str):
   """
   Plan A: parse the main trades table (newest first) with pandas.
   """
   try:
       tables = pd.read_html(html)
   except ValueError:
       return None  # no tables found
   if not tables:
       return None


   # Heuristic: pick the first table that contains the expected column names
   want = {"Politician", "Traded Issuer", "Published", "Traded", "Owner", "Type", "Size"}
   for df in tables:
       cols = {c.strip() for c in df.columns.astype(str)}
       if want.issubset(cols):
           out = df.rename(columns={
               "Politician": "politician",
               "Traded Issuer": "issuer",
               "Published": "published_date",
               "Traded": "traded_date",
               "Owner": "owner",
               "Type": "transaction_type",
               "Size": "amount_range",
               "Price": "reported_price",
           })
           out["source"] = URL
           return out
   return None


def plan_b_cards(html: str):
   """
   Plan B: parse card blocks around "Goto trade detail page." anchors.
   """
   soup = BeautifulSoup(html, "lxml")
   rows = []
   # Find the anchors and walk up to a container that also has h2 (politician) & h3 (issuer)
   for a in soup.find_all("a", string=re.compile(r"Goto trade detail page", re.I)):
       card = a
       # climb a few levels to find a block with h2 + h3
       for _ in range(6):
           if not card: break
           if card.find("h2") and card.find("h3"):
               break
           card = card.parent
       if not card:
           continue


       def text(el):
           return re.sub(r"\s+", " ", el.get_text(strip=True)) if el else ""


       pol = text(card.find("h2")) or None
       issuer = text(card.find("h3")) or None
       block = text(card)


       # ticker like "MSFT:US" or "(MSFT)"
       m_ticker = re.search(r"\b([A-Z]{1,6}):US\b", block) or re.search(r"\(([A-Z]{1,6})\)", block)
       ticker = m_ticker.group(1) if m_ticker else None


       # two dates appear as Published, then Traded (per page order)
       date_tokens = re.findall(r"\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b", block)
       published = date_tokens[0][0] if len(date_tokens) >= 1 else None
       traded = date_tokens[1][0] if len(date_tokens) >= 2 else None


       m_owner = re.search(r"\b(Spouse|Self|Joint|Undisclosed)\b", block, re.I)
       owner = m_owner.group(1).title() if m_owner else None


       m_type = re.search(r"\b(buy|sell|exchange)\b", block, re.I)
       tx_type = m_type.group(1).title() if m_type else None


       m_size = re.search(r"\b(\$?\d[\d,]*\s*[–-]\s*\$?\d[\d,]*|1K–15K|15K–50K|50K–100K|100K–250K|250K–500K|500K–1M|Over 1M)\b", block)
       size = m_size.group(1) if m_size else None


       m_price = re.search(r"\$\d[\d,]*\.?\d*", block)
       price = m_price.group(0) if m_price else None


       rows.append({
           "politician": pol,
           "issuer": issuer,
           "ticker": ticker,
           "published_date": published,
           "traded_date": traded,
           "owner": owner,
           "transaction_type": tx_type,
           "amount_range": size,
           "reported_price": price,
           "source": URL
       })


   return pd.DataFrame(rows) if rows else None


def scrape_recent(page: int = 1, delay_s: float = 0):
   url = URL if page == 1 else f"{URL}?page={page}"
   html = fetch_html(url)


   # Quick sanity check: ensure the page actually contains trades
   if "Goto trade detail page" not in html and "Politician" not in html:
       # Some edges briefly serve a "Loading..." shell; retry once after a short delay.
       time.sleep(1.5)
       html = fetch_html(url)


   df = plan_a_table(html)
   if df is None or df.empty:
       df = plan_b_cards(html)


   return df if df is not None else pd.DataFrame()


def write_to_csv(page: int = 5):
   df = scrape_recent(page=5)
   if df.empty:
       print("Still no rows — you may be hitting a CDN edge that returns a JS shell. Try again or VPN.")
   else:
       print(f"Parsed {len(df)} rows from the latest page.")
       df.to_csv("recent_congress_trades.csv", index=False)
       print(df.head(5).to_string(index=False))


if __name__ == "__main__":
    print("Testing trades scraper...")
    write_to_csv()
