"""
Stock Portfolio Monitor — Agent Core
-------------------------------------
ReAct agent runner + all 7 tools + Gemini client setup.
Pattern follows Advanced Module 4 (run_agent / tool_map / tool_schema).
"""

import os, json, time, re, random
from typing import Any, Dict, List, Optional, Union

try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover - depends on environment
    genai = None

    class _FallbackSchema:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    class _FallbackTypes:
        Type = type('Type', (), {'OBJECT': 'OBJECT', 'STRING': 'STRING', 'NUMBER': 'NUMBER'})
        Schema = _FallbackSchema
        Part = _FallbackSchema
        Content = _FallbackSchema
        FunctionDeclaration = _FallbackSchema
        FunctionResponse = _FallbackSchema
        GenerateContentConfig = _FallbackSchema
        Tool = _FallbackSchema

    types = _FallbackTypes()

# ── Simulated Market Data ──────────────────────────────────────────────────
STOCK_DATA = {
    'AAPL':     {'price': 213.55, 'prev_close': 209.80, 'name': 'Apple Inc.',           'currency': 'USD'},
    'TSLA':     {'price': 248.23, 'prev_close': 261.50, 'name': 'Tesla Inc.',            'currency': 'USD'},
    'NVDA':     {'price': 137.58, 'prev_close': 131.20, 'name': 'NVIDIA Corp.',          'currency': 'USD'},
    'GOOGL':    {'price': 192.45, 'prev_close': 188.90, 'name': 'Alphabet Inc.',         'currency': 'USD'},
    'MSFT':     {'price': 473.89, 'prev_close': 468.20, 'name': 'Microsoft Corp.',       'currency': 'USD'},
    'AMZN':     {'price': 215.34, 'prev_close': 220.10, 'name': 'Amazon.com Inc.',       'currency': 'USD'},
    'META':     {'price': 589.12, 'prev_close': 578.40, 'name': 'Meta Platforms',        'currency': 'USD'},
    'RELIANCE': {'price': 2387.45,'prev_close': 2415.30,'name': 'Reliance Industries',   'currency': 'INR'},
    'INFY':     {'price': 1876.20,'prev_close': 1850.10,'name': 'Infosys Ltd.',          'currency': 'INR'},
    'TCS':      {'price': 4123.50,'prev_close': 4089.20,'name': 'TCS Ltd.',              'currency': 'INR'},
    'HDFCBANK': {'price': 1892.35,'prev_close': 1920.00,'name': 'HDFC Bank Ltd.',        'currency': 'INR'},
    'WIPRO':    {'price': 542.70, 'prev_close': 538.00, 'name': 'Wipro Ltd.',            'currency': 'INR'},
}

STOCK_NEWS = {
    'AAPL': [
        "Apple's Vision Pro 2 sales surpass analyst expectations in H1 2025",
        "Apple faces EU antitrust fine over App Store exclusivity policies",
        "iPhone 17 Pro leaked specs reveal periscope zoom and all-titanium build",
    ],
    'TSLA': [
        "Tesla Q2 delivery numbers disappoint, missing Wall Street estimates by 15%",
        "Elon Musk postpones Robotaxi launch again, citing regulatory hurdles",
        "Tesla energy storage division posts record $3.2B revenue quarter",
    ],
    'NVDA': [
        "NVIDIA secures $10B US government AI infrastructure contract",
        "NVIDIA H200 GPU demand remains severely oversubscribed into Q4",
        "New US export controls may significantly restrict NVIDIA chip sales to China",
    ],
    'GOOGL': [
        "Google DeepMind launches Gemini Ultra 3 with 10M context window",
        "Alphabet ad revenue grows 12% YoY as Cloud division surges 28%",
        "DOJ antitrust ruling could force Google to divest Chrome browser",
    ],
    'MSFT': [
        "Microsoft Copilot AI drives record Azure growth, revenue up 23% YoY",
        "Microsoft gaming division struggles post-Activision amid studio closures",
        "Windows 12 leak suggests major AI-first redesign launching late 2025",
    ],
    'AMZN': [
        "Amazon AWS secures Pentagon JEDI 2.0 cloud contract worth $22B",
        "Amazon Prime membership crosses 250 million globally, ad tier growing fast",
        "Amazon logistics costs surge 8% amid fuel prices and labor contract disputes",
    ],
    'META': [
        "Meta AI assistant reaches 1 billion monthly active users across apps",
        "Meta Quest 4 pre-orders outpace Vision Pro launch week in 48 hours",
        "FTC renews antitrust inquiry into Meta's Instagram and WhatsApp acquisitions",
    ],
    'RELIANCE': [
        "Reliance Jio subscribers cross 500 million; ARPU improves 18% YoY",
        "Reliance Retail to expand into Southeast Asia with 500 new stores",
        "Mukesh Ambani pledges ₹75,000 crore in green energy over 5 years",
    ],
    'INFY': [
        "Infosys raises FY26 revenue guidance to 4.5–6.5% amid AI deal wins",
        "Infosys secures $1.5B AI transformation deal with a major European bank",
        "Infosys attrition spikes to 14.2% as mid-level talent migrates to startups",
    ],
    'TCS': [
        "TCS bags $2B deal from UK government for digital infrastructure overhaul",
        "TCS Q1 FY26 net profit up 9% to ₹12,760 crore, beats estimates",
        "TCS plans 40,000 fresher hires this fiscal, citing surging AI services demand",
    ],
    'HDFCBANK': [
        "HDFC Bank net interest margin expands to 4.2%, beating analyst forecasts",
        "RBI issues clean chit to HDFC Bank after 18-month compliance audit",
        "HDFC Bank plans ₹50,000 crore bond raise for infrastructure lending book",
    ],
    'WIPRO': [
        "Wipro wins $900M IT modernisation deal from global insurance giant",
        "Wipro Q1 FY26 revenue misses guidance; management cites macro headwinds",
        "Wipro restructures AI division, poaches 200 engineers from Big Tech",
    ],
}

def _default_news(ticker):
    return [
        f"{ticker} reports mixed quarterly results amid global market volatility",
        f"Analysts revise {ticker} price target following broader sector rotation",
        f"{ticker} management signals cautious outlook for next two quarters",
    ]

# ── Portfolio Parsing & Offline Analysis ────────────────────────────────

def parse_portfolio_input(raw_input: Union[str, List[Dict[str, Any]], Dict[str, Any], None]) -> List[Dict[str, Any]]:
    """Parse portfolio input from plain text, a list of holdings, or a dict payload."""
    if raw_input is None:
        return []

    if isinstance(raw_input, list):
        return [
            {
                'ticker': str(item.get('ticker', '')).upper(),
                'quantity': float(item.get('quantity', 0) or item.get('shares', 0) or 0),
                'avg_buy_price': float(item.get('avg_buy_price', 0) or item.get('buy_price', 0) or 0),
            }
            for item in raw_input
            if item.get('ticker')
        ]

    if isinstance(raw_input, dict):
        holdings = raw_input.get('holdings', raw_input.get('portfolio', []))
        if isinstance(holdings, list):
            return parse_portfolio_input(holdings)
        return []

    text = str(raw_input).strip()
    if not text:
        return []

    if text.startswith('[') or text.startswith('{'):
        try:
            parsed = json.loads(text)
            return parse_portfolio_input(parsed)
        except Exception:
            return []

    matches = re.findall(r'([A-Za-z0-9.-]+)\s*([0-9.]+)\s*@\s*([0-9.]+)', text)
    if matches:
        return [
            {'ticker': ticker.upper(), 'quantity': float(quantity), 'avg_buy_price': float(price)}
            for ticker, quantity, price in matches
        ]

    # Fallback: simple comma-separated forms like "AAPL 10 @ 200"
    holdings = []
    for chunk in re.split(r'[,;]+', text):
        chunk = chunk.strip()
        if not chunk:
            continue
        pieces = chunk.replace('shares', '').replace('units', '').split()
        if len(pieces) >= 3:
            ticker = pieces[0].upper()
            try:
                quantity = float(pieces[1])
                price = float(pieces[-1])
                holdings.append({'ticker': ticker, 'quantity': quantity, 'avg_buy_price': price})
            except ValueError:
                continue
    return holdings


def _fallback_sentiment(ticker: str, headline: str) -> dict:
    text = headline.lower()
    if any(word in text for word in ['record', 'surpass', 'beats', 'wins', 'grows', 'secure', 'strong', 'boost', 'up']):
        return {'ticker': ticker, 'headline': headline, 'sentiment': 'BULLISH', 'score': 0.65, 'reason': 'Positive phrasing and growth-oriented language.'}
    if any(word in text for word in ['miss', 'disappoint', 'fails', 'antitrust', 'fine', 'regulatory', 'struggles', 'headwinds', 'costs surge', 'delays']):
        return {'ticker': ticker, 'headline': headline, 'sentiment': 'BEARISH', 'score': -0.65, 'reason': 'Negative phrasing and downside risk signals.'}
    return {'ticker': ticker, 'headline': headline, 'sentiment': 'NEUTRAL', 'score': 0.0, 'reason': 'Balanced market news with no clear directional cue.'}


def analyze_portfolio(holdings: Union[str, List[Dict[str, Any]], Dict[str, Any], None] = None, threshold_pct: float = 5.0, use_ai: bool = False) -> Dict[str, Any]:
    """Run a complete portfolio analysis with zero-cost local heuristics by default."""
    parsed_holdings = parse_portfolio_input(holdings)
    if not parsed_holdings:
        return {
            'portfolio_value': 0.0,
            'total_pnl': 0.0,
            'positions': [],
            'alerts': [],
            'recommendations': ['Add at least one holding to start monitoring.'],
        }

    positions = []
    alerts = []
    total_value = 0.0
    total_pnl = 0.0

    for holding in parsed_holdings:
        ticker = str(holding.get('ticker', '')).upper()
        quantity = float(holding.get('quantity', 0) or 0)
        avg_buy_price = float(holding.get('avg_buy_price', 0) or 0)

        price_info = get_stock_price(ticker)
        pnl_info = calculate_pnl(ticker, quantity, avg_buy_price, price_info['price'])
        news_info = get_financial_news(ticker)
        sentiment_results = []
        if use_ai:
            sentiment_results = [score_news_sentiment(ticker, headline) for headline in news_info['headlines']]
        else:
            sentiment_results = [_fallback_sentiment(ticker, headline) for headline in news_info['headlines']]
        risk_info = flag_risk(ticker, pnl_info['pnl_pct'], threshold_pct)

        if risk_info['risk_level'] == 'HIGH_RISK':
            alerts.append(send_alert(ticker, pnl_info['pnl_pct'], threshold_pct, risk_info['message']))

        position_summary = {
            'ticker': ticker,
            'quantity': quantity,
            'avg_buy_price': avg_buy_price,
            'current_price': price_info['price'],
            'change_pct': price_info['change_pct'],
            'invested': pnl_info['invested'],
            'current_value': pnl_info['current_value'],
            'pnl_abs': pnl_info['pnl_abs'],
            'pnl_pct': pnl_info['pnl_pct'],
            'risk_level': risk_info['risk_level'],
            'risk_message': risk_info['message'],
            'news': sentiment_results,
        }
        positions.append(position_summary)
        total_value += pnl_info['current_value']
        total_pnl += pnl_info['pnl_abs']

    bullish_count = sum(1 for position in positions for news in position['news'] if news['sentiment'] == 'BULLISH')
    bearish_count = sum(1 for position in positions for news in position['news'] if news['sentiment'] == 'BEARISH')
    high_risk_positions = [position for position in positions if position['risk_level'] == 'HIGH_RISK']

    recommendations = []
    if high_risk_positions:
        recommendations.append(f"Review {', '.join(p['ticker'] for p in high_risk_positions[:3])} immediately because they breach the loss threshold.")
    if bullish_count > bearish_count:
        recommendations.append('Maintain current exposure where news sentiment remains constructive.')
    else:
        recommendations.append('Trim or hedge weak positions if sentiment turns more negative.')
    recommendations.append('Use the alert modal to tune thresholds and receive timely notifications.')
    if use_ai:
        recommendations.append('AI sentiment scoring was enabled for this run.')
    else:
        recommendations.append('AI sentiment scoring is disabled to keep costs low.')

    return {
        'portfolio_value': round(total_value, 2),
        'total_pnl': round(total_pnl, 2),
        'positions': positions,
        'alerts': alerts,
        'recommendations': recommendations,
    }


def format_portfolio_summary(result: Dict[str, Any]) -> str:
    lines = [
        f"Portfolio value: ${result['portfolio_value']:.2f}",
        f"Total unrealised P&L: ${result['total_pnl']:.2f}",
    ]
    if result['positions']:
        lines.append('Positions:')
        for position in result['positions']:
            lines.append(f"- {position['ticker']}: {position['pnl_pct']:+.2f}% ({position['risk_level']})")
    if result['recommendations']:
        lines.append('Recommendations:')
        lines.extend(f"- {item}" for item in result['recommendations'])
    return '\n'.join(lines)

# ── Gemini Client (singleton) ──────────────────────────────────────────────
_gemini_client = None
GEMINI_MODEL = 'gemini-2.0-flash'

def get_client():
    global _gemini_client
    if _gemini_client is None:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client

# ── Shared Helpers (same pattern as Advanced Module 4) ─────────────────────
def _make_config(**kwargs):
    kwargs.setdefault('max_output_tokens', 2048)
    kwargs.setdefault('temperature', 0.2)
    return types.GenerateContentConfig(**kwargs)

def _extract_text(response) -> str:
    if response.text:
        return response.text.strip()
    parts = []
    for candidate in (response.candidates or []):
        if candidate.content:
            for part in candidate.content.parts:
                if not getattr(part, 'thought', False) and part.text:
                    parts.append(part.text)
    return ''.join(parts).strip()

def _call_with_retry(fn, *args, max_retries=4, **kwargs):
    for attempt in range(max_retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            msg = str(e)
            if '429' in msg or 'RESOURCE_EXHAUSTED' in msg:
                m = re.search(r'retry[^0-9]*([0-9]+)s', msg, re.I)
                wait = int(m.group(1)) + 5 if m else 35
                time.sleep(wait)
            elif '500' in msg or 'INTERNAL' in msg:
                time.sleep(10 * (attempt + 1))
            else:
                raise
    raise RuntimeError('Max retries exceeded')

# ── Tool Implementations ───────────────────────────────────────────────────

def get_stock_price(ticker: str) -> dict:
    """
    Return simulated live price with intraday noise.
    To use real data: replace body with yfinance.Ticker(ticker).fast_info
    """
    ticker = ticker.upper().strip()
    if ticker in STOCK_DATA:
        base = STOCK_DATA[ticker].copy()
    else:
        seed_price = round(random.uniform(50, 600), 2)
        base = {'price': seed_price, 'prev_close': round(seed_price * random.uniform(0.93, 1.07), 2),
                'name': ticker, 'currency': 'USD'}

    # Simulate intraday movement
    noise = random.uniform(-0.012, 0.012)
    price = round(base['price'] * (1 + noise), 2)
    prev  = base['prev_close']
    chg   = round((price - prev) / prev * 100, 2)

    # Build 20-point sparkline (minute-level simulation)
    spark = [prev]
    for _ in range(18):
        spark.append(round(spark[-1] * (1 + random.uniform(-0.005, 0.005)), 2))
    spark.append(price)

    return {
        'ticker':     ticker,
        'name':       base.get('name', ticker),
        'price':      price,
        'prev_close': prev,
        'change_pct': chg,
        'change_abs': round(price - prev, 2),
        'currency':   base.get('currency', 'USD'),
        'sparkline':  spark,
        'timestamp':  time.strftime('%H:%M:%S'),
    }


def calculate_pnl(ticker: str, quantity: float, avg_buy_price: float, current_price: float) -> dict:
    """Compute unrealised P&L for one holding."""
    ticker   = ticker.upper().strip()
    invested = round(quantity * avg_buy_price, 2)
    value    = round(quantity * current_price, 2)
    pnl_abs  = round(value - invested, 2)
    pnl_pct  = round((pnl_abs / invested) * 100, 2) if invested else 0.0
    return {
        'ticker':        ticker,
        'quantity':      quantity,
        'avg_buy_price': avg_buy_price,
        'current_price': current_price,
        'invested':      invested,
        'current_value': value,
        'pnl_abs':       pnl_abs,
        'pnl_pct':       pnl_pct,
    }


def get_financial_news(ticker: str) -> dict:
    """Return the latest 3 simulated news headlines for a ticker."""
    ticker = ticker.upper().strip()
    return {'ticker': ticker, 'headlines': STOCK_NEWS.get(ticker, _default_news(ticker))}


def score_news_sentiment(ticker: str, headline: str) -> dict:
    """Classify a headline as BULLISH / BEARISH / NEUTRAL using Gemini when available, otherwise a fast heuristic."""
    if not os.environ.get('GEMINI_API_KEY'):
        return _fallback_sentiment(ticker, headline)

    client = get_client()
    prompt = (
        f"Classify the investment sentiment of this financial news headline for the stock {ticker}.\n"
        f'Headline: "{headline}"\n\n'
        "Respond ONLY with a valid JSON object:\n"
        '{ "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL", '
        '"score": <float from -1.0 (very bearish) to +1.0 (very bullish)>, '
        '"reason": "<one concise sentence explaining why>" }'
    )
    try:
        response = _call_with_retry(
            client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=_make_config(temperature=0.1)
        )
        raw = _extract_text(response)
        raw = re.sub(r'^```[a-z]*\n?', '', raw.strip())
        raw = re.sub(r'\n?```$', '', raw.strip())
        parsed = json.loads(raw)
        return {
            'ticker':    ticker,
            'headline':  headline,
            'sentiment': parsed.get('sentiment', 'NEUTRAL'),
            'score':     float(parsed.get('score', 0.0)),
            'reason':    parsed.get('reason', ''),
        }
    except Exception as e:
        return {'ticker': ticker, 'headline': headline, 'sentiment': 'NEUTRAL', 'score': 0.0, 'reason': str(e)}


def flag_risk(ticker: str, pnl_pct: float, threshold_pct: float) -> dict:
    """Assign a risk level to a holding based on P&L vs user threshold."""
    ticker = ticker.upper().strip()
    if pnl_pct <= -threshold_pct:
        level   = 'HIGH_RISK'
        message = f"{ticker} is down {abs(pnl_pct):.2f}% — breaches your {threshold_pct}% alert threshold."
    elif pnl_pct <= -threshold_pct * 0.5:
        level   = 'MODERATE'
        message = f"{ticker} is down {abs(pnl_pct):.2f}% — approaching your {threshold_pct}% threshold."
    elif pnl_pct < 0:
        level   = 'WATCH'
        message = f"{ticker} is slightly negative at {pnl_pct:.2f}%."
    else:
        level   = 'SAFE'
        message = f"{ticker} is up {pnl_pct:.2f}% — performing well."
    return {
        'ticker':        ticker,
        'risk_level':    level,
        'pnl_pct':       pnl_pct,
        'threshold_pct': threshold_pct,
        'message':       message,
    }


def send_alert(ticker: str, pnl_pct: float, threshold_pct: float, message: str) -> dict:
    """
    Simulate sending an email/SMS alert.
    To use real alerts: integrate Twilio (SMS) or SendGrid (email) here.
    """
    ticker = ticker.upper().strip()
    return {
        'ticker':        ticker,
        'alert_sent':    True,
        'channels':      ['email', 'sms'],
        'pnl_pct':       pnl_pct,
        'threshold_pct': threshold_pct,
        'alert_message': (
            f"⚠️ ALERT: {ticker} has fallen {abs(pnl_pct):.2f}%, "
            f"breaching your {threshold_pct}% loss threshold. "
            "Immediate portfolio review recommended."
        ),
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'user_message': message,
    }

# ── Tool Registry & Schema ─────────────────────────────────────────────────

PORTFOLIO_TOOLS = {
    'get_stock_price':      get_stock_price,
    'calculate_pnl':        calculate_pnl,
    'get_financial_news':   get_financial_news,
    'score_news_sentiment': score_news_sentiment,
    'flag_risk':            flag_risk,
    'send_alert':           send_alert,
}

PORTFOLIO_SCHEMA = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name='get_stock_price',
        description='Fetch simulated live price, previous close, change %, and sparkline data for a ticker.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker'],
            properties={'ticker': types.Schema(type=types.Type.STRING,
                description='Stock ticker, e.g. AAPL, TSLA, NVDA, RELIANCE')}),
    ),
    types.FunctionDeclaration(
        name='calculate_pnl',
        description='Calculate unrealised P&L for a holding given current price. Returns pnl_abs and pnl_pct.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker','quantity','avg_buy_price','current_price'],
            properties={
                'ticker':        types.Schema(type=types.Type.STRING),
                'quantity':      types.Schema(type=types.Type.NUMBER, description='Shares/units held'),
                'avg_buy_price': types.Schema(type=types.Type.NUMBER, description='Average purchase price per share'),
                'current_price': types.Schema(type=types.Type.NUMBER, description='Current live price per share'),
            }),
    ),
    types.FunctionDeclaration(
        name='get_financial_news',
        description='Get the latest 3 financial news headlines for a stock ticker.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker'],
            properties={'ticker': types.Schema(type=types.Type.STRING)}),
    ),
    types.FunctionDeclaration(
        name='score_news_sentiment',
        description='Use AI to classify a single news headline as BULLISH, BEARISH, or NEUTRAL with a score from -1.0 to +1.0.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker','headline'],
            properties={
                'ticker':   types.Schema(type=types.Type.STRING),
                'headline': types.Schema(type=types.Type.STRING, description='The news headline to analyse'),
            }),
    ),
    types.FunctionDeclaration(
        name='flag_risk',
        description='Flag a stock as HIGH_RISK, MODERATE, WATCH, or SAFE based on P&L percentage vs threshold.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker','pnl_pct','threshold_pct'],
            properties={
                'ticker':        types.Schema(type=types.Type.STRING),
                'pnl_pct':       types.Schema(type=types.Type.NUMBER, description='Current P&L % (negative = loss)'),
                'threshold_pct': types.Schema(type=types.Type.NUMBER, description='Alert threshold in % (positive number)'),
            }),
    ),
    types.FunctionDeclaration(
        name='send_alert',
        description='Trigger an email/SMS alert when a stock breaches the loss threshold. Only call if risk is HIGH_RISK.',
        parameters=types.Schema(
            type=types.Type.OBJECT, required=['ticker','pnl_pct','threshold_pct','message'],
            properties={
                'ticker':        types.Schema(type=types.Type.STRING),
                'pnl_pct':       types.Schema(type=types.Type.NUMBER),
                'threshold_pct': types.Schema(type=types.Type.NUMBER),
                'message':       types.Schema(type=types.Type.STRING, description='Human-readable alert message'),
            }),
    ),
])

PORTFOLIO_SYSTEM_PROMPT = """You are a professional stock portfolio monitoring and advisory agent.

For EACH stock in the portfolio, follow this EXACT sequence:
1. Call get_stock_price(ticker) → get the live price
2. Call calculate_pnl(ticker, quantity, avg_buy_price, current_price) using the price from step 1
3. Call get_financial_news(ticker) → get 3 headlines
4. For EACH headline, call score_news_sentiment(ticker, headline) — do all 3 headlines
5. Call flag_risk(ticker, pnl_pct, threshold_pct) using the pnl_pct from step 2
6. If risk_level is HIGH_RISK, call send_alert(ticker, pnl_pct, threshold_pct, message)

After processing ALL stocks, write a comprehensive portfolio summary covering:
- Total portfolio value and total unrealised P&L
- Which stocks are high-risk and why
- Key bullish/bearish signals from news sentiment
- Top 2-3 actionable recommendations

Be thorough and process each stock COMPLETELY before moving to the next."""

# ── Streaming Agent Runner ─────────────────────────────────────────────────

def run_agent_stream(task: str, threshold_pct: float = 5.0, use_ai: bool = False):
    """Generator that yields event dicts as the portfolio agent runs using the lowest-cost path by default."""
    yield {'type': 'status', 'message': '🤖 Portfolio agent starting analysis...'}

    if not os.environ.get('GEMINI_API_KEY'):
        parsed_holdings = parse_portfolio_input(task)
        if not parsed_holdings:
            yield {'type': 'final', 'answer': 'No holdings were detected. Provide holdings like AAPL 10 @ 200, TSLA 5 @ 250.', 'steps': 1, 'tokens': 0}
            return

        result = analyze_portfolio(parsed_holdings, threshold_pct=threshold_pct, use_ai=use_ai)
        yield {'type': 'final', 'answer': format_portfolio_summary(result), 'steps': 1, 'tokens': 0, 'result': result}
        return

    client = get_client()

    conversation = [
        types.Content(role='user', parts=[types.Part(
            text=f'[SYSTEM]: {PORTFOLIO_SYSTEM_PROMPT}\n\n[USER TASK]: {task}'
        )])
    ]

    total_tokens = 0

    for step in range(1, 30):
        try:
            response = _call_with_retry(
                client.models.generate_content,
                model=GEMINI_MODEL,
                contents=conversation,
                config=_make_config(tools=[PORTFOLIO_SCHEMA], temperature=0.2)
            )
        except Exception as e:
            yield {'type': 'error', 'message': f'API error: {str(e)}'}
            return

        if response.usage_metadata:
            total_tokens += response.usage_metadata.total_token_count or 0

        # Extract all function calls from this step
        function_calls = [
            part.function_call
            for part in response.candidates[0].content.parts
            if hasattr(part, 'function_call') and part.function_call
        ]

        if not function_calls:
            # No tool calls → final answer
            final_text = _extract_text(response)
            yield {'type': 'final', 'answer': final_text, 'steps': step, 'tokens': total_tokens}
            return

        # Execute each tool
        tool_results = []
        for fc in function_calls:
            args = dict(fc.args)
            if fc.name not in PORTFOLIO_TOOLS:
                err = {'error': f'Unknown tool: {fc.name}'}
                tool_results.append(err)
                yield {'type': 'tool_error', 'step': step, 'tool': fc.name, 'error': f'Unknown tool: {fc.name}'}
                continue
            try:
                result = PORTFOLIO_TOOLS[fc.name](**args)
                tool_results.append(result)
                yield {
                    'type':   'tool_call',
                    'step':   step,
                    'tool':   fc.name,
                    'args':   args,
                    'result': result,
                }
            except Exception as e:
                err = {'error': str(e)}
                tool_results.append(err)
                yield {'type': 'tool_error', 'step': step, 'tool': fc.name, 'error': str(e)}

        # Append to conversation (preserves thought_signature per Module 4 pattern)
        conversation.append(response.candidates[0].content)
        conversation.append(types.Content(role='user', parts=[
            types.Part(function_response=types.FunctionResponse(
                name=fc.name,
                response={'result': result}
            ))
            for fc, result in zip(function_calls, tool_results)
        ]))

    yield {'type': 'final', 'answer': 'Analysis complete.', 'steps': 30, 'tokens': total_tokens}
