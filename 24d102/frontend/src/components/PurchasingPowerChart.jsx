import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function PurchasingPowerChart({ data }) {
  return (
    <section className="panel chart-panel">
      <h2>Purchasing Power Timeline</h2>
      <p className="subtext">
        Agent-calculated real value of a fixed amount in base-currency terms.
      </p>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 16, right: 16, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="ppGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00798c" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00798c" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.12)" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => Number(value).toFixed(2)} />
            <Legend />
            <Area
              type="monotone"
              dataKey="realAmount"
              name="Real purchasing power"
              stroke="#00798c"
              fillOpacity={1}
              fill="url(#ppGradient)"
              strokeWidth={2.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
