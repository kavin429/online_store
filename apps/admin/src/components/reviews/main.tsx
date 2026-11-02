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
import { Star, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";

type Filter = "all" | "reported" | "hidden";

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

export default function ReviewMain({ data }: { data: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(data);
  const [filter, setFilter] = useState<Filter>("all");

  const [selected, setSelected] = useState<Review | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setAdminNote(review.adminNote || "");
    setViewOpen(true);
  };

  const replaceReview = (review: Review) => {
    setReviews((prev) =>
      prev.map((item) => (item.id === review.id ? review : item)),
    );
    setSelected((prev) => (prev && prev.id === review.id ? review : prev));
  };

  const patchReview = async (review: Review, payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not update review");
      replaceReview(body.data);
      return true;
    } catch (err: any) {
      toast.error(err.message || "Could not update review");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (review: Review) => {
    const status = review.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
    const ok = await patchReview(review, { status });
    if (ok) {
      toast.success(status === "HIDDEN" ? "Review hidden" : "Review restored");
    }
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
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not post reply");
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    const ok = await patchReview(selected, { adminNote });
    if (ok) toast.success("Admin note saved");
  };

  const dismissReportFor = async (review: Review) => {
    const ok = await patchReview(review, { reportStatus: "DISMISSED" });
    if (ok) toast.success("Report dismissed");
  };

  const dismissReport = async () => {
    if (!selected) return;
    await dismissReportFor(selected);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/reviews/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Delete failed");

      setReviews((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
      toast.success("Review deleted");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "reported") return review.reportStatus === "OPEN";
    if (filter === "hidden") return review.status === "HIDDEN";
    return true;
  });

  const openReports = reviews.filter((review) => review.reportStatus === "OPEN").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Moderate every review on the marketplace. Hide reviews that break the
          rules, resolve vendor reports, or reply publicly as support.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "shoe" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({reviews.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "reported" ? "shoe" : "outline"}
          onClick={() => setFilter("reported")}
        >
          Reported ({openReports})
        </Button>
        <Button
          size="sm"
          variant={filter === "hidden" ? "shoe" : "outline"}
          onClick={() => setFilter("hidden")}
        >
          Hidden ({reviews.filter((review) => review.status === "HIDDEN").length})
        </Button>
      </div>

      <DataTable
        columns={columns(
          openReview,
          openReview,
          toggleStatus,
          dismissReportFor,
          (review) => {
            setDeleteTarget(review);
            setDeleteError(null);
            setDeleteOpen(true);
          },
        )}
        data={filteredReviews}
        filterBy="product"
      />

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
                    {selected.product.vendor?.name || "Admin product"} ·{" "}
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
                <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                  Customer: {selected.user.email || "—"}
                </span>
              </div>

              {selected.reportStatus === "OPEN" && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="text-xs font-semibold uppercase">
                    Reported by {selected.reportedByVendor?.name || "vendor"}
                  </p>
                  <p>{selected.reportReason || "No reason provided."}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={dismissReport}
                    disabled={saving}
                  >
                    Dismiss report
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleStatus(selected)}
                  disabled={saving}
                >
                  {selected.status === "VISIBLE" ? (
                    <>
                      <EyeOff className="mr-1 h-4 w-4" /> Hide review
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-4 w-4" /> Restore review
                    </>
                  )}
                </Button>
              </div>

              {selected.responses.length > 0 && (
                <div className="space-y-2 border-l-2 border-fuchsia-200 pl-3 dark:border-fuchsia-900/50">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Conversation
                  </p>
                  {selected.responses.map((response) => (
                    <div key={response.id}>
                      <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                        {response.authorType === "VENDOR"
                          ? `${response.vendor?.name || "Store"} · Vendor`
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

              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-semibold">Reply as support</p>
                <Textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="This reply is visible to everyone"
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

              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-semibold">Internal admin note</p>
                <Textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Only admins see this note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={saveNote}
                    disabled={saving}
                  >
                    Save note
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={`the review for "${deleteTarget?.product.name ?? "this product"}"`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
