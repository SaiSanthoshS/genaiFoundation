# Startup Funding Intelligence Agent

This project is a workshop demo app for a Startup Funding Intelligence Agent.

## Features

- Startup Profile Input: name, sector, stage, and revenue range.
- Funding Timeline View: agent-fetched funding rounds shown chronologically.
- Investor Match Table: scored investor matches with portfolio companies and contact links.
- Weekly Digest Preview: generated funding opportunity digest email preview.
- Subscribe action: user can opt into a weekly digest summary.

## Running the app

1. Ensure the workspace Python environment has `gradio` installed.
2. Run:

```bash
python startup_funding_agent/app.py
```

3. Open the local Gradio link shown in the terminal.

## Notes

- This implementation uses mock data to simulate public funding history, investor news, and investor fit scoring.
- It is structured to be extended with live API integration, investor database lookups, and email subscription.
