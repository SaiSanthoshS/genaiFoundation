"""Epidemic Spread Simulator backend utilities.

This module keeps the first prototype self-contained:
- loads real historical COVID-19 case data when available,
- estimates a simple SIR-style transmission model,
- runs the three requested intervention scenarios,
- and renders lightweight figures for the UI.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests


DEFAULT_DISEASE = "COVID-19"
DEFAULT_REGION = "United States"
SIMULATION_DAYS = 180
DEFAULT_VACCINE_RATE = 0.01
DEFAULT_INTERVENTION_DAY = 30

TOP_REGION_FALLBACKS = [
    "United States",
    "India",
    "Brazil",
    "France",
    "Germany",
    "United Kingdom",
    "Japan",
    "South Korea",
    "Australia",
    "Canada",
    "Italy",
    "Spain",
    "Mexico",
    "South Africa",
    "Argentina",
]

SCENARIO_STYLES = {
    "No action": {"beta_multiplier": 1.0, "vaccination": 0.0, "color": "#c0392b"},
    "Masks": {"beta_multiplier": 0.65, "vaccination": 0.0, "color": "#2980b9"},
    "Vaccination": {"beta_multiplier": 1.0, "vaccination": DEFAULT_VACCINE_RATE, "color": "#27ae60"},
}


@dataclass
class HistoricalSeries:
    dates: list[pd.Timestamp]
    cumulative_cases: np.ndarray
    new_cases: np.ndarray
    population: int
    source: str


def _request_json(url: str) -> dict[str, Any]:
    response = requests.get(url, timeout=12)
    response.raise_for_status()
    payload = response.json()
    if isinstance(payload, dict):
        return payload
    raise ValueError(f"Unexpected payload type from {url}")


@lru_cache(maxsize=1)
def get_region_options() -> list[str]:
    url = "https://disease.sh/v3/covid-19/countries?sort=cases"
    try:
        payload = _request_json(url)
        countries = [entry.get("country") for entry in payload if entry.get("country")]
        countries = [country for country in countries if isinstance(country, str)]
        unique = []
        for country in countries:
            if country not in unique:
                unique.append(country)
        return unique[:30] if unique else TOP_REGION_FALLBACKS
    except Exception:
        return TOP_REGION_FALLBACKS


def _synthetic_series(region: str, days: int = SIMULATION_DAYS) -> HistoricalSeries:
    seed = abs(hash(region)) % (2**32)
    rng = np.random.default_rng(seed)
    population = int(rng.integers(2_000_000, 80_000_000))
    dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=days, freq="D")

    growth = rng.uniform(0.035, 0.09)
    carrying_capacity = population * rng.uniform(0.02, 0.12)
    midpoint = days * rng.uniform(0.32, 0.55)
    cumulative_cases = carrying_capacity / (1 + np.exp(-growth * (np.arange(days) - midpoint)))
    cumulative_cases = np.maximum.accumulate(cumulative_cases)
    cumulative_cases = np.round(cumulative_cases).astype(int)
    new_cases = np.diff(np.concatenate([[0], cumulative_cases]))
    return HistoricalSeries(
        dates=list(dates),
        cumulative_cases=cumulative_cases,
        new_cases=new_cases,
        population=population,
        source=f"Synthetic fallback for {region}",
    )


@lru_cache(maxsize=32)
def load_historical_series(region: str) -> HistoricalSeries:
    historical_url = f"https://disease.sh/v3/covid-19/historical/{region}?lastdays={SIMULATION_DAYS}"
    country_url = f"https://disease.sh/v3/covid-19/countries/{region}?strict=true"

    try:
        historical_payload = _request_json(historical_url)
        country_payload = _request_json(country_url)

        cases_payload = historical_payload.get("timeline", {}).get("cases")
        if cases_payload is None:
            cases_payload = historical_payload.get("cases", {})

        if not isinstance(cases_payload, dict) or not cases_payload:
            raise ValueError(f"No historical cases returned for {region}")

        rows = []
        for key, value in cases_payload.items():
            try:
                rows.append((datetime.strptime(key, "%m/%d/%y"), int(value)))
            except Exception:
                continue

        if len(rows) < 10:
            raise ValueError(f"Not enough historical rows returned for {region}")

        rows.sort(key=lambda item: item[0])
        rows = rows[-120:]
        dates = [pd.Timestamp(item[0]) for item in rows]
        cumulative_cases = np.array([item[1] for item in rows], dtype=int)
        if len(cumulative_cases) > 0:
            cumulative_cases = cumulative_cases - cumulative_cases[0]
            cumulative_cases[0] = max(cumulative_cases[0], 0)
        new_cases = np.diff(np.concatenate([[0], cumulative_cases]))
        population = int(country_payload.get("population") or max(cumulative_cases[-1] * 15, 1_000_000))

        return HistoricalSeries(
            dates=dates,
            cumulative_cases=cumulative_cases,
            new_cases=new_cases,
            population=population,
            source="disease.sh COVID-19 historical cases",
        )
    except Exception:
        return _synthetic_series(region)


def estimate_sir_parameters(series: HistoricalSeries) -> dict[str, float]:
    smoothed = pd.Series(series.new_cases).rolling(window=7, min_periods=1).mean().to_numpy()
    recent = smoothed[-28:]
    recent = recent[recent > 0]

    if len(recent) >= 6:
        x_values = np.arange(len(recent), dtype=float)
        slope, _ = np.polyfit(x_values, np.log(recent), 1)
        growth_rate = float(max(slope, 0.01))
    else:
        growth_rate = 0.05

    infectious_period = 12.0
    gamma = 1.0 / infectious_period
    beta = max(0.03, min(0.95, growth_rate + gamma))

    recent_daily = float(np.mean(smoothed[-14:])) if len(smoothed) else 1.0
    active_estimate = int(max(25, recent_daily * infectious_period))
    initial_infected = min(max(active_estimate, 25), max(int(series.population * 0.0001), 50))
    recovered = max(int(series.cumulative_cases[-1]) - initial_infected, 0)
    susceptible = max(series.population - initial_infected - recovered, 0)

    return {
        "beta": beta,
        "gamma": gamma,
        "initial_susceptible": float(susceptible),
        "initial_infected": float(initial_infected),
        "initial_recovered": float(recovered),
        "recent_growth_rate": growth_rate,
    }


def simulate_sir(
    population: int,
    susceptible: float,
    infected: float,
    recovered: float,
    beta: float,
    gamma: float,
    days: int,
    intervention_day: int,
    beta_multiplier: float,
    vaccination_rate: float,
) -> dict[str, np.ndarray]:
    susceptible_series = np.zeros(days, dtype=float)
    infected_series = np.zeros(days, dtype=float)
    recovered_series = np.zeros(days, dtype=float)
    new_infections = np.zeros(days, dtype=float)
    vaccinated_series = np.zeros(days, dtype=float)

    current_s = float(susceptible)
    current_i = float(infected)
    current_r = float(recovered)
    current_v = 0.0

    for day in range(days):
        effective_beta = beta * (beta_multiplier if day >= intervention_day else 1.0)
        vaccinated = 0.0
        if vaccination_rate > 0 and day >= intervention_day:
            vaccinated = min(current_s, current_s * vaccination_rate)

        new_infected = effective_beta * current_s * current_i / max(population, 1)
        new_recovered = gamma * current_i

        new_infected = min(new_infected, max(current_s - vaccinated, 0.0))
        new_recovered = min(new_recovered, current_i + new_infected)

        current_s = max(current_s - new_infected - vaccinated, 0.0)
        current_i = max(current_i + new_infected - new_recovered, 0.0)
        current_r = min(population, current_r + new_recovered)
        current_v = min(population, current_v + vaccinated)

        susceptible_series[day] = current_s
        infected_series[day] = current_i
        recovered_series[day] = current_r
        new_infections[day] = new_infected
        vaccinated_series[day] = current_v

    return {
        "susceptible": susceptible_series,
        "infected": infected_series,
        "recovered": recovered_series,
        "new_infections": new_infections,
        "vaccinated": vaccinated_series,
    }


def build_spread_grid(day: int, scenario_name: str, scenario_result: dict[str, np.ndarray]) -> np.ndarray:
    infected = float(scenario_result["infected"][min(day, len(scenario_result["infected"]) - 1)])
    peak = max(float(np.max(scenario_result["infected"])), 1.0)
    base_intensity = infected / peak

    size = 6
    xs, ys = np.meshgrid(np.linspace(-1.5, 1.5, size), np.linspace(-1.5, 1.5, size))
    distance = np.sqrt(xs**2 + ys**2)
    wave_center = 0.35 + (day / max(len(scenario_result["infected"]) - 1, 1)) * 1.15
    sigma = 0.42 + (0.1 if scenario_name == "Vaccination" else 0.0)
    wave = np.exp(-((distance - wave_center) ** 2) / (2 * sigma**2))
    return np.clip(base_intensity * wave * 1.7, 0.0, 1.0)


def render_spread_map(day: int, scenario_name: str, scenario_result: dict[str, np.ndarray], title_suffix: str) -> plt.Figure:
    grid = build_spread_grid(day, scenario_name, scenario_result)
    fig, ax = plt.subplots(figsize=(6.5, 5.2), dpi=140)
    image = ax.imshow(grid, cmap="YlOrRd", vmin=0.0, vmax=1.0, origin="lower")

    ax.set_xticks(range(grid.shape[1]))
    ax.set_yticks(range(grid.shape[0]))
    ax.set_xticklabels([])
    ax.set_yticklabels([])
    ax.set_title(f"Spread Map - {scenario_name} - Day {day + 1} {title_suffix}", fontsize=13, weight="bold")
    ax.set_xlabel("Regional cells")
    ax.set_ylabel("Regional cells")

    for row in range(grid.shape[0]):
        for col in range(grid.shape[1]):
            ax.text(col, row, f"{grid[row, col]:.2f}", ha="center", va="center", fontsize=7, color="#2c3e50")

    fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04, label="Infection intensity")
    fig.tight_layout()
    return fig


def render_sir_chart(simulation: dict[str, Any]) -> plt.Figure:
    days = np.arange(1, SIMULATION_DAYS + 1)
    fig, axes = plt.subplots(3, 1, figsize=(10, 10), sharex=True, dpi=140)

    for axis, (scenario_name, scenario_data) in zip(axes, simulation["scenarios"].items()):
        axis.plot(days, scenario_data["susceptible"], label="Susceptible", color="#34495e", linewidth=2)
        axis.plot(days, scenario_data["infected"], label="Infected", color=SCENARIO_STYLES[scenario_name]["color"], linewidth=2.3)
        axis.plot(days, scenario_data["recovered"], label="Recovered", color="#16a085", linewidth=2)
        axis.set_title(scenario_name, fontsize=12, weight="bold")
        axis.set_ylabel("People")
        axis.grid(alpha=0.2)
        axis.legend(loc="upper right", ncol=3, fontsize=9)

    axes[-1].set_xlabel("Day")
    fig.suptitle(
        f"SIR Curves for {simulation['region']} ({simulation['disease']}) - calibrated beta={simulation['beta']:.3f}, gamma={simulation['gamma']:.3f}",
        fontsize=13,
        weight="bold",
    )
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    return fig


def build_comparison_table(simulation: dict[str, Any]) -> pd.DataFrame:
    rows = []
    for scenario_name, scenario_data in simulation["scenarios"].items():
        infected = scenario_data["infected"]
        recovered = scenario_data["recovered"]
        peak_index = int(np.argmax(infected))
        rows.append(
            {
                "Scenario": scenario_name,
                "Peak Cases": int(round(float(infected[peak_index]))),
                "Peak Day": peak_index + 1,
                "Total Affected": int(round(float(recovered[-1] + infected[-1]))),
                "Final Recovered": int(round(float(recovered[-1]))),
                "Final Vaccinated": int(round(float(scenario_data["vaccinated"][-1]))),
                "Growth Fit Error": round(float(simulation["fit_error"]), 4),
            }
        )
    return pd.DataFrame(rows)


def run_simulation(
    disease: str,
    region: str,
    vaccine_rate: float,
    intervention_day: int,
) -> dict[str, Any]:
    series = load_historical_series(region)
    params = estimate_sir_parameters(series)
    beta = float(params["beta"])
    gamma = float(params["gamma"])
    initial_s = float(params["initial_susceptible"])
    initial_i = float(params["initial_infected"])
    initial_r = float(params["initial_recovered"])

    historical_growth = pd.Series(series.new_cases).rolling(window=7, min_periods=1).mean().to_numpy()
    historical_growth = historical_growth[-28:]
    observed_level = float(np.mean(historical_growth)) if len(historical_growth) else 1.0
    model_error = abs(observed_level - float(initial_i)) / max(observed_level, 1.0)

    scenarios: dict[str, dict[str, np.ndarray]] = {}
    for scenario_name, style in SCENARIO_STYLES.items():
        vaccination = vaccine_rate if scenario_name == "Vaccination" else style["vaccination"]
        scenario = simulate_sir(
            population=series.population,
            susceptible=initial_s,
            infected=initial_i,
            recovered=initial_r,
            beta=beta,
            gamma=gamma,
            days=SIMULATION_DAYS,
            intervention_day=max(0, min(intervention_day, SIMULATION_DAYS - 1)),
            beta_multiplier=style["beta_multiplier"],
            vaccination_rate=vaccination,
        )
        scenarios[scenario_name] = scenario

    simulation = {
        "disease": disease,
        "region": region,
        "source": series.source,
        "population": series.population,
        "beta": beta,
        "gamma": gamma,
        "historical_dates": series.dates,
        "historical_cases": series.cumulative_cases,
        "historical_new_cases": series.new_cases,
        "fit_error": model_error,
        "scenarios": scenarios,
        "intervention_day": int(intervention_day),
        "vaccine_rate": float(vaccine_rate),
    }
    simulation["comparison_table"] = build_comparison_table(simulation)
    return simulation


def summarize_simulation(simulation: dict[str, Any]) -> str:
    table: pd.DataFrame = simulation["comparison_table"]
    best_row = table.loc[table["Peak Cases"].idxmin()]
    return (
        f"Data source: {simulation['source']}\n"
        f"Population: {simulation['population']:,}\n"
        f"Calibrated beta: {simulation['beta']:.3f} | gamma: {simulation['gamma']:.3f}\n"
        f"Historical fit error: {simulation['fit_error']:.4f}\n"
        f"Lowest peak scenario: {best_row['Scenario']} ({int(best_row['Peak Cases']):,} peak cases, day {int(best_row['Peak Day'])})"
    )


def default_day(simulation: dict[str, Any]) -> int:
    return min(max(int(simulation["intervention_day"]) + 14, 0), SIMULATION_DAYS - 1)


def render_current_map(simulation: dict[str, Any], scenario_name: str, day: int) -> plt.Figure:
    scenario_result = simulation["scenarios"][scenario_name]
    return render_spread_map(day, scenario_name, scenario_result, f"- {simulation['region']}")


def normalize_vaccine_rate(value: float) -> float:
    return max(0.0, min(float(value), 0.05))


def normalize_intervention_day(value: int) -> int:
    return max(0, min(int(value), SIMULATION_DAYS - 1))
