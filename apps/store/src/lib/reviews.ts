import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** A customer can edit/delete their review for this many days after posting. */
export const REVIEW_EDIT_WINDOW_DAYS = 7;

export const reviewInclude = {
  user: { select: { id: true, name: true, image: true } },
  product: { select: { id: true, name: true } },
  responses: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true, image: true } },
      vendor: { select: { id: true, name: true } },
      admin: { select: { id: true, name: true } },
    },
  },
} as const;

type ReviewLike = {
  id: number;
  userId: number;
  status: string;
  createdAt: Date | string;
  responses: { authorType: string }[];
};

export function canModifyReview(review: ReviewLike, userId: number | null) {
  if (!userId || review.userId !== userId) return false;
  if (review.status !== "VISIBLE") return false;
  if (review.responses.length > 0) return false;

  const ageMs = Date.now() - new Date(review.createdAt).getTime();
  return ageMs <= REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function serializeReview<T extends ReviewLike>(review: T, userId: number | null) {
  const canModify = canModifyReview(review, userId);
  return {
    ...review,
    canEdit: canModify,
    canDelete: canModify,
    canReply:
      !!userId &&
      review.userId === userId &&
      review.status === "VISIBLE" &&
      !review.responses.some((response) => response.authorType === "CUSTOMER"),
  };
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true },
  });
}

export function reviewSummary(reviews: { rating: number }[]) {
  const count = reviews.length;
  const average = count
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1))
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));

  return { count, average, distribution };
}
