import { cookies } from "next/headers";
import ReviewsMain from "@/components/reviews/main";
import { prisma } from "@/lib/prisma";

export default async function ReviewsPage() {
  const vendorSessionRaw = cookies().get("vendor_session")?.value;
  let vendorId: number | null = null;

  if (vendorSessionRaw) {
    try {
      const session = JSON.parse(vendorSessionRaw);
      vendorId = typeof session.id === "number" ? session.id : null;
    } catch {}
  }

  if (!vendorId) {
    return <ReviewsMain data={[]} />;
  }

  const reviews = await prisma.review.findMany({
    where: { product: { vendorId } },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      product: { select: { id: true, name: true } },
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

  return <ReviewsMain data={JSON.parse(JSON.stringify(reviews))} />;
}
