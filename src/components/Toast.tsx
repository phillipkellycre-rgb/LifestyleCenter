export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="absolute left-[22px] right-[22px] bottom-[96px] rounded-[10px] px-3.5 py-3 text-center z-[110] font-mono text-[11px] tracking-[0.04em] lg:left-1/2 lg:right-auto lg:bottom-8 lg:-translate-x-1/2 lg:w-auto lg:min-w-[280px] lg:max-w-[420px]"
      style={{ background: "var(--navy)", color: "var(--gold)" }}
      role="status"
    >
      {message}
    </div>
  );
}
