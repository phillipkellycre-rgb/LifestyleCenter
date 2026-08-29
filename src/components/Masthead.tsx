import Ring from "./Ring";

export interface MastheadStat {
  v: string;
  l: string;
}

export interface MastheadMacro {
  l: string;
  v: string;
  pct: number;
  color: string;
}

export interface MastheadProps {
  eyebrow: string;
  title: string;
  sub: string;
  ringPct: number;
  ringVal: string;
  ringLabel: string;
  stats: MastheadStat[];
  macros?: MastheadMacro[];
}

export default function Masthead({ eyebrow, title, sub, ringPct, ringVal, ringLabel, stats, macros }: MastheadProps) {
  return (
    <div
      className="relative overflow-hidden px-[22px] pt-[18px] pb-[22px]"
      style={{ background: "linear-gradient(180deg, var(--navy) 0%, var(--navy-2) 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage: "linear-gradient(var(--hairline-light) 1px, transparent 1px)",
          backgroundSize: "100% 22px",
        }}
      />
      <div className="relative flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-gold truncate">{eyebrow}</div>
          <div className="font-serif font-semibold text-[30px] leading-[1.02] text-white mt-1.5">{title}</div>
          <div className="font-mono text-[11px] text-[#9FB3CC] mt-1.5">{sub}</div>
        </div>
        <Ring pct={ringPct} value={ringVal} label={ringLabel} />
      </div>
      <div className="relative flex gap-2.5 mt-4.5">
        {stats.map((s, i) => (
          <div key={i} className="flex-1 border-l border-hairline-light pl-2.5">
            <div className="font-mono text-[16px] font-bold text-white">{s.v}</div>
            <div className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-[#8CA0B8] mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
      {macros && macros.length > 0 && (
        <div className="relative flex gap-2.5 mt-4">
          {macros.map((m, i) => (
            <div key={i} className="flex-1">
              <div className="flex justify-between font-mono text-[9.5px] text-[#9FB3CC] mb-1">
                <span>{m.l}</span>
                <b className="text-white">{m.v}</b>
              </div>
              <div className="h-[5px] rounded-[3px] overflow-hidden bg-white/14">
                <div className="h-full rounded-[3px]" style={{ width: `${m.pct * 100}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
