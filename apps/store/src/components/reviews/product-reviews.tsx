"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, MessageSquare, ShieldCheck, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Textarea } from "@online-store/ui/textarea";
import { toast } from "sonner";

type ReviewResponse = {
  id: number;
  comment: string;
  authorType: "CUSTOMER" | "VENDOR" | "ADMIN";
  createdAt: string;
  user?: { id: number; name: string | null; image: string | null } | null;
  vendor?: { id: number; name: string } | null;
  admin?: { id: number; name: string } | null;
};

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  status: "VISIBLE" | "HIDDEN";
  createdAt: string;
  editedAt: string | null;
  verifiedPurchase: boolean;
  user: { id: number; name: string | null; image: string | null };
  responses: ReviewResponse[];
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
};

type Summary = {
  count: number;
  average: number;
  distribution: { rating: number; count: number }[];
};

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
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

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={24}
            className={
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-300 dark:text-zinc-600"
            }
          />
        </button>
      ))}
    </div>
  );
}

function responseAuthor(response: ReviewResponse) {
  if (response.authorType === "VENDOR") return response.vendor?.name || "Store";
  if (response.authorType === "ADMIN") return response.admin?.name || "Store support";
  return response.user?.name || "Customer";
}

export default function ProductReviews({ productId }: { productId: number }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [summary, setSummary] = useState<Summary>({
    count: 0,
    average: 0,
    distribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(`/api/reviews?productId=${productId}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load reviews");

      setReviews(body.data || []);
      setMyReview(body.myReview || null);
      setSummary(
        body.summary || { count: 0, average: 0, distribution: [] },
      );
    } catch (err: any) {
      setError(err.message || "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setRating(5);
    setComment("");
  };

  const openCreate = () => {
    setEditingId(null);
    setRating(5);
    setComment("");
    setFormOpen(true);
  };

  const openEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment || "");
    setFormOpen(true);
  };

  const submitReview = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/reviews/${editingId}` : "/api/reviews",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, rating, comment }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not save review");

      toast.success(editingId ? "Review updated" : "Thanks for your review");
      resetForm();
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not save review");
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (review: Review) => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not delete review");

      toast.success("Review deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete review");
    }
  };

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) {
      toast.error("Write a reply first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: replyText }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not post reply");

      toast.success("Reply posted");
      setReplyTo(null);
      setReplyText("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not post reply");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary + write button */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {summary.average || "0.0"}
            </p>
            <StarRating rating={Math.round(summary.average)} size={14} />
            <p className="mt-1 text-xs text-zinc-500">
              {summary.count} review{summary.count === 1 ? "" : "s"}
            </p>
          </div>

          <div className="hidden min-w-[160px] flex-col gap-1 sm:flex">
            {summary.distribution.map((item) => {
              const percent = summary.count
                ? Math.round((item.count / summary.count) * 100)
                : 0;
              return (
                <div key={item.rating} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-zinc-500">{item.rating}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-zinc-400">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {!session ? (
            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
              <Button size="sm" variant="shoe">
                Sign in to review
              </Button>
            </Link>
          ) : myReview ? (
            <div className="text-sm text-zinc-500">
              {myReview.status === "HIDDEN" ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  Your review is hidden by moderation and is not shown publicly.
                </p>
              ) : (
                <p>
                  You reviewed this product.{" "}
                  {myReview.canEdit && (
                    <button
                      type="button"
                      onClick={() => openEdit(myReview)}
                      className="font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400"
                    >
                      Edit your review
                    </button>
                  )}
                </p>
              )}
            </div>
          ) : (
            <Button size="sm" variant="shoe" onClick={openCreate}>
              Write a review
            </Button>
          )}
        </div>
      </div>

      {/* Create / edit form */}
      {formOpen && session && (
        <div className="space-y-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 p-4 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {editingId ? "Edit your review" : "Write a review"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Close review form"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500">Your rating</p>
            <RatingInput value={rating} onChange={setRating} />
          </div>

          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share what you liked or what could be better (optional)"
            rows={4}
            maxLength={2000}
          />

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" variant="shoe" onClick={submitReview} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Post review"}
            </Button>
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-zinc-400">Loading reviews...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-zinc-400">
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {review.user.image ? (
                    <img
                      src={review.user.image}
                      alt={review.user.name || "Customer"}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-100 text-sm font-semibold text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                      {(review.user.name || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {review.user.name || "Customer"}
                      </p>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                          <ShieldCheck size={12} /> Verified purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {new Date(review.createdAt).toLocaleDateString("en-LK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {review.editedAt ? " · edited" : ""}
                    </p>
                  </div>
                </div>

                <StarRating rating={review.rating} size={14} />
              </div>

              {review.comment && (
                <p className="mt-3 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                  {review.comment}
                </p>
              )}

              {/* Replies */}
              {review.responses.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-fuchsia-200 pl-3 dark:border-fuchsia-900/50">
                  {review.responses.map((response) => (
                    <div key={response.id} className="text-sm">
                      <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                        {responseAuthor(response)}
                        {response.authorType === "VENDOR" && " · Store response"}
                        {response.authorType === "ADMIN" && " · Support"}
                        {response.authorType === "CUSTOMER" && " · Follow-up"}
                      </p>
                      <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                        {response.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Owner actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {review.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(review)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {review.canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteReview(review)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
                {review.canReply && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyTo(replyTo === review.id ? null : review.id);
                      setReplyText("");
                    }}
                  >
                    <MessageSquare className="mr-1 h-3.5 w-3.5" /> Reply
                  </Button>
                )}
              </div>

              {replyTo === review.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Add a follow-up to your review"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyTo(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="shoe"
                      onClick={() => submitReply(review.id)}
                      disabled={saving}
                    >
                      Post reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
