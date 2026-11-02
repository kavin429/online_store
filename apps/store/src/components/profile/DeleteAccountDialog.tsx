"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { maskEmail } from "./helpers";
import { mutedCls } from "./ui";

export function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
  points,
  tier,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  points: number;
  tier: string;
  onDeleted: () => void;
}) {
  const [step, setStep] = useState<"warn" | "otp" | "done">("warn");
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Reset every time the dialog closes.
  useEffect(() => {
    if (!open) {
      setStep("warn");
      setAgree(false);
      setOtp("");
      setError("");
      setDevCode("");
      setBusy(false);
      setSeconds(0);
    }
  }, [open]);

  // Resend countdown.
  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, seconds]);

  const handleOpenChange = (next: boolean) => {
    if (!next && step === "done") {
      onDeleted();
      return;
    }
    onOpenChange(next);
  };

  const sendOtp = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send the confirmation code.");

      setStep("otp");
      setSeconds(30);
      setOtp("");
      setDevCode(data.devCode ?? "");
      if (data.devCode) {
        toast.info(`Email is not configured. Your test code is ${data.devCode}.`);
      } else {
        toast.success(`OTP sent to ${maskEmail(email)}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the confirmation code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete your account.");

      setStep("done");
      toast.success("Your account has been deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {step === "warn" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-red-700 dark:text-red-400">
                Delete your account?
              </DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Your profile, addresses and saved details will be removed.</li>
              <li>
                Your {points.toLocaleString()} reward points and {tier} tier will be lost.
              </li>
              <li>Unused promo codes will be cancelled.</li>
              <li>Open orders must be completed or cancelled first.</li>
            </ul>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-red-600"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              I understand my account will be permanently deleted.
            </label>
            <p className={mutedCls}>
              We will send a one-time code to <b>{maskEmail(email)}</b> to confirm it&apos;s you.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Keep my account
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={!agree || busy}
                onClick={sendOtp}
              >
                {busy ? "Sending..." : "Send OTP"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter confirmation code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to {maskEmail(email)}.
              </DialogDescription>
            </DialogHeader>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="000000"
              className="text-center text-xl tracking-[0.5em]"
            />
            {devCode && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                Development code: <b>{devCode}</b>
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="text-center text-sm">
              {seconds > 0 ? (
                <span className={mutedCls}>Resend code in {seconds}s</span>
              ) : (
                <button
                  className="font-medium text-fuchsia-600 hover:underline disabled:opacity-50"
                  onClick={sendOtp}
                  disabled={busy}
                >
                  Resend code
                </button>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={busy || otp.length !== 6}
                onClick={verify}
              >
                {busy ? "Verifying..." : "Verify & delete account"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>Account deleted</DialogTitle>
              <DialogDescription>
                Your account has been deleted and a confirmation was sent to {maskEmail(email)}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-full sm:w-auto" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
