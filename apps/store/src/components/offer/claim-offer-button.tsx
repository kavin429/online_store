"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, TicketPercent } from "lucide-react";

export default function ClaimOfferButton({
  offerId,
  className,
}: {
  offerId: number;
  className?: string;
}) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  async function claim() {
    setClaiming(true);

    try {
      const res = await fetch("/api/offers/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to claim this offer.");
          router.push(`/login?callbackUrl=/offers`);
          return;
        }
        throw new Error(data.error || "Could not claim this offer");
      }

      setClaimed(true);
      toast.success("Offer claimed. Find it under Account → Claimed Offers.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim this offer");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <button
      type="button"
      onClick={claim}
      disabled={claiming || claimed}
      className={className}
    >
      {claimed ? (
        <>
          <Check className="mr-2 inline h-4 w-4" />
          Claimed
        </>
      ) : (
        <>
          <TicketPercent className="mr-2 inline h-4 w-4" />
          {claiming ? "Claiming..." : "Claim this offer"}
        </>
      )}
    </button>
  );
}
