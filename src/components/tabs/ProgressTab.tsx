"use client";

import { today } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";
import { CARDIO_TYPES, progressView } from "@/lib/view/progress";
import type { MeasurementSite } from "@/lib/domain/types";

export default function ProgressTab() {
  const db = useStore((s) => s.db);
  const weightInput = useStore((s) => s.weightInput);
  const setWeightInput = useStore((s) => s.setWeightInput);
  const weightError = useStore((s) => s.weightError);
  const saveWeight = useStore((s) => s.saveWeight);
  const measureDraft = useStore((s) => s.measureDraft);
  const setMeasureDraft = useStore((s) => s.setMeasureDraft);
  const commitMeasure = useStore((s) => s.commitMeasure);
  const cardioDraft = useStore((s) => s.cardioDraft);
  const setCardioField = useStore((s) => s.setCardioField);
  const cardioError = useStore((s) => s.cardioError);
  const saveCardio = useStore((s) => s.saveCardio);
  const edit = useStore((s) => s.edit);

  const dateStr = today();
  const v = progressView(db, dateStr);

  return (
    <section className="px-[22px] pt-5 pb-[26px]">
      <div className="bg-card-bg border border-hairline rounded-[14px] p-4">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Sessions this week</div>
        <div className="flex items-end gap-2 h-[100px] mt-3">
          {v.weekBars.map((b, i) => (
            <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
              <div className="w-full rounded-t-[4px] rounded-b-[2px]" style={{ height: b.h, background: b.bg }} />
              <div className="font-mono text-[9px] text-dim">{b.d}</div>
            </div>
          ))}
        </div>
        <div className="font-mono text-[9.5px] text-dim mt-2">{v.adherenceLine}</div>
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="flex justify-between font-mono text-[10.5px] text-dim">
          <span className="tracking-[0.12em] uppercase">Bodyweight trend</span>
          <span className="text-gold-dim">{v.weightDelta}</span>
        </div>
        <svg viewBox="0 0 300 64" preserveAspectRatio="none" className="w-full h-16 mt-2.5 block">
          <polyline points={v.goalLine} fill="none" stroke="#C79A3A" strokeWidth={1.2} strokeDasharray="4 4" />
          <polyline points={v.weightRaw} fill="none" stroke="#A9BBCF" strokeWidth={1.2} />
          <polyline points={v.weightTrend} fill="none" stroke="#1F4A7D" strokeWidth={2.5} />
        </svg>
        <div className="flex gap-2.5 mt-2.5">
          {v.weightStats.map((s, i) => (
            <div key={i} className="flex-1">
              <div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-dim">{s.l}</div>
              <div className="font-mono text-[13px] font-bold">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            className="lb-input flex-1"
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            aria-label="Today's weight"
            placeholder="Today's weight"
          />
          <button
            onClick={saveWeight}
            className="px-4 bg-navy text-gold border-0 rounded-[10px] font-mono text-[11px] tracking-[0.08em] uppercase cursor-pointer"
          >
            Log
          </button>
        </div>
        {weightError && <div className="font-mono text-[10px] text-error mt-1.5">{weightError}</div>}
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Measurements</div>
        {v.measures.map((m) => (
          <div key={m.site} className="flex items-center gap-2.5 py-2 border-b border-dashed border-hairline">
            <div className="flex-1 font-mono text-[12px] text-dim">{m.site}</div>
            <div className="font-mono text-[12px] font-bold">{m.current}</div>
            <div className="font-mono text-[10px] text-gold-dim min-w-[42px] text-right">{m.delta}</div>
            <input
              className="lb-input"
              type="number"
              step="0.1"
              value={measureDraft[m.site] ?? ""}
              onChange={(e) => setMeasureDraft(m.site, e.target.value)}
              onBlur={() => commitMeasure(m.site as MeasurementSite)}
              aria-label={m.site}
              style={{ width: 74, flex: "none", padding: "6px 8px", fontSize: 11 }}
            />
          </div>
        ))}
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Records</div>
        {v.prRows.length === 0 && (
          <div className="py-2.5 font-mono text-[11px] text-dim italic">Log a set to see your records here.</div>
        )}
        {v.prRows.map((p) => (
          <div key={p.name} className="flex justify-between items-baseline gap-2.5 py-2 border-b border-dashed border-hairline">
            <div className="text-[13.5px] font-semibold">{p.name}</div>
            <div className="text-right">
              <div className="font-mono text-[12px] font-bold">{p.set}</div>
              <div className="font-mono text-[9.5px] text-dim">{p.e1rm}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Log cardio</div>
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <select
            className="lb-input"
            value={cardioDraft.type}
            onChange={(e) => setCardioField("type", e.target.value)}
            aria-label="Activity"
          >
            {CARDIO_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="lb-input"
            type="number"
            value={cardioDraft.min}
            onChange={(e) => setCardioField("min", e.target.value)}
            placeholder="Minutes"
            aria-label="Minutes"
          />
          <input
            className="lb-input"
            type="number"
            step="0.01"
            value={cardioDraft.dist}
            onChange={(e) => setCardioField("dist", e.target.value)}
            placeholder="Miles"
            aria-label="Distance"
          />
          <input
            className="lb-input"
            type="number"
            value={cardioDraft.hr}
            onChange={(e) => setCardioField("hr", e.target.value)}
            placeholder="Avg HR"
            aria-label="Average heart rate"
          />
        </div>
        <button
          onClick={saveCardio}
          className="w-full mt-2.5 py-2.5 bg-navy text-gold border-0 rounded-[10px] font-mono text-[11px] tracking-[0.1em] uppercase cursor-pointer"
        >
          Log session
        </button>
        {cardioError && <div className="font-mono text-[10px] text-error mt-1.5">{cardioError}</div>}
        {v.cardioRows.map((c, i) => (
          <div key={i} className="flex justify-between gap-2.5 py-2 border-b border-dashed border-hairline font-mono text-[11px]">
            <span>{c.label}</span>
            <span className="text-dim">{c.detail}</span>
          </div>
        ))}
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Recovery — today</div>
        {v.recovery.map((r) => (
          <div key={r.key} className="mt-3">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-dim">{r.label}</span>
              <b>{r.value}</b>
            </div>
            <input
              className="lb-range"
              type="range"
              min={r.min}
              max={r.max}
              step={r.step}
              value={r.value}
              onChange={(e) =>
                edit((db2) => {
                  db2.recovery = db2.recovery || {};
                  const cur = db2.recovery[dateStr] || { sleep: 7, energy: 7, soreness: 4, stress: 4 };
                  db2.recovery[dateStr] = { ...cur, [r.key]: parseFloat(e.target.value) };
                })
              }
              aria-label={r.label}
            />
          </div>
        ))}
        <div className="font-serif italic text-[13.5px] mt-3" style={{ color: "var(--note-ink)" }}>
          {v.recoveryAdvice}
        </div>
      </div>

      <div className="bg-card-bg border border-hairline rounded-[14px] p-4 mt-3.5">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">{v.calendarLabel}</div>
        <div className="grid grid-cols-7 gap-1 mt-2.5">
          {v.calendar.map((c, i) => (
            <div
              key={i}
              title={c.title}
              className="rounded-[5px] border font-mono text-[9px] flex items-start justify-end p-[3px]"
              style={{ aspectRatio: "1", background: c.bg, color: c.fg, borderColor: c.border }}
            >
              {c.n}
            </div>
          ))}
        </div>
        <div className="font-mono text-[9px] text-dim mt-2">Navy: completed · Gold outline: planned · Grey: rest</div>
      </div>
    </section>
  );
}
