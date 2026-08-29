"use client";

import Masthead from "./Masthead";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import WorkoutMode from "./overlays/WorkoutMode";
import BottomSheet from "./overlays/BottomSheet";
import TodayTab from "./tabs/TodayTab";
import TrainTab from "./tabs/TrainTab";
import FuelTab from "./tabs/FuelTab";
import ProgressTab from "./tabs/ProgressTab";
import MoreTab from "./tabs/MoreTab";
import { useStore } from "@/lib/store/useStore";
import { mastheadFor } from "@/lib/view/masthead";

export default function DesktopShell() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const db = useStore((s) => s.db);
  const toast = useStore((s) => s.toast);
  const session = useStore((s) => s.session);
  const sheet = useStore((s) => s.sheet);

  const masthead = mastheadFor(tab, db);

  return (
    <div className="relative flex min-h-dvh" style={{ background: "var(--page-desk)" }}>
      <Sidebar active={tab} onChange={setTab} />

      <main className="flex-1 min-w-0 overflow-y-auto lb-scroll">
        <div className="max-w-[1180px] mx-auto p-8">
          <div className="rounded-[18px] overflow-hidden">
            <Masthead {...masthead} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start mt-6">
            {tab === "today" && <TodayTab />}
            {tab === "train" && <TrainTab />}
            {tab === "fuel" && <FuelTab />}
            {tab === "progress" && <ProgressTab />}
            {tab === "more" && <MoreTab />}
          </div>
        </div>
      </main>

      {session && <WorkoutMode />}
      {sheet && <BottomSheet />}
      <Toast message={toast} />
    </div>
  );
}
