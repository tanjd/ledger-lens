"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PositionItem } from "@/lib/types";
import { fmtUsd } from "@/lib/formatters";

interface Props {
  positions: PositionItem[];
}

export function UnrealizedPnlChart({ positions }: Props) {
  if (positions.length === 0) return null;

  const chartData = [...positions]
    .sort((a, b) => b.unrealized_pnl - a.unrealized_pnl)
    .map((p) => ({
      symbol: p.symbol,
      "Unrealized P&L": parseFloat(p.unrealized_pnl.toFixed(2)),
    }));

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Unrealized P&amp;L by Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(180, positions.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => fmtUsd(Number(v ?? 0))}
            />
            <YAxis type="category" dataKey="symbol" tick={{ fontSize: 12 }} width={56} />
            <Tooltip formatter={(v, n) => [fmtUsd(Number(v ?? 0)), String(n ?? "")]} />
            <Bar dataKey="Unrealized P&L" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d["Unrealized P&L"] >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
