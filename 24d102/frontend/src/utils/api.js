export async function getCurrencies() {
  const response = await fetch("/api/currencies");
  if (!response.ok) {
    throw new Error("Unable to load currency list.");
  }
  return response.json();
}

export async function analyzeCurrencyHistory(payload) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Analysis failed.");
  }

  return data;
}
