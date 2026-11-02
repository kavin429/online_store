"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Review } from "./column";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Textarea } from "@online-store/ui/textarea";
import { Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-300 dark:text-zinc-600"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewsMain({ data }: { data: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(data);
  const [selected, setSelected] = useState<Review | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setReviews(body.data || []);
  }, []);

  useEffect(() => {
    setReviews(data);
  }, [data]);

  const openReview = (review: Review) => {
    setSelected(review);
    setReplyText("");
    setReportReason("");
    setViewOpen(true);
  };

  const sendReply = async () => {
    if (!selected) return;
    if (!replyText.trim()) {
      toast.error("Write a reply first");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${selected.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: replyText }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not post reply");

      toast.success("Reply posted");
      setReplyText("");
      setViewOpen(false);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not post reply");
    } finally {
      setSaving(false);
    }
  };

  const sendReport = async () => {
    if (!selected) return;
    if (!reportReason.trim()) {
      toast.error("Tell the admin why this review should be reviewed");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${selected.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not report review");

      toast.success("Review reported to the admin team");
      setReportReason("");
      setViewOpen(false);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not report review");
    } finally {
      setSaving(false);
    }
  };

  const hasVendorReply =
    selected?.responses.some((response) => response.authorType === "VENDOR") ?? false;
  const canReport =
    selected?.reportStatus === "NONE" || selected?.reportStatus === "DISMISSED";

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reviews & Ratings</h1>
        <p className="text-sm text-muted-foreground">
          Customer reviews on your products. Reply to build trust or report a
          review that breaks the rules. Only admins can remove reviews.
        </p>
      </div>

      <DataTable columns={columns(openReview, openReview, openReview)} data={reviews} filterBy="product" />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto space-y-4">
          <DialogHeader>
            <DialogTitle>Review details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{selected.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.user.name || "Anonymous"} ·{" "}
                    {new Date(selected.createdAt).toLocaleDateString()}
                    {selected.editedAt ? " · edited" : ""}
                  </p>
                  {selected.verifiedPurchase && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      <ShieldCheck size={12} /> Verified purchase
                    </span>
                  )}
                </div>
                <StarRating rating={selected.rating} />
              </div>

              <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                {selected.comment || "No comment left."}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                  Status: {selected.status === "VISIBLE" ? "Visible" : "Hidden"}
                </span>
                <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                  Report: {selected.reportStatus.toLowerCase()}
                </span>
              </div>

              {selected.reportStatus === "OPEN" && selected.reportReason && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="text-xs font-semibold uppercase">Your report</p>
                  <p>{selected.reportReason}</p>
                </div>
              )}

              {selected.adminNote && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Admin note
                  </p>
                  <p>{selected.adminNote}</p>
                </div>
              )}

              {selected.responses.length > 0 && (
                <div className="space-y-2 border-l-2 border-fuchsia-200 pl-3 dark:border-fuchsia-900/50">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Conversation
                  </p>
                  {selected.responses.map((response) => (
                    <div key={response.id}>
                      <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                        {response.authorType === "VENDOR"
                          ? `${response.vendor?.name || "Store"} · You`
                          : response.authorType === "ADMIN"
                            ? `${response.admin?.name || "Support"} · Admin`
                            : `${response.user?.name || "Customer"} · Customer`}
                      </p>
                      <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                        {response.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!hasVendorReply && selected.status === "VISIBLE" && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">Reply as the store</p>
                  <Textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Thank the customer or explain how you will help"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="shoe"
                      onClick={sendReply}
                      disabled={saving}
                    >
                      {saving ? "Posting..." : "Post reply"}
                    </Button>
                  </div>
                </div>
              )}

              {canReport && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-semibold">Report this review</p>
                  <p className="text-xs text-muted-foreground">
                    Use this for spam, abusive language or content unrelated to
                    your product. An admin will review it.
                  </p>
                  <Textarea
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Why should an admin review this review?"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={sendReport}
                      disabled={saving}
                    >
                      Report to admin
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
