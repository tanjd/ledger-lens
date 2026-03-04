"use client";

import { useYear } from "@/context/YearContext";
import {
  useOverview,
  useHoldings,
  useNavTimeseries,
  useDepositTimeseries,
  useDividendTimeseries,
  usePnlTimeseries,
  useDcaTimeseries,
} from "@/hooks/useStatement";
import { AllTimeSummaryCards } from "@/components/overview/AllTimeSummaryCards";
import { YearSummaryTable } from "@/components/overview/YearSummaryTable";
import { NavVsInvestedChart } from "@/components/overview/NavVsInvestedChart";
import { PortfolioAllocationChart } from "@/components/holdings/PortfolioAllocationChart";
import { KpiCard } from "@/components/overview/KpiCard";
import { AssetAllocationChart } from "@/components/overview/AssetAllocationChart";
import { ChangeInNavTable } from "@/components/overview/ChangeInNavTable";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtUsd, fmtPct, pnlColor } from "@/lib/formatters";
import { UploadDialog } from "@/components/layout/UploadDialog";

export default function OverviewPage() {
  const { selectedYear, setSelectedYear } = useYear();

  // All-time data (timeseries)
  const { data: navData, isLoading: navLoading } = useNavTimeseries();
  const { data: depositData, isLoading: depositLoading } = useDepositTimeseries();
  const { data: dividendData, isLoading: dividendLoading } = useDividendTimeseries();
  const { data: pnlData, isLoading: pnlLoading } = usePnlTimeseries();
  const { data: dcaData } = useDcaTimeseries();
  // Latest year's holdings for the current portfolio snapshot
  const latestYear = navData?.at(-1)?.year ?? null;
  const { data: latestHoldings } = useHoldings(latestYear);
  // Selected-year detail
  const { data: yearData, isLoading: yearLoading } = useOverview(selectedYear);

  const timeseriesLoading =
    navLoading || depositLoading || dividendLoading || pnlLoading;

  const hasData = (navData?.length ?? 0) > 0;

  // Empty state
  if (!hasData && !timeseriesLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">No data imported yet.</p>
        <UploadDialog />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── All-time summary ─────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          All Time
        </h2>
        {timeseriesLoading || !navData || !depositData || !dividendData || !pnlData ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <AllTimeSummaryCards
            navData={navData}
            depositData={depositData}
            dividendData={dividendData}
            pnlData={pnlData}
            dcaData={dcaData}
          />
        )}
      </div>

      {/* Year-by-year table — clicking a row sets the selected year */}
      {!timeseriesLoading && navData && navData.length > 0 ? (
        <YearSummaryTable
          navData={navData}
          depositData={depositData ?? []}
          dividendData={dividendData ?? []}
          pnlData={pnlData ?? []}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
        />
      ) : (
        <Skeleton className="h-32 w-full rounded-lg" />
      )}

      {/* NAV vs Total Invested — only rendered when there is timeseries data */}
      {!timeseriesLoading && navData && depositData && navData.length > 0 && (
        <NavVsInvestedChart navData={navData} depositData={depositData} />
      )}

      {/* ── Current portfolio snapshot ───────────────────────────── */}
      {latestHoldings && latestHoldings.positions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Current Portfolio ({latestYear})
          </h2>
          <PortfolioAllocationChart
            positions={latestHoldings.positions}
            title="Holdings by Market Value"
          />
        </div>
      )}

      {/* ── Selected-year detail ──────────────────────────────────── */}
      {selectedYear && (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h2 className="text-base font-semibold">{selectedYear} Detail</h2>
          </div>

          {yearLoading || !yearData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {yearData.period} · {yearData.account_name} · {yearData.account_id}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <KpiCard
                  title="Year-End Portfolio Value"
                  value={fmtUsd(yearData.nav.current_total)}
                  subtitle={`Prior: ${fmtUsd(yearData.nav.prior_total)}`}
                />
                <KpiCard
                  title="Time-Weighted Return"
                  value={fmtPct(yearData.nav.twr_pct)}
                  valueClass={pnlColor(yearData.nav.twr_pct)}
                />
                <KpiCard
                  title="NAV Change"
                  value={fmtUsd(yearData.nav.current_total - yearData.nav.prior_total)}
                  valueClass={pnlColor(yearData.nav.current_total - yearData.nav.prior_total)}
                  subtitle={`${(((yearData.nav.current_total - yearData.nav.prior_total) / (yearData.nav.prior_total || 1)) * 100).toFixed(2)}%`}
                />
                <KpiCard
                  title="Net Deposits"
                  value={fmtUsd(yearData.change_in_nav.deposits_withdrawals)}
                  valueClass={pnlColor(yearData.change_in_nav.deposits_withdrawals)}
                />
                <KpiCard
                  title="Unrealized P&L"
                  value={fmtUsd(pnlData?.find((d) => d.year === selectedYear)?.unrealized ?? 0)}
                  valueClass={pnlColor(pnlData?.find((d) => d.year === selectedYear)?.unrealized ?? 0)}
                  subtitle="Open positions"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <AssetAllocationChart data={yearData.asset_allocation} />
                <ChangeInNavTable data={yearData.change_in_nav} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
