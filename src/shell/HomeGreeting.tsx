"use client";

// The Home page's greeting + AI-digest card -- ported from the mockup's
// #page-home markup exactly (the sparkle icon tile, "Good morning, {name}."
// heading, the summary line, and the 3 stat pills). `stats` accepts
// whatever real counts the product has on hand (VERIDIAN: overdue/upcoming/
// on-track compliance items; PROJEXA: pending queries/open todos/etc.) --
// this component only renders them, it never computes them.
export type HomeStat = { label: string; tone: "attention" | "upcoming" | "onTrack" };

export type HomeGreetingProps = {
  userName: string;
  summary: string;
  stats: HomeStat[];
};

const TONE_CLASSES: Record<HomeStat["tone"], string> = {
  attention: "bg-red-50 text-red-600",
  upcoming: "bg-amber-50 text-amber-700",
  onTrack: "bg-emerald-50 text-emerald-700",
};

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeGreeting({ userName, summary, stats }: HomeGreetingProps) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ct-saffron/90 to-[#F5A623] text-white shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
          </svg>
        </div>
        <div className="pt-0.5">
          <h1 className="font-heading text-2xl text-ct-navy tracking-tight">
            {greetingWord()}, {userName}.
          </h1>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-ct-border bg-white/70 backdrop-blur px-5 py-4 shadow-sm">
        <div className="space-y-3">
          <p className="text-[15px] leading-relaxed text-ct-navy">{summary}</p>
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stats.map((s, i) => (
                <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[s.tone]}`}>
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
