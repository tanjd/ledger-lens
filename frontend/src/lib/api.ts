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
  PreviewResponse,
  TradesResponse,
  UploadResponse,
} from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Per-year endpoints
// ---------------------------------------------------------------------------

export function getOverviewUrl(year: number) {
  return `/api/overview?year=${year}`;
}

export function getHoldingsUrl(year: number) {
  return `/api/holdings?year=${year}`;
}

export function getTradesUrl(year: number, type: "stock" | "forex") {
  return `/api/trades?year=${year}&type=${type}`;
}

export function getIncomeUrl(year: number) {
  return `/api/income?year=${year}`;
}

export function getCashflowsUrl(year: number) {
  return `/api/cashflows?year=${year}`;
}

export function getPerformanceUrl(year: number) {
  return `/api/performance?year=${year}`;
}

// ---------------------------------------------------------------------------
// Timeseries endpoints
// ---------------------------------------------------------------------------

export const TIMESERIES_URLS = {
  nav: "/api/timeseries/nav",
  deposits: "/api/timeseries/deposits",
  dividends: "/api/timeseries/dividends",
  pnl: "/api/timeseries/pnl",
  dca: "/api/timeseries/dca",
  positions: "/api/timeseries/positions",
  commissions: "/api/timeseries/commissions",
} as const;

// ---------------------------------------------------------------------------
// Upload / Preview (imperative — not SWR)
// ---------------------------------------------------------------------------

export async function previewStatement(file: File): Promise<PreviewResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/preview`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `Preview failed (${res.status})`);
  }
  return res.json() as Promise<PreviewResponse>;
}

export async function uploadStatement(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(data.detail ?? `Upload failed (${res.status})`);
  }
  return res.json() as Promise<UploadResponse>;
}

export async function fetchYears(): Promise<number[]> {
  return fetcher<number[]>("/api/years");
}

// Re-export typed fetchers for SWR
export {
  type CashflowsResponse,
  type CommissionTimeseriesItem,
  type DcaItem,
  type DepositTimeseriesItem,
  type DividendTimeseriesItem,
  type HoldingsResponse,
  type IncomeResponse,
  type NavTimeseriesItem,
  type OverviewResponse,
  type PerformanceResponse,
  type PnlTimeseriesItem,
  type PositionTimeseriesItem,
  type TradesResponse,
};
