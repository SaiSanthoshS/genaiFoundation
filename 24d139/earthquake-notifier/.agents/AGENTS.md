# QuakeWatch Project Rules

## NO MOCK DATA — HARD REQUIREMENT
Do not introduce any hardcoded, sample, placeholder, or simulated earthquake data anywhere in the app, including for:
- Empty states / loading states (build these to gracefully handle zero results from the real USGS feed, not fake data injected to "show off" the UI)
- The historical chart page (must query live USGS FDSN API only, do not cache a static JSON snapshot)
- The event detail view and notification cards (must be populated only from actual USGS GeoJSON/FDSN responses)
- Storybook-style component previews (use real fetched data or leave empty)

If a real API call fails or returns nothing, show an honest empty/error state (e.g. "No seismic activity above threshold in this range" or "Unable to reach USGS — retrying"), never a fallback to fabricated events.

This applies to all new features too — multi-location tracking, settings, filters, etc. must all operate on live-fetched real data, not seeded/demo values.
