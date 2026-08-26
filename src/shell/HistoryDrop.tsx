"use client";

// M24, and Rajat's own idea -- "the thing that makes the strip earn its place".
//
//  * Drops DOWN over the chat pane. NOTHING REFLOWS. (Hence absolute
//    positioning inside a relative parent: the conversation underneath keeps
//    its scroll position and its height, so opening history never moves the
//    thing the user was reading.)
//  * PINNED above a divider, then RECENT. Five or six entries, never twenty.
//  * SHOW THE WHOLE CHAIN, never a fragment -- "Import BOQ" is ambiguous,
//    "Oakwood > Scope > Import BOQ" is not.
//  * DEDUPLICATE (handled by prepareHistory).
//  * INCLUDE FAILED CHAINS -- "the commonest reason to re-run something is that
//    it went wrong."
//  * A history click ALSO SETS MODE, so the strip never contradicts itself.
//
// *** AND THE RULE THAT MAKES THIS A SHORTCUT RATHER THAN A HAZARD ***
// M24: "A HISTORY CLICK LOADS THE CHAIN AND STOPS. IT MUST NEVER EXECUTE."
// This component's only outward callback is onLoad(ChainLoad). There is no
// onRun, no onSubmit, no onExecute -- and ChainLoad is a type with no way to
// express execution. Adding one here means editing chain.ts and reading why
// it says what it says.

import { chainToSentence, chainKey, prepareHistory, loadChain, type ChainLoad, type HistoryEntry } from "./chain";

export type HistoryDropProps = {
  open: boolean;
  entries: HistoryEntry[];
  /** Loads the chain into the strip. NEVER runs it. */
  onLoad: (load: ChainLoad) => void;
  onTogglePin?: (key: string) => void;
  onClose: () => void;
  /** M24: "history shows 'Suggested' instead of an empty 'Recent'." */
  suggested?: HistoryEntry[];
};

function Row({
  entry,
  onLoad,
  onTogglePin,
}: {
  entry: HistoryEntry;
  onLoad: (load: ChainLoad) => void;
  onTogglePin?: (key: string) => void;
}) {
  const key = chainKey(entry.chain);
  return (
    <li className="flex items-center gap-2">
      <button
        type="button"
        // Loads and stops. The chain is placed in the strip, the screen opens,
        // the cursor lands in the box -- and nothing fires.
        onClick={() => onLoad(loadChain(entry.chain))}
        className="veri-nav-item min-w-0 flex-1 !py-1.5 !text-[12px]"
        title={chainToSentence(entry.chain)}
      >
        {/* THE WHOLE CHAIN, never a fragment. */}
        <span className="truncate">{chainToSentence(entry.chain)}</span>
        {entry.failed && (
          // Failed chains are INCLUDED, and say so in words as well as colour
          // -- M24's never-colour-alone rule applies here too.
          <span
            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: "#F7EDF1", color: "var(--color-veri-status-late)" }}
          >
            ✕ failed
          </span>
        )}
      </button>
      {onTogglePin && (
        <button
          type="button"
          onClick={() => onTogglePin(key)}
          aria-label={entry.pinned ? "Unpin this chain" : "Pin this chain"}
          title={entry.pinned ? "Unpin" : "Pin"}
          className="veri-icon-btn shrink-0"
          style={{ width: 22, height: 22, color: entry.pinned ? "var(--color-ct-saffron)" : undefined }}
        >
          {entry.pinned ? "★" : "☆"}
        </button>
      )}
    </li>
  );
}

export function HistoryDrop({ open, entries, onLoad, onTogglePin, onClose, suggested = [] }: HistoryDropProps) {
  if (!open) return null;
  const { pinned, recent } = prepareHistory(entries);
  const nothingYet = pinned.length === 0 && recent.length === 0;

  return (
    // absolute + z-index: it covers the conversation, it does not displace it.
    <div
      className="absolute left-0 right-0 top-full z-30 mx-3 mt-1 overflow-hidden rounded-lg border shadow-lg"
      style={{ background: "#fff", borderColor: "var(--color-ct-border)" }}
      role="dialog"
      aria-label="Recent task chains"
    >
      <div className="max-h-[280px] overflow-y-auto p-1.5">
        {pinned.length > 0 && (
          <>
            <ul className="space-y-0.5">
              {pinned.map((e) => (
                <Row key={chainKey(e.chain)} entry={e} onLoad={onLoad} onTogglePin={onTogglePin} />
              ))}
            </ul>
            {/* The divider M24 specifies between pinned and recent. */}
            <div className="my-1.5 h-px" style={{ background: "var(--color-ct-border)" }} />
          </>
        )}

        {nothingYet ? (
          // EMPTY STATES MUST PROMPT, NEVER LOOK BROKEN. A new user has no
          // history at all -- M24 calls history one of the "earned" things.
          <>
            <p className="px-2 py-1 text-[11px] font-medium" style={{ color: "var(--color-ct-muted)" }}>
              Suggested
            </p>
            <ul className="space-y-0.5">
              {suggested.map((e) => (
                <Row key={chainKey(e.chain)} entry={e} onLoad={onLoad} />
              ))}
            </ul>
            {suggested.length === 0 && (
              <p className="px-2 py-2 text-[12px]" style={{ color: "var(--color-ct-muted)" }}>
                Your recent chains will appear here once you run something.
              </p>
            )}
          </>
        ) : (
          <ul className="space-y-0.5">
            {recent.map((e) => (
              <Row key={chainKey(e.chain)} entry={e} onLoad={onLoad} onTogglePin={onTogglePin} />
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full border-t px-3 py-1.5 text-left text-[11px]"
        style={{ borderColor: "var(--color-ct-border)", color: "var(--color-ct-muted)" }}
      >
        Close
      </button>
    </div>
  );
}
