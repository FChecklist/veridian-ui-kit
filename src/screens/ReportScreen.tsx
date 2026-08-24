"use client";

// R42 seq24 (M28 REPORT archetype) -- A DOCUMENT, NOT A SCREEN. Fixed
// layout, exportable, often contractual (REPORT.GLOBAL). This is the
// chrome only: header block, suppressed "+ New" (a report is not created
// from a report -- REPORT.GLOBAL's own instruction), Export actions, and
// the tie-check banner. "<ReportTable> is shared across every report;
// individual reports are registry rows, NOT components" -- each report's
// own column shape (e.g. the AIA G703 Percent/Quantity/Amount bands
// WorkProgressReportClient already renders) stays with that report, not
// duplicated into this generic wrapper.
import { ScreenFrame, type HeaderActionState } from "./ScreenFrame";
import type { ReactNode } from "react";

export type ReportHeaderBlock = { project: string; client?: string; revision?: string; period?: string; generatedAt: string; generatedBy: string };

export type ReportScreenProps = {
  breadcrumb: ReactNode;
  headerBlock: ReportHeaderBlock;
  parameterBar?: ReactNode;
  /** null = ties (no banner). A mismatch renders LOUDLY and the caller must disable export -- REPORT.GLOBAL: "IF THE SUBTOTALS DO NOT SUM TO THE GRAND TOTAL THE REPORT IS WRONG AND MUST SAY SO LOUDLY, not render anyway." */
  tieError?: string | null;
  exportPdfAction?: HeaderActionState;
  exportXlsxAction?: HeaderActionState;
  shareAction?: HeaderActionState;
  children: ReactNode; // the report's own table (e.g. AIA G703 bands)
};

export function ReportScreen({ breadcrumb, headerBlock, parameterBar, tieError, exportPdfAction, exportXlsxAction, shareAction, children }: ReportScreenProps) {
  return (
    <ScreenFrame
      breadcrumb={breadcrumb}
      // REPORT.GLOBAL: "+ New not applicable -- SUPPRESSED, not greyed" --
      // omitted entirely (not passed with a disabledReason) is the correct
      // reading of SUPPRESSED vs the M31 field-status distinction ("SUPPRESSED
      // fields do not render at all -- absent, not greyed, not collapsed").
      filterAction={undefined}
      messages={[]}
      footerActions={
        <>
          {exportPdfAction && (
            <button type="button" onClick={exportPdfAction.onClick} disabled={!!exportPdfAction.disabledReason} title={exportPdfAction.disabledReason} className="rounded-md border border-ct-border2 px-3 py-1.5 text-[13px] text-ct-navy disabled:opacity-50">
              {exportPdfAction.label}
            </button>
          )}
          {exportXlsxAction && (
            <button type="button" onClick={exportXlsxAction.onClick} disabled={!!exportXlsxAction.disabledReason} title={exportXlsxAction.disabledReason} className="rounded-md border border-ct-border2 px-3 py-1.5 text-[13px] text-ct-navy disabled:opacity-50">
              {exportXlsxAction.label}
            </button>
          )}
          {shareAction && (
            <button type="button" onClick={shareAction.onClick} disabled={!!shareAction.disabledReason} title={shareAction.disabledReason} className="rounded-md border border-ct-border2 px-3 py-1.5 text-[13px] text-ct-navy disabled:opacity-50">
              {shareAction.label}
            </button>
          )}
        </>
      }
    >
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[12px] text-ct-muted border-b border-ct-border pb-3">
          <div><span className="text-ct-navy font-medium">{headerBlock.project}</span></div>
          {headerBlock.client && <div>Client: {headerBlock.client}</div>}
          {headerBlock.revision && <div>Revision: {headerBlock.revision}</div>}
          {headerBlock.period && <div>Period: {headerBlock.period}</div>}
          <div>Generated: {headerBlock.generatedAt}</div>
          <div>By: {headerBlock.generatedBy}</div>
        </div>
        {parameterBar}
        {tieError && (
          <div className="rounded-md border px-3 py-2 text-[13px]" style={{ borderColor: "var(--color-veri-status-late)", color: "var(--color-veri-status-late)" }}>
            {tieError}
          </div>
        )}
        {children}
      </div>
    </ScreenFrame>
  );
}
