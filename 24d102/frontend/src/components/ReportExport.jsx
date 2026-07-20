import { useState } from "react";
import { exportAnalysisPdf } from "../utils/report";

export default function ReportExport({ reportRootId, result }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onExport() {
    setError("");
    setBusy(true);
    try {
      await exportAnalysisPdf({
        reportRootId,
        title: "Historical Currency & Inflation Analysis Report",
        summary: result.summary,
        request: result.request
      });
    } catch (err) {
      setError(err.message || "Failed to export report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel export-panel">
      <h2>Report Export Page</h2>
      <p className="subtext">
        Generate an agent-compiled PDF with chart snapshots and written analysis.
      </p>
      <button onClick={onExport} disabled={busy}>
        {busy ? "Building PDF..." : "Export PDF"}
      </button>
      {error ? <p className="error-inline">{error}</p> : null}
    </section>
  );
}
