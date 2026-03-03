"use client";

import { useYear } from "@/context/YearContext";
import { useHoldings } from "@/hooks/useStatement";
import { HoldingsTable } from "@/components/holdings/HoldingsTable";
import { PortfolioAllocationChart } from "@/components/holdings/PortfolioAllocationChart";
import { UnrealizedPnlChart } from "@/components/holdings/UnrealizedPnlChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function HoldingsPage() {
  const { selectedYear } = useYear();
  const { data, isLoading } = useHoldings(selectedYear);

  if (!selectedYear) {
    return <p className="text-muted-foreground">Select a year to view holdings.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Holdings — {selectedYear}</h1>
      {data.positions.length === 0 ? (
        <p className="text-muted-foreground">No open positions for this year.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <PortfolioAllocationChart positions={data.positions} />
            <UnrealizedPnlChart positions={data.positions} />
          </div>
          <HoldingsTable data={data} />
        </>
      )}
    </div>
  );
}
