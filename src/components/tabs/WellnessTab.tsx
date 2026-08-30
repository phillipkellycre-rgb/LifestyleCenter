"use client";

import { today } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";
import { wellnessView } from "@/lib/view/wellness";

const SLIDERS: { key: "mood" | "stress" | "anxiety"; label: string; hint: string }[] = [
  { key: "mood", label: "Mood", hint: "1 = low, 10 = great" },
  { key: "stress", label: "Stress", hint: "1 = calm, 10 = very stressed" },
  { key: "anxiety", label: "Anxiety", hint: "1 = calm, 10 = very anxious" },
];

export default function WellnessTab() {
  const db = useStore((s) => s.db);
  const setWellnessField = useStore((s) => s.setWellnessField);
  const removeWellnessEntry = useStore((s) => s.removeWellnessEntry);

  const dateStr = today();
  const v = wellnessView(db, dateStr);

  return (
    <>
      <section className="px-[22px] pt-5">
        <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">This week</div>
          <div className="flex items-end gap-2 h-[100px] mt-3">
            {v.weekBars.map((b, i) => (
              <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <div className="w-full rounded-t-[4px] rounded-b-[2px]" style={{ height: b.h, background: b.bg }} />
                <div className="font-mono text-[9px] text-dim">{b.d}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9.5px] text-dim mt-2">{v.weekLine}</div>
        </div>
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Today&apos;s check-in</div>
          {SLIDERS.map((s) => (
            <div key={s.key} className="mt-3">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">
                  {s.label} <span className="text-[9px]">— {s.hint}</span>
                </span>
                <b>{v.today[s.key]}</b>
              </div>
              <input
                className="lb-range"
                type="range"
                min={1}
                max={10}
                step={1}
                value={v.today[s.key]}
                onChange={(e) => setWellnessField(s.key, parseFloat(e.target.value))}
                aria-label={s.label}
              />
            </div>
          ))}
          <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-dim mt-3.5 mb-1">Note (optional)</div>
          <textarea
            className="lb-input"
            rows={2}
            value={v.today.note}
            onChange={(e) => setWellnessField("note", e.target.value)}
            placeholder="What's on your mind today?"
            aria-label="Wellness note"
          />
        </div>
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
          <div className="flex justify-between font-mono text-[10px] text-dim">
            <span className="tracking-[0.12em] uppercase">Mood &amp; stress trend</span>
            <span className="text-dim">{v.chart.label}</span>
          </div>
          {v.hasEntries ? (
            <>
              <svg viewBox="0 0 300 64" preserveAspectRatio="none" className="w-full h-16 mt-2.5 block">
                <polyline points={v.chart.moodLine} fill="none" stroke="var(--navy-3)" strokeWidth={2} />
                <polyline points={v.chart.stressLine} fill="none" stroke="var(--error)" strokeWidth={1.4} />
                <polyline points={v.chart.anxietyLine} fill="none" stroke="var(--macro-carbs)" strokeWidth={1.4} />
              </svg>
              <div className="flex gap-3.5 mt-2 font-mono text-[9.5px] text-dim">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--navy-3)" }} />
                  Mood
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--error)" }} />
                  Stress
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--macro-carbs)" }} />
                  Anxiety
                </span>
              </div>
              <div className="flex gap-2.5 mt-3">
                {v.stats.map((s, i) => (
                  <div key={i} className="flex-1">
                    <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-dim">{s.l}</div>
                    <div className="font-mono text-[13px] font-bold">{s.v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-3 font-mono text-[11px] text-dim italic">
              Log your first check-in above to start the trend.
            </div>
          )}
        </div>
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Outlook</div>
          <div className="text-[14px] font-semibold mt-2" style={{ color: v.outlook.color }}>
            {v.outlook.available ? v.outlook.label : "Not enough data yet"}
          </div>
          <div className="font-mono text-[10px] text-dim mt-1.5 leading-[1.5]">{v.outlook.message}</div>
        </div>
      </section>

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Check-in history</div>
          {v.history.length === 0 && (
            <div className="py-2.5 font-mono text-[11px] text-dim italic">No check-ins logged yet.</div>
          )}
          {v.history.map((h) => (
            <div key={h.date} className="flex items-center gap-2.5 py-2.5 border-b border-dashed border-hairline">
              <div className="w-[52px] shrink-0 font-mono text-[10px] text-dim">{h.label}</div>
              <div className="flex-1 min-w-0 font-mono text-[10.5px] text-dim">
                Mood <b className="text-ink">{h.mood}</b> · Stress <b className="text-ink">{h.stress}</b> · Anxiety{" "}
                <b className="text-ink">{h.anxiety}</b>
                {h.note && <div className="text-[12px] text-ink mt-1 truncate">{h.note}</div>}
              </div>
              <div className="font-mono text-[13px] font-bold text-navy-3 shrink-0">{h.score}</div>
              <button
                onClick={() => removeWellnessEntry(h.date)}
                aria-label={`Remove check-in for ${h.label}`}
                className="w-[26px] h-[26px] shrink-0 border-0 bg-transparent text-dim cursor-pointer text-[13px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
