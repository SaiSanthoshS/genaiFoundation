import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agent import analyze_portfolio, parse_portfolio_input


class PortfolioAgentTests(unittest.TestCase):
    def test_parse_portfolio_input(self):
        holdings = parse_portfolio_input("AAPL 10 @ 200, TSLA 5 @ 250")
        self.assertEqual(len(holdings), 2)
        self.assertEqual(holdings[0]["ticker"], "AAPL")
        self.assertEqual(holdings[0]["quantity"], 10)
        self.assertEqual(holdings[0]["avg_buy_price"], 200)

    def test_analyze_portfolio_returns_summary(self):
        result = analyze_portfolio(
            holdings=[{"ticker": "AAPL", "quantity": 10, "avg_buy_price": 200.0}],
            threshold_pct=5.0,
        )

        self.assertIn("portfolio_value", result)
        self.assertIn("total_pnl", result)
        self.assertIn("positions", result)
        self.assertGreaterEqual(len(result["positions"]), 1)
        self.assertIn("recommendations", result)


if __name__ == "__main__":
    unittest.main()
