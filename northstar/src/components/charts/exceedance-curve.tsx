"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/components/money";

export function ExceedanceCurve({ losses, threshold }: { losses: number[]; threshold: number }) {
  if (!losses.length) {
    return <p className="text-sm text-zinc-400">Run a simulation to see the exceedance curve.</p>;
  }

  const sorted = [...losses].sort((a, b) => a - b);
  const n = sorted.length;
  const step = Math.max(1, Math.floor(n / 100));
  const data: { loss: string; probability: number; raw: number }[] = [];

  for (let i = 0; i < n; i += step) {
    const value = sorted[i];
    const exceedCount = n - i;
    data.push({
      loss: formatMoney(value, true),
      probability: Math.round((exceedCount / n) * 1000) / 10,
      raw: value,
    });
  }

  const thresholdExceedance = sorted.filter((l) => l > threshold).length / n;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="loss" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${String(value)}%`, "P(loss > X)"]}
            labelFormatter={(label) => `Loss = ${String(label)}`}
          />
          <Line type="monotone" dataKey="probability" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Probability of annual loss exceeding {formatMoney(threshold, true)}:{" "}
        <strong className="text-red-600 dark:text-red-400">{(thresholdExceedance * 100).toFixed(1)}%</strong>
      </p>
    </div>
  );
}
