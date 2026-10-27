import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { vendorId },
      include: {
        variants: {
          include: {
            values: { include: { variantValue: { include: { variantType: true } } } },
          },
        },
      },
    });

    const inventory = products.flatMap((product) =>
      product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        product: { id: product.id, name: product.name },
        attributes: variant.values.map((v) => ({
          type: v.variantValue.variantType.name,
          value: v.variantValue.name,
          hexCode: v.variantValue.hexCode,
        })),
        stock: variant.stock,
        priceOverride: variant.priceOverride,
      }))
    );

    const lowStock = inventory.filter((item) => item.stock < 10);

    return NextResponse.json({ data: inventory, lowStockCount: lowStock.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
