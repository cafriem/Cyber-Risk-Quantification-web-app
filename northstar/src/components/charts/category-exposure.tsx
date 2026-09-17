"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatMoney } from "@/components/money";

interface CategoryExposureDatum {
  category: string;
  expectedLoss: number;
  p90: number;
}

export function CategoryExposureChart({ data }: { data: CategoryExposureDatum[] }) {
  if (!data.length) {
    return <p className="text-sm text-zinc-400">Run simulations to see exposure by category.</p>;
  }

  const chartData = data.map((item) => ({
    category: item.category,
    expected: Math.round(item.expectedLoss),
    p90: Math.round(item.p90),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => formatMoney(Number(value), true)} />
        <Tooltip
          formatter={(value, name) => [
            formatMoney(Number(value), true),
            name === "expected" ? "Expected Loss" : "P90 Exposure",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="expected" name="Expected Loss" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        <Bar dataKey="p90" name="P90 Exposure" fill="#f97316" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
