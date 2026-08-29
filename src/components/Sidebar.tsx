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
    <div
      className="w-[240px] shrink-0 h-dvh sticky top-0 flex flex-col"
      style={{ background: "linear-gradient(180deg, var(--navy) 0%, var(--navy-2) 100%)" }}
    >
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <PjkLogo size={36} />
        <span className="font-serif font-semibold text-[18px] text-white">Logbook</span>
      </div>

      <nav className="flex-1 px-3">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] mb-1 cursor-pointer border-0 text-left"
              style={{
                background: isActive ? "rgba(199,154,58,0.14)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--tab-inactive)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[19px] h-[19px] shrink-0">
                <path d={TAB_ICONS[t.id]} />
              </svg>
              <span className="font-mono text-[12px] tracking-[0.06em] uppercase">{t.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mx-3 mb-6 px-3.5 py-3 rounded-[10px] cursor-pointer border-0 text-left font-mono text-[11px] tracking-[0.06em] uppercase"
        style={{ background: "transparent", color: "var(--tab-inactive)" }}
      >
        Log out
      </button>
    </div>
  );
}
