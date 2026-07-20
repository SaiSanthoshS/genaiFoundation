import express from "express";
import cors from "cors";
import { GLOBAL_EVENTS } from "./events.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const COUNTRY_TO_CURRENCY = {
  USA: "USD",
  EMU: "EUR",
  JPN: "JPY",
  GBR: "GBP",
  CAN: "CAD",
  AUS: "AUD",
  CHE: "CHF",
  SWE: "SEK",
  NOR: "NOK",
  DNK: "DKK",
  NZL: "NZD",
  CHN: "CNY",
  IND: "INR",
  BRA: "BRL",
  MEX: "MXN",
  ZAF: "ZAR",
  KOR: "KRW",
  SGP: "SGD"
};

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toTime(value) {
  return new Date(value).getTime();
}

function daysBetween(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.round((toTime(dateA) - toTime(dateB)) / msPerDay));
}

function clampDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range.");
  }

  if (start > end) {
    throw new Error("Start date must be before end date.");
  }

  return {
    startDate: isoDate(start),
    endDate: isoDate(end)
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }
  return response.json();
}

async function fetchCurrencies() {
  return fetchJson("https://api.frankfurter.app/currencies");
}

async function fetchFxTimeseries(baseCurrency, targetCurrency, startDate, endDate) {
  const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=${baseCurrency}&to=${targetCurrency}`;
  const data = await fetchJson(url);

  const rateEntries = Object.entries(data.rates || {})
    .map(([date, quoteMap]) => ({
      date,
      nominalRate: Number(quoteMap?.[targetCurrency])
    }))
    .filter((item) => Number.isFinite(item.nominalRate))
    .sort((a, b) => toTime(a.date) - toTime(b.date));

  if (!rateEntries.length) {
    throw new Error("No FX data returned for selected parameters.");
  }

  return rateEntries;
}

function mapCurrencyToWorldBankCountry(currency) {
  const matched = Object.entries(COUNTRY_TO_CURRENCY).find(([, code]) => code === currency);
  return matched?.[0] || null;
}

async function fetchInflationSeries(currency) {
  const countryCode = mapCurrencyToWorldBankCountry(currency);
  if (!countryCode) {
    return null;
  }

  const indicator = "FP.CPI.TOTL.ZG";
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=200`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload) ? payload[1] : null;

  if (!Array.isArray(rows)) {
    return null;
  }

  const byYear = {};
  for (const row of rows) {
    const year = Number(row?.date);
    const value = Number(row?.value);
    if (Number.isFinite(year) && Number.isFinite(value)) {
      byYear[year] = value;
    }
  }

  return Object.keys(byYear).length ? byYear : null;
}

function buildCpiIndex(inflationByYear, minYear, maxYear) {
  const cpi = {};
  cpi[minYear] = 100;

  for (let year = minYear + 1; year <= maxYear; year += 1) {
    const inflationPct = inflationByYear?.[year] ?? 2;
    cpi[year] = cpi[year - 1] * (1 + inflationPct / 100);
  }

  return cpi;
}

function nearestWorldEvent(date) {
  let chosen = null;
  let chosenDistance = Number.POSITIVE_INFINITY;

  for (const event of GLOBAL_EVENTS) {
    const distance = daysBetween(date, event.date);
    if (distance < chosenDistance) {
      chosen = event;
      chosenDistance = distance;
    }
  }

  if (!chosen || chosenDistance > 75) {
    return null;
  }

  return chosen;
}

function detectInflections(series) {
  if (series.length < 4) {
    return [];
  }

  const moves = [];

  for (let i = 1; i < series.length; i += 1) {
    const prev = series[i - 1];
    const curr = series[i];
    const pctChange = ((curr.nominalRate - prev.nominalRate) / prev.nominalRate) * 100;

    moves.push({
      index: i,
      date: curr.date,
      pctChange,
      absPctChange: Math.abs(pctChange)
    });
  }

  const filtered = moves
    .filter((item) => item.absPctChange >= 0.6)
    .sort((a, b) => b.absPctChange - a.absPctChange)
    .slice(0, 8)
    .sort((a, b) => toTime(a.date) - toTime(b.date));

  return filtered;
}

function explainFallbackInflection(pctChange) {
  const direction = pctChange > 0 ? "appreciation" : "depreciation";
  return `A pronounced ${direction} move was observed around this date, likely tied to macro policy repricing, liquidity shifts, or risk sentiment changes.`;
}

function createSummary({ baseCurrency, targetCurrency, startDate, endDate, avgNominal, avgReal, annotations }) {
  const avgDelta = ((avgNominal - avgReal) / avgNominal) * 100;

  const eventText = annotations.length
    ? `Detected ${annotations.length} visible inflection point(s), with notable episodes linked to ${annotations
        .slice(0, 2)
        .map((a) => a.title)
        .join(" and ")}.`
    : "No large inflection points crossed the significance threshold in this period.";

  return `From ${startDate} to ${endDate}, ${baseCurrency}/${targetCurrency} averaged ${avgNominal.toFixed(
    4
  )} nominally and ${avgReal.toFixed(4)} after inflation adjustment (a ${avgDelta.toFixed(
    2
  )}% gap). ${eventText}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "historical-currency-inflation-analyser" });
});

app.get("/api/currencies", async (_req, res) => {
  try {
    const currencies = await fetchCurrencies();
    res.json({ currencies });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch currencies." });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, startDate, endDate, amount = 100 } = req.body || {};

    if (!baseCurrency || !targetCurrency || !startDate || !endDate) {
      return res.status(400).json({ error: "baseCurrency, targetCurrency, startDate, and endDate are required." });
    }

    if (baseCurrency === targetCurrency) {
      return res.status(400).json({ error: "Base and target currencies must be different." });
    }

    const safeRange = clampDateRange(startDate, endDate);
    const fxSeries = await fetchFxTimeseries(
      baseCurrency,
      targetCurrency,
      safeRange.startDate,
      safeRange.endDate
    );

    const startYear = Number(safeRange.startDate.slice(0, 4));
    const endYear = Number(safeRange.endDate.slice(0, 4));

    const [baseInflation, targetInflation] = await Promise.all([
      fetchInflationSeries(baseCurrency),
      fetchInflationSeries(targetCurrency)
    ]);

    const baseCpi = buildCpiIndex(baseInflation, startYear, endYear);
    const targetCpi = buildCpiIndex(targetInflation, startYear, endYear);

    const startBaseCpi = baseCpi[startYear];
    const startTargetCpi = targetCpi[startYear];

    const enrichedSeries = fxSeries.map((point) => {
      const year = Number(point.date.slice(0, 4));
      const inflationAdjFactor =
        (baseCpi[year] / startBaseCpi) / (targetCpi[year] / startTargetCpi);
      const realRate = point.nominalRate / inflationAdjFactor;

      return {
        date: point.date,
        nominalRate: Number(point.nominalRate.toFixed(6)),
        realRate: Number(realRate.toFixed(6)),
        nominalAmountTarget: Number((amount * point.nominalRate).toFixed(2)),
        realAmountTarget: Number((amount * realRate).toFixed(2))
      };
    });

    const yearlyPurchasingPower = [];
    for (let year = startYear; year <= endYear; year += 1) {
      const nominalAmount = amount;
      const realAmount = amount * (startBaseCpi / baseCpi[year]);
      yearlyPurchasingPower.push({
        year,
        nominalAmount: Number(nominalAmount.toFixed(2)),
        realAmount: Number(realAmount.toFixed(2))
      });
    }

    const inflections = detectInflections(enrichedSeries);
    const annotations = inflections.map((inflection) => {
      const mappedEvent = nearestWorldEvent(inflection.date);

      return {
        date: inflection.date,
        title: mappedEvent?.title || "Visible Market Inflection",
        explanation:
          mappedEvent?.explanation || explainFallbackInflection(inflection.pctChange),
        pctChange: Number(inflection.pctChange.toFixed(2))
      };
    });

    const avgNominal =
      enrichedSeries.reduce((sum, item) => sum + item.nominalRate, 0) / enrichedSeries.length;
    const avgReal =
      enrichedSeries.reduce((sum, item) => sum + item.realRate, 0) / enrichedSeries.length;

    const summary = createSummary({
      baseCurrency,
      targetCurrency,
      startDate: safeRange.startDate,
      endDate: safeRange.endDate,
      avgNominal,
      avgReal,
      annotations
    });

    res.json({
      request: {
        baseCurrency,
        targetCurrency,
        startDate: safeRange.startDate,
        endDate: safeRange.endDate,
        amount
      },
      series: enrichedSeries,
      purchasingPower: yearlyPurchasingPower,
      annotations,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to analyze selected range." });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
