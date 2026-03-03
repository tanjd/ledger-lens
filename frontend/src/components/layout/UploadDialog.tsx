"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { previewStatement, uploadStatement } from "@/lib/api";
import type { PreviewResponse } from "@/lib/types";
import { fmtUsd, fmtPct } from "@/lib/formatters";
import { revalidateAll } from "@/hooks/useStatement";
import { useYear } from "@/context/YearContext";

type Step = "idle" | "previewing" | "preview" | "uploading" | "done";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshYears } = useYear();

  const reset = useCallback(() => {
    setStep("idle");
    setPreview(null);
    setError(null);
    fileRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (val: boolean) => {
      setOpen(val);
      if (!val) reset();
    },
    [reset],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      fileRef.current = file;
      setError(null);
      setStep("previewing");
      try {
        const data = await previewStatement(file);
        setPreview(data);
        setStep("preview");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
        setStep("idle");
      }
    },
    [],
  );

  const handleImport = useCallback(async () => {
    if (!fileRef.current) return;
    setStep("uploading");
    setError(null);
    try {
      const result = await uploadStatement(fileRef.current);
      setStep("done");
      revalidateAll();
      refreshYears();
      toast.success(
        `Imported ${result.year} through ${result.period_end_label} for ${result.account_id}`,
      );
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStep("preview");
    }
  }, [reset, refreshYears]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Statement</DialogTitle>
          <DialogDescription>
            Upload an IBKR activity statement CSV — annual
            (e.g.&nbsp;U11111111_2025_2025.csv) or year-to-date
            (e.g.&nbsp;U11111111_20260101_20260302.csv).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File picker */}
          {(step === "idle" || step === "previewing") && (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {step === "previewing" ? "Parsing…" : "Click to select CSV"}
              </span>
              <span className="text-xs text-muted-foreground">
                Format: AccountID_Year_Year.csv or AccountID_YYYYMMDD_YYYYMMDD.csv
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
                disabled={step === "previewing"}
              />
            </label>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview */}
          {(step === "preview" || step === "uploading") && preview && (
            <div className="space-y-3">
              {preview.already_imported && (
                <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-50 p-2.5 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  {preview.year} already has data — re-importing will replace
                  it with data through {preview.period_end_label}.
                </div>
              )}
              <div className="rounded-md border p-3 text-sm">
                <div className="mb-2 font-medium">{preview.account_name}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                  <span>Account</span>
                  <span className="text-foreground">{preview.account_id}</span>
                  <span>Period</span>
                  <span className="text-foreground">{preview.period_end_label}</span>
                  <span>Currency</span>
                  <span className="text-foreground">{preview.base_currency}</span>
                  <span>Portfolio NAV</span>
                  <span className="text-foreground">
                    {fmtUsd(preview.nav_current)}
                  </span>
                  <span>TWR</span>
                  <span className="text-foreground">
                    {fmtPct(preview.twr_pct)}
                  </span>
                  <span>Positions</span>
                  <span className="text-foreground">{preview.position_count}</span>
                  <span>Stock trades</span>
                  <span className="text-foreground">{preview.trade_count}</span>
                  <span>Deposits</span>
                  <span className="text-foreground">{preview.deposit_count}</span>
                  <span>Dividends</span>
                  <span className="text-foreground">{preview.dividend_count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Import complete!
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {(step === "preview" || step === "uploading") && (
            <Button onClick={handleImport} disabled={step === "uploading"}>
              {step === "uploading" ? "Importing…" : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
