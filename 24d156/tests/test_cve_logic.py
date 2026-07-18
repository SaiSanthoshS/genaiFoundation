import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import match_cves, normalize_stack


class CVEAlertLogicTests(unittest.TestCase):
    def test_matches_exposed_openssl_alert(self):
        stack = normalize_stack("openssl:3.0.12")
        alerts = match_cves(stack, exposed_to_internet=True, severity_threshold=5.0)
        self.assertTrue(alerts)
        self.assertEqual(alerts[0]["cve_id"], "CVE-2024-3094")
        self.assertEqual(alerts[0]["priority"], "Critical")

    def test_threshold_filters_out_low_severity_alerts(self):
        stack = normalize_stack("nginx:1.25.5")
        alerts = match_cves(stack, exposed_to_internet=False, severity_threshold=8.0)
        self.assertEqual(alerts, [])


if __name__ == "__main__":
    unittest.main()
