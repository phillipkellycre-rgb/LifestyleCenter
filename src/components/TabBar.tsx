import { TAB_ICONS } from "@/lib/data";
import type { TabId } from "@/lib/store/uiTypes";

const TABS: { id: TabId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "train", label: "Train" },
  { id: "fuel", label: "Fuel" },
  { id: "progress", label: "Progress" },
  { id: "wellness", label: "Wellness" },
  { id: "more", label: "More" },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      id="lb-nav"
      className="absolute bottom-0 left-0 right-0 flex z-40"
      style={{ background: "var(--tabbar-bg)" }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-label={t.label}
            aria-current={isActive ? "page" : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-[5px] bg-transparent border-0 cursor-pointer"
            style={{ color: isActive ? "var(--gold)" : "var(--tab-inactive)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[19px] h-[19px]">
              <path d={TAB_ICONS[t.id]} />
            </svg>
            <span className="font-mono text-[9.5px] tracking-[0.08em] uppercase">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
