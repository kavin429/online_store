import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryIdParam = searchParams.get("categoryId");

    if (!categoryIdParam) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    const categoryId = Number(categoryIdParam);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "categoryId must be a number" }, { status: 400 });
    }

    // ✅ Fetch subcategories with their products
    const subcategories = await prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
      include: { products: true }, // TS now knows this relation exists
    });

    // Map subcategories to include active/pending counts
    const result = subcategories.map((sub) => {
      const activeProductCount = sub.products.filter(p => p.status === "ACTIVE").length;
      const pendingProductCount = sub.products.filter(p => p.status === "PENDING").length;

      return {
        id: sub.id,
        name: sub.name,
        description: sub.description,
        commission: sub.commission,
        image: sub.image ? Buffer.from(sub.image).toString("base64") : undefined,
        createdAt: sub.createdAt.toISOString(),
        categoryId: sub.categoryId,
        activeProductCount,
        pendingProductCount,
        status: activeProductCount > 0 ? "ACTIVE" : "PENDING",
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}