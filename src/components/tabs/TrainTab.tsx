"use client";

import { EXERCISES } from "@/lib/data";
import { prFor } from "@/lib/domain/selectors";
import { useStore } from "@/lib/store/useStore";
import { trainView } from "@/lib/view/train";

const GROUPS = ["All", ...Array.from(new Set(EXERCISES.map((e) => e.group)))];

export default function TrainTab() {
  const db = useStore((s) => s.db);
  const setSelWeek = useStore((s) => s.edit);
  const startSession = useStore((s) => s.startSession);
  const swapProgramExercise = useStore((s) => s.swapProgramExercise);
  const exQuery = useStore((s) => s.exQuery);
  const setExQuery = useStore((s) => s.setExQuery);
  const exGroup = useStore((s) => s.exGroup);
  const setExGroup = useStore((s) => s.setExGroup);

  const v = trainView(db);

  const q = exQuery.toLowerCase();
  const filtered = EXERCISES.filter(
    (e) => (exGroup === "All" || e.group === exGroup) && (!q || e.name.toLowerCase().includes(q))
  );
  const rows = filtered.slice(0, 40).map((e) => ({ ex: e, pr: prFor(db, e.id) }));

  return (
    <>
      <section className="px-[22px] pt-5">
        <div className="flex items-baseline justify-between">
          <span className="font-serif font-semibold text-[18px]">{v.programTitle}</span>
          <span className="font-mono text-[10px] text-dim">{v.programTag}</span>
        </div>
        <div className="h-px bg-hairline my-2.5 mb-3" />
        <div className="grid grid-cols-6 gap-1.5">
          {v.weeks.map((w) => (
            <button
              key={w.n}
              onClick={() => setSelWeek((d) => { d.selWeek = w.n; })}
              className="cursor-pointer rounded-lg py-1.5 px-0.5 text-center border"
              style={{ background: w.bg, color: w.fg, borderColor: w.border }}
            >
              <div className="font-mono text-[10px] font-bold">{w.n}</div>
              <div className="font-mono text-[7.5px] tracking-[0.06em] opacity-80">{w.tag}</div>
            </button>
          ))}
        </div>
        <div className="font-mono text-[10.5px] text-dim mt-2.5">{v.prescription}</div>

        {v.days.map((d) => (
          <div key={d.dayIndex} className="py-[13px] border-b border-dashed border-hairline">
            <div className="flex justify-between items-baseline gap-2.5">
              <div className="min-w-0">
                <div className="font-serif font-semibold text-[16px]">{d.name}</div>
                {d.dayLabel && <div className="font-mono text-[9.5px] text-dim mt-0.5">{d.dayLabel}</div>}
              </div>
              <div className="font-mono text-[10px] shrink-0" style={{ color: d.stateColor }}>
                {d.state}
              </div>
            </div>
            {d.exercises.map((e) => (
              <div key={e.exIndex} className="flex items-center justify-between gap-2 mt-1.5">
                <span className="font-mono text-[10.5px] text-dim">{e.name}</span>
                <button
                  onClick={() => swapProgramExercise(d.dayIndex, e.exIndex)}
                  className="bg-transparent border-0 p-0 font-mono text-[9.5px] tracking-[0.04em] text-gold-dim cursor-pointer shrink-0"
                >
                  REPLACE
                </button>
              </div>
            ))}
            <button
              onClick={() => startSession(d.dayIndex)}
              className="mt-2.5 bg-transparent border-0 p-0 font-mono text-[10.5px] tracking-[0.06em] text-gold-dim cursor-pointer"
            >
              {d.startLabel}
            </button>
          </div>
        ))}
      </section>

      <section className="px-[22px] pt-[22px]">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Planned vs actual</div>
        {v.liftCharts.map((c) => (
          <div key={c.name} className="bg-card-bg border border-hairline rounded-[14px] p-3.5 mt-3">
            <div className="flex justify-between items-baseline">
              <div className="font-serif font-semibold text-[15px]">{c.name}</div>
              <div className="font-mono text-[10.5px] text-gold-dim">{c.delta}</div>
            </div>
            <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="w-full h-[60px] mt-2 block">
              <polyline points={c.planned} fill="none" stroke="#A9BBCF" strokeWidth={1.5} strokeDasharray="4 4" />
              <polyline points={c.actual} fill="none" stroke="#1F4A7D" strokeWidth={2.5} />
            </svg>
            <div className="font-mono text-[9.5px] text-dim">{c.caption}</div>
          </div>
        ))}
        <div className="bg-card-bg border border-hairline rounded-[14px] p-3.5 mt-3">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Weekly volume</div>
          <div className="flex items-end gap-2 h-[90px] mt-3">
            {v.volumeBars.map((b, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5">
                <div className="w-full rounded-t-[4px] rounded-b-[2px]" style={{ height: b.h, background: b.bg }} />
                <div className="font-mono text-[9px] text-dim">{b.label}</div>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9.5px] text-dim mt-2">{v.volumeCaption}</div>
        </div>
      </section>

      <section className="px-[22px] pt-[22px] pb-[26px]">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-dim">Exercise library</div>
        <input
          className="lb-input mt-2.5"
          type="search"
          placeholder="Search 50+ exercises"
          value={exQuery}
          onChange={(e) => setExQuery(e.target.value)}
          aria-label="Search exercises"
        />
        <div className="flex gap-1.5 overflow-x-auto mt-2.5 pb-1 lb-scroll">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setExGroup(g)}
              className="shrink-0 py-1.5 px-3 rounded-full border font-mono text-[10px] tracking-[0.06em] uppercase cursor-pointer"
              style={{
                background: exGroup === g ? "var(--navy)" : "#fff",
                color: exGroup === g ? "var(--gold)" : "var(--navy-3)",
                borderColor: exGroup === g ? "var(--navy)" : "var(--hairline)",
              }}
            >
              {g}
            </button>
          ))}
        </div>
        {rows.map(({ ex, pr }) => (
          <div key={ex.id} className="flex gap-2.5 items-center py-2.5 border-b border-dashed border-hairline">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[13.5px]">{ex.name}</div>
              <div className="font-mono text-[10px] text-dim mt-0.5">
                {ex.group} · {ex.equip} · {ex.compound ? "compound" : "isolation"}
              </div>
            </div>
            <div className="font-mono text-[10.5px] text-navy-3 text-right shrink-0">
              {pr ? `${pr.w}×${pr.r}` : "—"}
            </div>
          </div>
        ))}
        <div className="font-mono text-[10px] text-dim mt-2.5">
          {filtered.length} of {EXERCISES.length} exercises
        </div>
      </section>
    </>
  );
}
