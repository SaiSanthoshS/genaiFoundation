import { useEffect, useMemo, useState } from "react";
import SelectorPanel from "./components/SelectorPanel";
import ExchangeRateChart from "./components/ExchangeRateChart";
import PurchasingPowerChart from "./components/PurchasingPowerChart";
import EventAnnotations from "./components/EventAnnotations";
import ReportExport from "./components/ReportExport";
import { analyzeCurrencyHistory, getCurrencies } from "./utils/api";

const defaultEndDate = new Date().toISOString().slice(0, 10);
const defaultStartDate = `${new Date().getFullYear() - 5}-01-01`;

export default function App() {
  const [currencies, setCurrencies] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState("analysis");

  const [form, setForm] = useState({
    baseCurrency: "USD",
    targetCurrency: "EUR",
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    amount: 100
  });

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const data = await getCurrencies();
        setCurrencies(data.currencies || {});
      } catch (err) {
        setError(err.message || "Could not load currencies.");
      }
    }

    loadCurrencies();
  }, []);

  function onInputChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await analyzeCurrencyHistory(form);
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const hasResult = useMemo(() => Boolean(result?.series?.length), [result]);

  return (
    <main className="app-shell">
      <div className="hero-card">
        <p className="kicker">Historical Currency & Inflation Analyser</p>
        <h1>Track what money looked like, and what it actually meant.</h1>
        <p>
          Compare nominal exchange rates with inflation-adjusted reality, inspect
          purchasing power drift, and review event-driven inflections.
        </p>

        <div className="page-tabs">
          <button
            type="button"
            className={page === "analysis" ? "tab-active" : ""}
            onClick={() => setPage("analysis")}
          >
            Analysis
          </button>
          <button
            type="button"
            className={page === "report" ? "tab-active" : ""}
            onClick={() => setPage("report")}
          >
            Report Export Page
          </button>
        </div>
      </div>

      {page === "analysis" ? (
        <>
          <SelectorPanel
            currencies={currencies}
            form={form}
            onChange={onInputChange}
            onSubmit={onSubmit}
            loading={loading}
          />

          {error ? <p className="error-banner">{error}</p> : null}

          {hasResult ? (
            <section id="report-root" className="results-stack">
              <section className="panel summary-panel">
                <h2>Agent Summary</h2>
                <p>{result.summary}</p>
              </section>

              <ExchangeRateChart series={result.series} annotations={result.annotations || []} />
              <PurchasingPowerChart data={result.purchasingPower || []} />
              <EventAnnotations annotations={result.annotations || []} />
            </section>
          ) : (
            <section className="panel placeholder-panel">
              <h2>Awaiting Analysis</h2>
              <p>
                Configure currency pair and date range, then run Analyse to generate
                chart layers and event annotations.
              </p>
            </section>
          )}
        </>
      ) : (
        <section className="results-stack">
          {hasResult ? (
            <>
              <section className="panel summary-panel" id="report-root">
                <h2>Report Draft</h2>
                <p>{result.summary}</p>
                <p className="subtext">
                  Export includes this summary plus all analysis charts and event annotations.
                </p>
              </section>
              <ExchangeRateChart series={result.series} annotations={result.annotations || []} />
              <PurchasingPowerChart data={result.purchasingPower || []} />
              <EventAnnotations annotations={result.annotations || []} />
              <ReportExport reportRootId="report-root" result={result} />
            </>
          ) : (
            <section className="panel placeholder-panel">
              <h2>Run Analysis First</h2>
              <p>
                Generate an analysis from the Analysis tab before exporting a report.
              </p>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
