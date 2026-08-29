interface RingProps {
  pct: number;
  value: string;
  label: string;
}

const CIRCUMFERENCE = 182.2;

export default function Ring({ pct, value, label }: RingProps) {
  const clamped = Math.min(1, Math.max(0, pct));
  const offset = CIRCUMFERENCE - CIRCUMFERENCE * clamped;
  return (
    <div className="relative w-[70px] h-[70px] shrink-0">
      <svg viewBox="0 0 70 70" className="w-full h-full -rotate-90">
        <circle cx="35" cy="35" r="29" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={5} />
        <circle
          cx="35"
          cy="35"
          r="29"
          fill="none"
          stroke="#C79A3A"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[14px] font-bold text-white">{value}</div>
        <div className="font-mono text-[6.5px] tracking-[0.1em] text-gold uppercase">{label}</div>
      </div>
    </div>
  );
}
