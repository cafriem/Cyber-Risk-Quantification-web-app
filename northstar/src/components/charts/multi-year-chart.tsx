"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/components/money";

interface MultiYearBreakdown {
  years: number;
  withoutTreatment: number[];
  withTreatment: number[];
  cumulativeSavings: number[];
  netBenefit: number[];
}

export function MultiYearChart({ data }: { data: MultiYearBreakdown }) {
  const chartData = Array.from({ length: data.years }, (_, i) => ({
    year: `Year ${i + 1}`,
    without: data.withoutTreatment[i],
    with: data.withTreatment[i],
    savings: data.cumulativeSavings[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatMoney(v, true)} />
        <Tooltip formatter={(value, name) => [formatMoney(Number(value), true), String(name)]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="without" name="Without Treatment" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="with" name="With Treatment" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="savings" name="Cumulative Savings" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
