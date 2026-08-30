import type { MastheadProps } from "./Masthead";

const DATE_STR = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export default function DesktopHeader({ title, sub, ringVal, ringLabel, stats, macros }: MastheadProps) {
  const cards = [...stats, { v: ringVal, l: ringLabel }];

  return (
    <div className="mb-7">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-[26px] leading-tight tracking-tight" style={{ color: "var(--ink)" }}>
            {title}
          </div>
          <div className="text-[14px] mt-1" style={{ color: "var(--dim)" }}>
            {sub}
          </div>
        </div>
        <div className="font-mono text-[12px] tracking-[0.04em] uppercase shrink-0" style={{ color: "#8896a8" }}>
          {DATE_STR()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className="rounded-[14px] px-5 py-[18px] bg-white"
            style={{ border: "1px solid var(--hairline)", boxShadow: "0 1px 2px rgba(14,42,76,0.04)" }}
          >
            <div className="font-mono text-[11px] tracking-[0.06em] uppercase" style={{ color: "#8896a8" }}>
              {c.l}
            </div>
            <div className="font-mono text-[26px] font-bold mt-1.5" style={{ color: "var(--ink)" }}>
              {c.v}
            </div>
          </div>
        ))}
      </div>

      {macros && macros.length > 0 && (
        <div
          className="grid grid-cols-3 gap-6 mt-4 rounded-[14px] px-5 py-4 bg-white"
          style={{ border: "1px solid var(--hairline)", boxShadow: "0 1px 2px rgba(14,42,76,0.04)" }}
        >
          {macros.map((m, i) => (
            <div key={i}>
              <div className="flex justify-between font-mono text-[10.5px] mb-1.5" style={{ color: "#8896a8" }}>
                <span>{m.l}</span>
                <b style={{ color: "var(--ink)" }}>{m.v}</b>
              </div>
              <div className="h-[6px] rounded-[3px] overflow-hidden" style={{ background: "var(--hairline)" }}>
                <div className="h-full rounded-[3px]" style={{ width: `${m.pct * 100}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
