"use client";

import type { CSSProperties } from "react";
import { today } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";
import { CARDIO_TYPES, progressView } from "@/lib/view/progress";
import type { MeasurementSite } from "@/lib/domain/types";

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid var(--hairline)",
  borderRadius: 14,
  boxShadow: "0 1px 2px rgba(14,42,76,0.04)",
};

const utilityStyle: CSSProperties = {
  background: "#f3f5f8",
  border: "1px solid rgba(14,42,76,0.07)",
  borderRadius: 12,
};

const sectionLabel = "font-mono text-[11px] tracking-[0.08em] uppercase mb-3";

export default function DesktopProgress() {
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
  const bpDraft = useStore((s) => s.bpDraft);
  const setBpField = useStore((s) => s.setBpField);
  const bpError = useStore((s) => s.bpError);
  const saveBp = useStore((s) => s.saveBp);
  const edit = useStore((s) => s.edit);

  const dateStr = today();
  const v = progressView(db, dateStr);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero: bodyweight trend + this week */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-5 items-stretch">
        <div style={cardStyle} className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className={sectionLabel} style={{ color: "#8896a8" }}>
                Bodyweight Trend
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-[13px] font-bold" style={{ color: "var(--gold-dim)" }}>
                  {v.weightDelta}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px]" style={{ color: "#8896a8" }}>
                GOAL
              </div>
              <div className="font-mono text-[18px] font-bold" style={{ color: "var(--navy-3)" }}>
                {db.profile.targetWeight} lb
              </div>
            </div>
          </div>

          <svg viewBox="0 0 300 64" preserveAspectRatio="none" className="w-full h-[190px] mt-4 block">
            <line x1="0" y1="16" x2="300" y2="16" stroke="rgba(14,42,76,0.05)" strokeWidth={0.5} />
            <line x1="0" y1="32" x2="300" y2="32" stroke="rgba(14,42,76,0.05)" strokeWidth={0.5} />
            <line x1="0" y1="48" x2="300" y2="48" stroke="rgba(14,42,76,0.05)" strokeWidth={0.5} />
            <polyline points={v.goalLine} fill="none" stroke="#c9cfd9" strokeWidth={1} strokeDasharray="4 4" />
            <polyline points={v.weightRaw} fill="none" stroke="#b9c4d6" strokeWidth={1} />
            <polyline points={v.weightTrend} fill="none" stroke="#1f4a7d" strokeWidth={2} />
          </svg>

          <div className="grid grid-cols-4 gap-2.5 mt-2">
            {v.weightStats.map((s, i) => (
              <div key={i}>
                <div className="font-mono text-[10px]" style={{ color: "#8896a8" }}>
                  {s.l}
                </div>
                <div className="font-mono text-[15px] font-bold">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
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
              className="px-4 rounded-[8px] border-0 font-semibold text-[13px] cursor-pointer"
              style={{ background: "var(--navy)", color: "#ffffff" }}
            >
              Log
            </button>
          </div>
          {weightError && <div className="font-mono text-[10px] text-error mt-1.5">{weightError}</div>}
        </div>

        <div style={cardStyle} className="p-6 flex flex-col">
          <div className={sectionLabel} style={{ color: "#8896a8" }}>
            This Week
          </div>
          <div className="flex items-end gap-1.5 h-16 mb-3">
            {v.weekBars.map((b, i) => (
              <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                <div className="w-full rounded-t-[3px] rounded-b-[1px]" style={{ height: b.h, background: b.bg }} />
                <div className="font-mono text-[9px]" style={{ color: "#b7c0cc" }}>
                  {b.d}
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[10.5px] mt-auto pt-3 border-t" style={{ color: "#6b7c93", borderColor: "var(--hairline)" }}>
            {v.adherenceLine}
          </div>
        </div>
      </div>

      {/* Measurements / Records / Recovery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div style={cardStyle} className="p-5">
          <div className={sectionLabel} style={{ color: "#8896a8" }}>
            Measurements
          </div>
          {v.measures.map((m) => (
            <div key={m.site} className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div className="flex-1 text-[13px]" style={{ color: "#6b7c93" }}>
                {m.site}
              </div>
              <div className="font-mono text-[13px] font-bold">{m.current}</div>
              <div className="font-mono text-[11px] min-w-[42px] text-right" style={{ color: "var(--gold-dim)" }}>
                {m.delta}
              </div>
              <input
                className="lb-input"
                type="number"
                step="0.1"
                value={measureDraft[m.site] ?? ""}
                onChange={(e) => setMeasureDraft(m.site, e.target.value)}
                onBlur={() => commitMeasure(m.site as MeasurementSite)}
                aria-label={m.site}
                style={{ width: 68, flex: "none", padding: "6px 8px", fontSize: 11 }}
              />
            </div>
          ))}
        </div>

        <div style={cardStyle} className="p-5">
          <div className={sectionLabel} style={{ color: "#8896a8" }}>
            Records
          </div>
          {v.prRows.length === 0 && (
            <div className="py-2.5 text-[12px] italic" style={{ color: "#8896a8" }}>
              Log a set to see your records here.
            </div>
          )}
          {v.prRows.map((p) => (
            <div key={p.name} className="flex justify-between items-baseline gap-2.5 py-2 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-[13px] font-semibold">{p.name}</div>
              <div className="text-right">
                <div className="font-mono text-[12.5px] font-bold">{p.set}</div>
                <div className="font-mono text-[10px]" style={{ color: "#8896a8" }}>
                  {p.e1rm}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle} className="p-5">
          <div className={sectionLabel} style={{ color: "#8896a8" }}>
            Recovery — Today
          </div>
          {v.recovery.map((r) => (
            <div key={r.key} className="mb-3">
              <div className="flex justify-between text-[12px] mb-1">
                <span style={{ color: "#6b7c93" }}>{r.label}</span>
                <b className="font-mono">{r.value}</b>
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
          <div
            className="text-[12.5px] leading-[1.5] mt-2.5 pt-2.5 border-t"
            style={{ color: "var(--note-ink)", borderColor: "var(--hairline)" }}
          >
            {v.recoveryAdvice}
          </div>
        </div>
      </div>

      {/* Quick log utilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div style={utilityStyle} className="px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[13px] font-bold" style={{ color: "#33465e" }}>
              Log Cardio
            </div>
            <div className="font-mono text-[10px]" style={{ color: "#8896a8" }}>
              QUICK LOG
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
            className="w-full mt-2.5 py-2.5 rounded-[8px] border-0 font-semibold text-[13px] cursor-pointer"
            style={{ background: "var(--navy)", color: "#ffffff" }}
          >
            Log session
          </button>
          {cardioError && <div className="font-mono text-[10px] text-error mt-1.5">{cardioError}</div>}
          {v.cardioRows.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {v.cardioRows.map((c, i) => (
                <div key={i} className="flex justify-between font-mono text-[11px]">
                  <span>{c.label}</span>
                  <span style={{ color: "#8896a8" }}>{c.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={utilityStyle} className="px-5 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-[13px] font-bold" style={{ color: "#33465e" }}>
              Log Blood Pressure
            </div>
            <div className="font-mono text-[10px]" style={{ color: "#8896a8" }}>
              QUICK LOG
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              className="lb-input"
              type="number"
              value={bpDraft.systolic}
              onChange={(e) => setBpField("systolic", e.target.value)}
              placeholder="Systolic"
              aria-label="Systolic"
            />
            <input
              className="lb-input"
              type="number"
              value={bpDraft.diastolic}
              onChange={(e) => setBpField("diastolic", e.target.value)}
              placeholder="Diastolic"
              aria-label="Diastolic"
            />
            <input
              className="lb-input"
              type="number"
              value={bpDraft.pulse}
              onChange={(e) => setBpField("pulse", e.target.value)}
              placeholder="Pulse"
              aria-label="Pulse"
            />
          </div>
          <button
            onClick={saveBp}
            className="w-full mt-2.5 py-2.5 rounded-[8px] border-0 font-semibold text-[13px] cursor-pointer"
            style={{ background: "var(--navy)", color: "#ffffff" }}
          >
            Log reading
          </button>
          {bpError && <div className="font-mono text-[10px] text-error mt-1.5">{bpError}</div>}
          <div className="font-mono text-[10px] mt-2.5" style={{ color: "#8896a8" }}>
            {v.bpLatestNote}
          </div>
          {v.bpRows.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {v.bpRows.map((r, i) => (
                <div key={i} className="flex justify-between items-center gap-2.5">
                  <span className="font-mono text-[11.5px] font-bold">{r.label}</span>
                  <span className="font-mono text-[10.5px]" style={{ color: r.categoryColor }}>
                    {r.category}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "#8896a8" }}>
                    {r.detail}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div style={cardStyle} className="p-5">
        <div className="flex justify-between items-baseline mb-3.5">
          <div className={sectionLabel} style={{ color: "#8896a8", marginBottom: 0 }}>
            {v.calendarLabel}
          </div>
          <div className="flex gap-4 text-[11.5px]" style={{ color: "#8896a8" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-[9px] h-[9px] rounded-[3px] inline-block" style={{ background: "var(--navy-3)" }} />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-[9px] h-[9px] rounded-[3px] inline-block"
                style={{ border: "1.5px solid var(--navy-3)" }}
              />
              Planned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-[9px] h-[9px] rounded-[3px] inline-block" style={{ background: "#eef1f5" }} />
              Rest
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {v.calendar.map((c, i) => (
            <div
              key={i}
              title={c.title}
              className="rounded-[6px] border font-mono text-[10px] flex items-start justify-end p-1.5"
              style={{ aspectRatio: "2.2", background: c.bg, color: c.fg, borderColor: c.border }}
            >
              {c.n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
