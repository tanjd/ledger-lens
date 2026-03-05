"use client";

import useSWR, { mutate as globalMutate } from "swr";
import {
  fetcher,
  getCashflowsUrl,
  getHoldingsUrl,
  getIncomeUrl,
  getOverviewUrl,
  getPerformanceUrl,
  getTradesUrl,
  TIMESERIES_URLS,
  VERSION_URL,
} from "@/lib/api";
import type {
  CashflowsResponse,
  CommissionTimeseriesItem,
  DcaItem,
  DepositTimeseriesItem,
  DividendTimeseriesItem,
  HoldingsResponse,
  IncomeResponse,
  NavTimeseriesItem,
  OverviewResponse,
  PerformanceResponse,
  PnlTimeseriesItem,
  PositionTimeseriesItem,
  TradesResponse,
  VersionResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Per-year hooks
// ---------------------------------------------------------------------------

export function useOverview(year: number | null) {
  const key = year ? getOverviewUrl(year) : null;
  return useSWR<OverviewResponse>(key, fetcher);
}

export function useHoldings(year: number | null) {
  const key = year ? getHoldingsUrl(year) : null;
  return useSWR<HoldingsResponse>(key, fetcher);
}

export function useStockTrades(year: number | null) {
  const key = year ? getTradesUrl(year, "stock") : null;
  return useSWR<TradesResponse>(key, fetcher);
}

export function useForexTrades(year: number | null) {
  const key = year ? getTradesUrl(year, "forex") : null;
  return useSWR<TradesResponse>(key, fetcher);
}

export function useIncome(year: number | null) {
  const key = year ? getIncomeUrl(year) : null;
  return useSWR<IncomeResponse>(key, fetcher);
}

export function useCashflows(year: number | null) {
  const key = year ? getCashflowsUrl(year) : null;
  return useSWR<CashflowsResponse>(key, fetcher);
}

export function usePerformance(year: number | null) {
  const key = year ? getPerformanceUrl(year) : null;
  return useSWR<PerformanceResponse>(key, fetcher);
}

// ---------------------------------------------------------------------------
// Timeseries (multi-year) hooks
// ---------------------------------------------------------------------------

export function useNavTimeseries() {
  return useSWR<NavTimeseriesItem[]>(TIMESERIES_URLS.nav, fetcher);
}

export function useDepositTimeseries() {
  return useSWR<DepositTimeseriesItem[]>(TIMESERIES_URLS.deposits, fetcher);
}

export function useDividendTimeseries() {
  return useSWR<DividendTimeseriesItem[]>(TIMESERIES_URLS.dividends, fetcher);
}

export function usePnlTimeseries() {
  return useSWR<PnlTimeseriesItem[]>(TIMESERIES_URLS.pnl, fetcher);
}

export function useDcaTimeseries() {
  return useSWR<DcaItem[]>(TIMESERIES_URLS.dca, fetcher);
}

export function usePositionTimeseries() {
  return useSWR<PositionTimeseriesItem[]>(TIMESERIES_URLS.positions, fetcher);
}
export function useCommissionTimeseries() {
  return useSWR<CommissionTimeseriesItem[]>(TIMESERIES_URLS.commissions, fetcher);
}


// ---------------------------------------------------------------------------
// App version
// ---------------------------------------------------------------------------

export function useBackendVersion() {
  return useSWR<VersionResponse>(VERSION_URL, fetcher);
}

// ---------------------------------------------------------------------------
// Global revalidation after upload
// ---------------------------------------------------------------------------

export function revalidateAll() {
  void globalMutate(() => true);
}
