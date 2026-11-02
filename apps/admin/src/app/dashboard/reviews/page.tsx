import ReviewMain from "@/components/reviews/main";
import { prisma } from "@/lib/prisma";

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      product: {
        select: {
          id: true,
          name: true,
          vendor: { select: { id: true, name: true } },
        },
      },
      reportedByVendor: { select: { id: true, name: true } },
      responses: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          vendor: { select: { id: true, name: true } },
          admin: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <ReviewMain data={JSON.parse(JSON.stringify(reviews))} />;
}
