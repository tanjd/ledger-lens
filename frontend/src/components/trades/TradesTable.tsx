"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TradeItem } from "@/lib/types";
import { fmtUsd, fmtDate, pnlColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const CODE_LABELS: Record<string, string> = {
  O: "Open",
  C: "Close",
  RI: "RI",
  FPA: "FPA",
  P: "Partial",
  Ca: "Cancel",
};

interface Props {
  trades: TradeItem[];
  currencyLabel?: string;
}

export function TradesTable({ trades, currencyLabel }: Props) {
  if (trades.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No trades found.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Symbol</TableHead>
            {currencyLabel && <TableHead>Currency</TableHead>}
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Proceeds</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Realized P&L</TableHead>
            <TableHead>Codes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {fmtDate(t.trade_date)}
              </TableCell>
              <TableCell className="font-medium">{t.symbol}</TableCell>
              {currencyLabel && (
                <TableCell className="text-muted-foreground">
                  {t.currency}
                </TableCell>
              )}
              <TableCell
                className={cn(
                  "text-right font-mono",
                  t.direction === "buy" ? "text-green-600" : "text-red-500",
                )}
              >
                {t.direction === "buy" ? "+" : ""}
                {t.quantity}
              </TableCell>
              <TableCell className="text-right font-mono">
                {fmtUsd(t.trade_price)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {fmtUsd(t.proceeds)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {fmtUsd(t.commission)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono",
                  pnlColor(t.realized_pnl),
                )}
              >
                {fmtUsd(t.realized_pnl)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {t.codes.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs px-1 py-0">
                      {CODE_LABELS[c] ?? c}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
