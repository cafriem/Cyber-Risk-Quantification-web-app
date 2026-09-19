const supportedCurrencies = new Set(["USD", "AED", "EUR", "GBP", "SAR"]);

function readCurrency() {
  if (typeof document === "undefined") return "USD";
  const value = document.documentElement.dataset.currency;
  return supportedCurrencies.has(value ?? "") ? value! : "USD";
}

export function formatMoney(value: number, compact = false, currency?: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? readCurrency(),
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}
