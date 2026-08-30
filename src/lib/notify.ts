"use client";

const ENABLED_KEY = "lb:supplementReminderEnabled";
const LAST_SHOWN_KEY = "lb:supplementReminderLastShown";
const EVENING_HOUR = 18;

export type ReminderPermission = NotificationPermission | "unsupported";

function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): ReminderPermission {
  if (!hasNotificationApi()) return "unsupported";
  return Notification.permission;
}

export function isSupplementReminderEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) === "1";
}

/** Requests browser notification permission (must be called from a user gesture). */
export async function enableSupplementReminders(): Promise<boolean> {
  if (!hasNotificationApi()) return false;
  const permission = await Notification.requestPermission();
  const granted = permission === "granted";
  window.localStorage.setItem(ENABLED_KEY, granted ? "1" : "0");
  return granted;
}

export function disableSupplementReminders(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, "0");
}

/**
 * Fires a single browser notification per evening (after 6pm) when supplements
 * are still outstanding, deduped per calendar day via localStorage since this
 * runs on an interval while the app is open rather than a server-side push.
 */
export function maybeShowSupplementReminder(dateStr: string, unloggedNames: string[]): void {
  if (!hasNotificationApi()) return;
  if (Notification.permission !== "granted") return;
  if (!isSupplementReminderEnabled()) return;
  if (new Date().getHours() < EVENING_HOUR) return;
  if (unloggedNames.length === 0) return;
  if (window.localStorage.getItem(LAST_SHOWN_KEY) === dateStr) return;

  const body =
    unloggedNames.length === 1
      ? `${unloggedNames[0]} hasn't been logged yet today.`
      : `${unloggedNames.length} supplements haven't been logged yet today.`;
  new Notification("Evening supplement check-in", { body, tag: "supplement-reminder" });
  window.localStorage.setItem(LAST_SHOWN_KEY, dateStr);
}
