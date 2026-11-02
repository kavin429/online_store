"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Mail, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { maskEmail, money } from "./helpers";
import { PromoTicket } from "./PromoTicket";
import type { PromoView } from "./types";
import { cardCls, mutedCls } from "./ui";

export function PromosTab({
  promos,
  email,
}: {
  promos: { available: PromoView[]; used: PromoView[]; expired: PromoView[] };
  email: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<"available" | "used" | "expired">("available");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const copy = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(c);
    setTimeout(() => setCopied(null), 1500);
  };

  const applyCode = async () => {
    const value = code.trim().toUpperCase();
    if (!value || busy) return;

    setBusy(true);
    try {
      const res = await fetch("/api/profile/promos/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not unlock this promo code.");

      toast.success(`${value} is now in your wallet.`);
      setCode("");
      setView("available");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlock this promo code.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async (promo: PromoView) => {
    if (resending) return;
    setResending(promo.code);
    try {
      const res = await fetch("/api/profile/promos/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promo.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send the promo email.");
      if (data.delivered === false) {
        toast.warning("Promo email could not be sent because email is not configured.");
      } else {
        toast.success(`Promo email sent to ${maskEmail(email)}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the promo email.");
    } finally {
      setResending(null);
    }
  };

  const { available, used, expired } = promos;
  const totalSaved = used.reduce((sum, p) => sum + (p.saved ?? 0), 0);
  const secretCount = available.filter((p) => p.visibility === "email" && p.locked).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${cardCls} !p-4`}>
          <Gift className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold">{available.length}</div>
          <div className={mutedCls}>Offers available</div>
        </div>
        <div className={`${cardCls} !p-4`}>
          <Mail className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold">{secretCount}</div>
          <div className={mutedCls}>Secret codes waiting in your email</div>
        </div>
        <div className={`${cardCls} !p-4`}>
          <Tag className="h-5 w-5 text-green-600" />
          <div className="mt-2 text-2xl font-bold text-green-700 dark:text-green-400">
            {money(totalSaved)}
          </div>
          <div className={mutedCls}>Saved with promos</div>
        </div>
      </div>

      <div className={cardCls}>
        {/* Enter code */}
        <div className="rounded-lg bg-fuchsia-50 p-4 dark:bg-fuchsia-950/20">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-600" />
            <div className="text-sm">
              <div className="font-semibold">Got a secret code in your email?</div>
              <p className={mutedCls}>
                Some offers are private and are only sent to {maskEmail(email)}. Enter the code
                to unlock it here.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCode()}
              placeholder="Enter promo code"
              className="font-mono uppercase tracking-widest"
            />
            <Button onClick={applyCode} className="w-full sm:w-auto" disabled={busy}>
              {busy ? "Checking..." : "Unlock"}
            </Button>
          </div>
        </div>

        {/* Segmented control */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-fuchsia-100/60 p-1 dark:bg-fuchsia-950/40">
          {(
            [
              ["available", `Available (${available.length})`],
              ["used", `Used (${used.length})`],
              ["expired", `Expired (${expired.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                view === key
                  ? "bg-fuchsia-600 text-white"
                  : "text-fuchsia-700 hover:bg-fuchsia-100 dark:text-fuchsia-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {view === "available" &&
            available.map((p) => (
              <PromoTicket
                key={p.code}
                promo={p}
                mode="active"
                email={email}
                locked={p.locked}
                copied={copied === p.code}
                resending={resending === p.code}
                onCopy={() => copy(p.code)}
                onResend={p.visibility === "email" ? () => resend(p) : undefined}
              />
            ))}

          {view === "available" && available.length === 0 && (
            <p className={`${mutedCls} xl:col-span-2`}>
              No promo codes are available right now. Check back soon.
            </p>
          )}

          {view === "used" &&
            used.map((p) => (
              <PromoTicket
                key={`${p.code}-${p.usedInOrder ?? "used"}`}
                promo={p}
                mode="used"
                email={email}
              />
            ))}

          {view === "used" && used.length === 0 && (
            <p className={`${mutedCls} xl:col-span-2`}>You have not used a promo code yet.</p>
          )}

          {view === "expired" &&
            expired.map((p) => (
              <PromoTicket key={p.code} promo={p} mode="expired" email={email} />
            ))}

          {view === "expired" && expired.length === 0 && (
            <p className={`${mutedCls} xl:col-span-2`}>No expired promo codes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
