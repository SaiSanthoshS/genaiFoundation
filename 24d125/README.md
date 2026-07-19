# Epidemic Spread Simulator

This folder contains the Gradio app for the epidemic spread simulator.

## Requirements

- Python 3.10+ recommended
- Internet access is helpful because the app fetches live COVID-19 data when available

## Setup

Open a terminal in this folder and install the shared project dependencies from the repository root:

```powershell
python -m pip install -r ..\requirements.txt
```

## Run

Start the app from this folder:

```powershell
python app.py
```

The Gradio interface will start locally and open in your browser.

## Notes

- If live data requests fail, the simulator falls back to synthetic data so the app can still run.
- The main app entry point is [app.py](app.py).