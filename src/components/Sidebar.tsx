"use client";

import { useRouter } from "next/navigation";
import { TAB_ICONS } from "@/lib/data";
import type { TabId } from "@/lib/store/uiTypes";
import PjkLogo from "./PjkLogo";

const TABS: { id: TabId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "train", label: "Train" },
  { id: "fuel", label: "Fuel" },
  { id: "progress", label: "Progress" },
  { id: "more", label: "More" },
];

interface SidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function Sidebar({ active, onChange }: SidebarProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="w-[232px] shrink-0 h-dvh sticky top-0 flex flex-col" style={{ background: "var(--navy)" }}>
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <PjkLogo size={26} />
        <span className="font-semibold text-[16px] text-white tracking-[-0.01em]">Logbook</span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] cursor-pointer border-0 text-left"
              style={{
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? "#ffffff" : "#8ca0c0",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px] shrink-0">
                <path d={TAB_ICONS[t.id]} />
              </svg>
              <span className="text-[13.5px]" style={{ fontWeight: isActive ? 600 : 500 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mx-3.5 mb-6 px-3.5 py-2.5 cursor-pointer border-0 text-left text-[12px]"
        style={{ background: "transparent", color: "#6b84a8", fontWeight: 500 }}
      >
        Log out
      </button>
    </div>
  );
}
