"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PjkLogo from "@/components/PjkLogo";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Incorrect passcode.");
        setSubmitting(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-6"
      style={{ background: "linear-gradient(180deg, var(--navy) 0%, var(--navy-2) 100%)" }}
    >
      <div className="w-full max-w-[340px] flex flex-col items-center">
        <PjkLogo size={140} className="mb-8" />

        <form onSubmit={submit} className="w-full flex flex-col items-center gap-4">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError("");
            }}
            placeholder="Passcode"
            aria-label="Passcode"
            className="w-full text-center rounded-[12px] border border-hairline-light bg-white/10 px-4 py-3.5 font-mono text-[16px] tracking-[0.3em] text-white placeholder:text-[#9FB3CC] placeholder:tracking-normal focus-visible:outline-2 focus-visible:outline-gold"
          />
          <button
            type="submit"
            disabled={submitting || !passcode}
            className="w-full rounded-[12px] py-3.5 font-mono text-[12px] font-bold tracking-[0.1em] uppercase bg-gold text-navy disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Checking…" : "Enter"}
          </button>
          {error && <div className="font-mono text-[11px] text-center" style={{ color: "#FF9EB2" }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
