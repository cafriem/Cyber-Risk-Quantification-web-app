"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/components/money";

interface HistogramBucket {
  x: number;
  count: number;
}

export function LossHistogram({ data }: { data: HistogramBucket[] }) {
  if (!data.length) {
    return <p className="text-sm text-zinc-400">Run a simulation to see the loss distribution.</p>;
  }

  const chartData = data.map((bucket) => ({
    loss: formatMoney(bucket.x, true),
    count: bucket.count,
    raw: bucket.x,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="loss" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [`${value} iterations`, "Frequency"]}
          labelFormatter={(label) => `Loss ≥ ${String(label)}`}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
