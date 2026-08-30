"use client";

import { useEffect } from "react";
import Masthead from "./Masthead";
import TabBar from "./TabBar";
import Toast from "./Toast";
import WorkoutMode from "./overlays/WorkoutMode";
import BottomSheet from "./overlays/BottomSheet";
import TodayTab from "./tabs/TodayTab";
import TrainTab from "./tabs/TrainTab";
import FuelTab from "./tabs/FuelTab";
import ProgressTab from "./tabs/ProgressTab";
import WellnessTab from "./tabs/WellnessTab";
import MoreTab from "./tabs/MoreTab";
import { flushPendingSave, useStore } from "@/lib/store/useStore";
import { mastheadFor } from "@/lib/view/masthead";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import DesktopShell from "./DesktopShell";

export default function Shell() {
  const isDesktop = useIsDesktop();
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const refresh = useStore((s) => s.refresh);
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const db = useStore((s) => s.db);
  const toast = useStore((s) => s.toast);
  const session = useStore((s) => s.session);
  const sheet = useStore((s) => s.sheet);
  const tickRest = useStore((s) => s.tickRest);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = setInterval(() => {
      tickRest();
    }, 1000);
    return () => clearInterval(id);
  }, [tickRest]);

  // Keep phone and desktop in sync: flush unsaved edits before the tab is
  // hidden/closed, and pull the latest server copy when it's shown again.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      } else {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushPendingSave);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushPendingSave);
    };
  }, [refresh]);

  if (!hydrated) {
    return <div id="lb-stage" />;
  }

  if (isDesktop) {
    return <DesktopShell />;
  }

  const masthead = mastheadFor(tab, db);

  return (
    <div id="lb-stage">
      <div id="lb-shell">
        <div id="lb-body" className="lb-scroll flex-1 overflow-y-auto">
          <Masthead {...masthead} />
          {tab === "today" && <TodayTab />}
          {tab === "train" && <TrainTab />}
          {tab === "fuel" && <FuelTab />}
          {tab === "progress" && <ProgressTab />}
          {tab === "wellness" && <WellnessTab />}
          {tab === "more" && <MoreTab />}
        </div>

        <TabBar active={tab} onChange={setTab} />

        {session && <WorkoutMode />}
        {sheet && <BottomSheet />}
        <Toast message={toast} />
      </div>
    </div>
  );
}
