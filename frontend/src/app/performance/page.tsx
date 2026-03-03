"use client";

import { useYear } from "@/context/YearContext";
import { usePerformance } from "@/hooks/useStatement";
import { PnlTable } from "@/components/performance/PnlTable";
import { MtmTable } from "@/components/performance/MtmTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerformancePage() {
  const { selectedYear } = useYear();
  const { data, isLoading } = usePerformance(selectedYear);

  if (!selectedYear) {
    return <p className="text-muted-foreground">Select a year to view P&L.</p>;
  }

  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">P&L Analysis — {selectedYear}</h1>
      <Tabs defaultValue="pnl">
        <TabsList>
          <TabsTrigger value="pnl">P&L by Symbol</TabsTrigger>
          <TabsTrigger value="mtm">Mark-to-Market</TabsTrigger>
          <TabsTrigger value="corporate">
            Corporate Actions ({data.corporate_actions.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="mt-4">
          <PnlTable records={data.pnl_records} summary={data.summary} />
        </TabsContent>
        <TabsContent value="mtm" className="mt-4">
          <MtmTable items={data.mtm_summary} />
        </TabsContent>
        <TabsContent value="corporate" className="mt-4">
          {data.corporate_actions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No corporate actions.</p>
          ) : (
            <div className="rounded-md border text-sm">
              {data.corporate_actions.map((ca, i) => (
                <div key={i} className="flex items-center justify-between border-b px-4 py-2 last:border-0">
                  <div>
                    <span className="font-medium">{ca.symbol}</span>
                    <span className="ml-2 text-muted-foreground">{ca.description}</span>
                  </div>
                  <span className="font-mono">{ca.action_date}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
