"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, Trash2, Pencil, ShieldCheck, MessageSquare, X } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { Textarea } from "@online-store/ui/textarea";
import { toast } from "sonner";

type ReviewResponse = {
  id: number;
  comment: string;
  authorType: "CUSTOMER" | "VENDOR" | "ADMIN";
  createdAt: string;
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
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  product: { id: number; name: string };
  responses: ReviewResponse[];
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
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

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/reviews/mine", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load your reviews");
      setReviews(body.data || []);
    } catch (err: any) {
      setError(err.message || "Could not load your reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (review: Review) => {
    setEditing(review);
    setRating(review.rating);
    setComment(review.comment || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not update review");

      toast.success("Review updated");
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not update review");
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
      setReplyingTo(null);
      setReplyText("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not post reply");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400">Loading your reviews...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Reviews
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Reviews you have written, including any replies from stores.
        </p>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {!error && reviews.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            You have not reviewed any products yet.
          </p>
          <Link href="/products" className="mt-4 inline-block">
            <Button variant="shoe" size="sm">
              Browse products
            </Button>
          </Link>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/products/${review.product.id}`}
                  className="font-semibold text-gray-900 hover:text-fuchsia-600 dark:text-gray-100 dark:hover:text-fuchsia-400"
                >
                  {review.product.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {review.editedAt ? " · edited" : ""}
                  </span>
                  {review.status === "HIDDEN" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      Hidden by moderation
                    </span>
                  )}
                  {review.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                      <ShieldCheck size={12} /> Verified purchase
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {review.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(review)}
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
              </div>
            </div>

            {review.comment && (
              <p className="mt-3 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                {review.comment}
              </p>
            )}

            {review.responses.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-fuchsia-200 pl-3 dark:border-fuchsia-900/50">
                {review.responses.map((response) => (
                  <div key={response.id}>
                    <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
                      {response.authorType === "VENDOR"
                        ? `${response.vendor?.name || "Store"} · Store response`
                        : response.authorType === "ADMIN"
                          ? `${response.admin?.name || "Support"} · Support`
                          : "Your follow-up"}
                    </p>
                    <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                      {response.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {review.canReply && (
              <div className="mt-3">
                {replyingTo === review.id ? (
                  <div className="space-y-2">
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
                        onClick={() => setReplyingTo(null)}
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
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(review.id);
                      setReplyText("");
                    }}
                  >
                    <MessageSquare className="mr-1 h-3.5 w-3.5" /> Add follow-up
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-3 rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Edit review</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close edit review"
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                >
                  <Star
                    size={24}
                    className={
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-300 dark:text-zinc-600"
                    }
                  />
                </button>
              ))}
            </div>

            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              maxLength={2000}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" variant="shoe" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
