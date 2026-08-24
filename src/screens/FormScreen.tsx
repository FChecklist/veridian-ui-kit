"use client";

// R42 seq22 (M28 FORM archetype) -- the third archetype this kit builds,
// after LIST (seq21) and OBJECT (seq21). FORM is a repeated quick-entry
// transaction (SAP-style "log one of these and immediately do it again"),
// NOT a persistent document: no display/edit modes, no draft lifecycle
// (M29's draft lifecycle is for OBJECT screens with a real identity to
// resume -- a FORM submission has no "in progress" state worth resuming;
// GLOBAL's own OFFLINE clause is honoured by the caller queueing a failed
// submission itself, same as this seq's Work Progress consumer does via the
// existing offline queue -- FormScreen owns no networking, same principle
// as ObjectScreen).
import { ScreenFrame } from "./ScreenFrame";
import type { FieldMessage } from "./types";

export type FormScreenProps = {
  breadcrumb: React.ReactNode;
  title: string;
  subtitle?: string;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitDisabledReason?: string;
  submitting?: boolean;
  messages: FieldMessage[];
  onMessageClick?: (message: FieldMessage) => void;
  /** e.g. an offline-queue banner -- rendered above the form fields, below the header. Optional so a plain FORM screen owes nothing to offline concerns. */
  banner?: React.ReactNode;
  children: React.ReactNode; // FormSection(s)
};

export function FormScreen({
  breadcrumb,
  title,
  subtitle,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  submitDisabled,
  submitDisabledReason,
  submitting,
  messages,
  onMessageClick,
  banner,
  children,
}: FormScreenProps) {
  const footerActions = (
    <>
      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={submitDisabled || submitting}
        title={submitDisabled ? submitDisabledReason : undefined}
        className="rounded-md bg-ct-teal px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : submitLabel}
        {submitDisabled && submitDisabledReason ? ` (${submitDisabledReason})` : ""}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="rounded-md border border-ct-border2 px-3 py-1.5 text-[13px] text-ct-navy">
          Cancel
        </button>
      )}
    </>
  );

  return (
    <ScreenFrame breadcrumb={breadcrumb} footerActions={footerActions} messages={messages} onMessageClick={onMessageClick}>
      <div className="px-4 py-3 border-b border-ct-border">
        <h1 className="font-heading text-xl text-ct-navy">{title}</h1>
        {subtitle && <p className="text-[13px] text-ct-muted mt-0.5">{subtitle}</p>}
      </div>
      {banner}
      {children}
    </ScreenFrame>
  );
}
