const today = new Date().toISOString().slice(0, 10);
const defaultStart = `${new Date().getFullYear() - 5}-01-01`;

export default function SelectorPanel({
  currencies,
  form,
  onChange,
  onSubmit,
  loading
}) {
  const currencyOptions = Object.entries(currencies || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <section className="panel selector-panel">
      <h2>Currency & Date Range Selector</h2>
      <p className="subtext">
        Choose your pair, timeframe, and baseline amount. Press Analyse to run
        the data agent.
      </p>

      <form className="selector-grid" onSubmit={onSubmit}>
        <label>
          Base currency
          <select
            name="baseCurrency"
            value={form.baseCurrency}
            onChange={onChange}
            required
          >
            {currencyOptions.map(([code, label]) => (
              <option value={code} key={code}>
                {code} - {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Target currency
          <select
            name="targetCurrency"
            value={form.targetCurrency}
            onChange={onChange}
            required
          >
            {currencyOptions.map(([code, label]) => (
              <option value={code} key={code}>
                {code} - {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start date
          <input
            type="date"
            name="startDate"
            value={form.startDate || defaultStart}
            onChange={onChange}
            max={today}
            required
          />
        </label>

        <label>
          End date
          <input
            type="date"
            name="endDate"
            value={form.endDate || today}
            onChange={onChange}
            max={today}
            required
          />
        </label>

        <label>
          Base amount
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={onChange}
            min="1"
            step="1"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </form>
    </section>
  );
}
