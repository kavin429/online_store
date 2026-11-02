"use client";

import { Check, Copy, Lock, Mail, Send, Store } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { maskCode, maskEmail, money } from "./helpers";
import type { PromoView } from "./types";
import { mutedCls } from "./ui";

export function PromoTicket({
  promo: p,
  mode,
  email,
  locked = false,
  copied = false,
  resending = false,
  onCopy,
  onResend,
}: {
  promo: PromoView;
  mode: "active" | "used" | "expired";
  email: string;
  locked?: boolean;
  copied?: boolean;
  resending?: boolean;
  onCopy?: () => void;
  onResend?: () => void;
}) {
  const active = mode === "active";
  const longValue = p.value.length > 7;

  return (
    <div
      className={`flex overflow-hidden rounded-xl border ${
        active
          ? "border-fuchsia-200 bg-fuchsia-50/30 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/10"
          : "border-zinc-200 opacity-80 dark:border-zinc-800"
      }`}
    >
      {/* Value stub */}
      <div
        className={`flex w-24 shrink-0 flex-col items-center justify-center p-3 text-center text-white sm:w-28 ${
          active
            ? "bg-gradient-to-br from-fuchsia-700 to-fuchsia-400"
            : "bg-zinc-400 dark:bg-zinc-700"
        }`}
      >
        <div className={`font-extrabold leading-none ${longValue ? "text-lg" : "text-2xl"}`}>
          {p.value}
        </div>
        <div className="mt-1 text-center text-[10px] font-semibold tracking-widest">
          {p.valueSub}
        </div>
      </div>

      {/* Details */}
      <div className="relative min-w-0 flex-1 border-l-2 border-dashed border-fuchsia-300 p-3 sm:p-4 dark:border-fuchsia-800">
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-fuchsia-200 bg-background dark:border-fuchsia-900/50" />
        <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full border border-fuchsia-200 bg-background dark:border-fuchsia-900/50" />

        <div className="flex flex-wrap items-center gap-1.5">
          {p.visibility === "public" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
              <Store className="h-3 w-3" /> Public · on landing page
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
              <Mail className="h-3 w-3" /> Email-only secret
            </span>
          )}
        </div>

        <div className="mt-2 text-sm font-semibold">{p.title}</div>
        <p className={mutedCls}>{p.description}</p>

        {/* Code area */}
        {mode === "active" && (
          <div className="mt-3">
            {locked ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-md border border-dashed border-fuchsia-300 bg-background px-3 py-1.5 font-mono text-sm tracking-widest text-fuchsia-700 dark:border-fuchsia-800 dark:text-fuchsia-300">
                  <Lock className="h-3.5 w-3.5" /> {maskCode(p.code)}
                </div>
                <p className="text-xs text-fuchsia-800/80 dark:text-fuchsia-300/80">
                  Check your inbox at {maskEmail(email)}, then enter the code above.
                </p>
                {onResend && (
                  <Button size="sm" variant="outline" onClick={onResend} disabled={resending}>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {resending ? "Sending..." : "Resend email"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-md border border-dashed border-fuchsia-400 bg-background px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-fuchsia-700 dark:text-fuchsia-300">
                  {p.code}
                </div>
                <Button size="sm" variant="outline" onClick={onCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-4 w-4" /> Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === "used" && (
          <div className="mt-3 text-sm">
            <span className="font-mono font-semibold">{p.code}</span> · used {p.usedOn} in{" "}
            {p.usedInOrder}
            <div className="font-semibold text-green-700 dark:text-green-400">
              You saved {money(p.saved ?? 0)}
            </div>
          </div>
        )}

        {mode === "expired" && (
          <div className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            <span className="font-mono">{p.code}</span> · expired {p.expires}
          </div>
        )}

        {mode === "active" && (
          <ul className="mt-3 space-y-0.5 text-xs text-fuchsia-800/80 dark:text-fuchsia-300/80">
            {p.minSpend ? <li>Min. spend {money(p.minSpend)}</li> : null}
            <li>Valid until {p.expires}</li>
          </ul>
        )}
      </div>
    </div>
  );
}
