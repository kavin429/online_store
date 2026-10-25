"use client";

import { useEffect, useState } from "react";

type Left = { days: number; hours: number; minutes: number; seconds: number };

function calc(end: number): Left | null {
  const diff = end - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function OfferCountdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  // undefined = not mounted yet (avoids a server/client hydration mismatch)
  const [left, setLeft] = useState<Left | null | undefined>(undefined);

  useEffect(() => {
    setLeft(calc(end));
    const t = setInterval(() => setLeft(calc(end)), 1000);
    return () => clearInterval(t);
  }, [end]);

  if (left === undefined) return <div className="h-24" />;
  if (left === null) return null;

  const cells: [string, number][] = [
    ["Days", left.days],
    ["Hours", left.hours],
    ["Minutes", left.minutes],
    ["Seconds", left.seconds],
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
        Offer ends in
      </p>
      <div className="flex justify-center gap-3 sm:gap-4">
        {cells.map(([label, value]) => (
          <div
            key={label}
            className="w-16 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 py-3"
          >
            <div className="text-2xl sm:text-3xl font-black tabular-nums">{pad(value)}</div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/70">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}