"use client";

// R44 seq3 (M28 TIMELINE archetype -- the seventh and last, see
// CompareScreen.tsx for the sixth). Date-ranged bars (a baseline/schedule
// item's start->end) plus point markers (an issue raised on a given date)
// on one shared horizontal axis. Same reuse principle as the rest of this
// kit: no networking, no domain knowledge -- a caller resolves whatever rows
// it likes (construction_pms_schedule_baselines, pms_issues, a permit's
// renewal history, ...) into `bars`/`markers` and this component only knows
// how to lay dates out on an axis.
import { useMemo } from "react";
import type { KpiTone } from "./parts/KpiCard";
import type { StatusTone } from "./types";
import { ScreenFrame } from "./ScreenFrame";
import type { FieldMessage } from "./types";

export type TimelineBar = {
  id: string;
  label: string;
  startDate: string; // ISO
  endDate: string; // ISO
  tone?: KpiTone;
  /** Rows with the same group render on the same lane; omit for one lane per bar. */
  group?: string;
};

export type TimelineMarker = {
  id: string;
  label: string;
  date: string; // ISO
  tone?: StatusTone;
  onClick?: () => void;
};

export type TimelineScreenProps = {
  functionId: string;
  breadcrumb: React.ReactNode;
  bars: TimelineBar[];
  markers?: TimelineMarker[];
  onBarClick?: (bar: TimelineBar) => void;
  emptyStateLabel?: string;
  messages?: FieldMessage[];
  onMessageClick?: (message: FieldMessage) => void;
};

const TONE_COLOR: Record<KpiTone, string> = {
  context: "var(--color-veri-status-context)",
  "needs-you": "var(--color-veri-status-needs-you)",
  done: "var(--color-veri-status-done)",
  late: "var(--color-veri-status-late)",
};

const MARKER_TONE_COLOR: Record<StatusTone, string> = {
  "needs-you": "var(--color-veri-status-needs-you)",
  running: "var(--color-veri-status-context)",
  waiting: "var(--color-veri-status-context)",
  done: "var(--color-veri-status-done)",
  late: "var(--color-veri-status-late)",
  neutral: "var(--color-veri-status-context)",
};

function parseDate(iso: string): number {
  return new Date(iso).getTime();
}

function monthLabel(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function TimelineScreen({
  functionId: _functionId,
  breadcrumb,
  bars,
  markers = [],
  onBarClick,
  emptyStateLabel = "No schedule data yet.",
  messages = [],
  onMessageClick,
}: TimelineScreenProps) {
  const { rangeStart, rangeEnd, lanes, monthTicks } = useMemo(() => {
    const dates = [
      ...bars.flatMap((b) => [parseDate(b.startDate), parseDate(b.endDate)]),
      ...markers.map((m) => parseDate(m.date)),
    ].filter((d) => !Number.isNaN(d));

    if (dates.length === 0) return { rangeStart: 0, rangeEnd: 1, lanes: [] as { group: string; bars: TimelineBar[] }[], monthTicks: [] as number[] };

    const start = Math.min(...dates);
    const end = Math.max(...dates);
    // GLOBAL: real data has real edges -- pad 3% either side so a bar
    // touching the range boundary doesn't render flush against the axis.
    const pad = Math.max((end - start) * 0.03, 1000 * 60 * 60 * 24);
    const rangeStart = start - pad;
    const rangeEnd = end + pad;

    const laneMap = new Map<string, TimelineBar[]>();
    for (const bar of bars) {
      const key = bar.group ?? bar.id;
      if (!laneMap.has(key)) laneMap.set(key, []);
      laneMap.get(key)!.push(bar);
    }
    const lanes = [...laneMap.entries()].map(([group, bars]) => ({ group, bars }));

    // One tick per month spanned by the range, for the axis header.
    const monthTicks: number[] = [];
    const cursor = new Date(rangeStart);
    cursor.setDate(1);
    while (cursor.getTime() <= rangeEnd) {
      monthTicks.push(cursor.getTime());
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { rangeStart, rangeEnd, lanes, monthTicks };
  }, [bars, markers]);

  const span = rangeEnd - rangeStart || 1;
  const pct = (ms: number) => ((ms - rangeStart) / span) * 100;

  return (
    <ScreenFrame breadcrumb={breadcrumb} messages={messages} onMessageClick={onMessageClick}>
      {bars.length === 0 && markers.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-ct-muted text-center">{emptyStateLabel}</p>
      ) : (
        <div className="p-4">
          <div className="relative min-w-[600px]">
            {/* Month axis */}
            <div className="relative h-6 border-b border-ct-border mb-2">
              {monthTicks.map((t) => (
                <div key={t} className="absolute top-0 h-full border-l border-ct-border text-[11px] text-ct-muted pl-1" style={{ left: `${pct(t)}%` }}>
                  {monthLabel(t)}
                </div>
              ))}
            </div>

            {/* Markers (e.g. issues) -- own lane at the top, above the schedule bars, so a date-only event never gets mistaken for a duration. */}
            {markers.length > 0 && (
              <div className="relative h-6 mb-1">
                <span className="absolute -left-2 -translate-x-full top-0.5 text-[11px] text-ct-muted whitespace-nowrap pr-2">Issues ({markers.length})</span>
                {markers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={m.onClick}
                    disabled={!m.onClick}
                    title={m.label}
                    className={`absolute top-0.5 size-3 -translate-x-1/2 rotate-45 border border-white ${m.onClick ? "cursor-pointer" : "cursor-default"}`}
                    style={{ left: `${pct(parseDate(m.date))}%`, backgroundColor: MARKER_TONE_COLOR[m.tone ?? "neutral"] }}
                  />
                ))}
              </div>
            )}

            {/* Schedule bars, one lane per group */}
            <div className="space-y-2">
              {lanes.map(({ group, bars: laneBars }) => (
                <div key={group} className="relative h-7">
                  {laneBars.map((bar) => {
                    const left = pct(parseDate(bar.startDate));
                    const width = Math.max(pct(parseDate(bar.endDate)) - left, 0.5);
                    return (
                      <button
                        key={bar.id}
                        type="button"
                        onClick={onBarClick ? () => onBarClick(bar) : undefined}
                        disabled={!onBarClick}
                        title={`${bar.label}: ${new Date(bar.startDate).toLocaleDateString()} – ${new Date(bar.endDate).toLocaleDateString()}`}
                        className={`absolute top-0 h-6 rounded-sm px-1.5 text-left text-[11px] text-white overflow-hidden whitespace-nowrap ${onBarClick ? "cursor-pointer" : "cursor-default"}`}
                        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: TONE_COLOR[bar.tone ?? "context"] }}
                      >
                        {bar.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
