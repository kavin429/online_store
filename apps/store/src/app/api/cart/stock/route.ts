import { NextResponse } from "next/server";
import { checkStockForLines, type StockLine } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * POST /api/cart/stock
 * Body: { items: [{ id, variantId?, selectedVariants? }] }
 *
 * Returns the live stock for every cart line so the storefront can stop a
 * shopper from increasing a quantity beyond what is actually available.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    const lines: StockLine[] = rawItems
      .map((item: any) => ({
        productId: Number(item?.id ?? item?.productId),
        variantId: item?.variantId ?? null,
        selectedVariants: item?.selectedVariants ?? null,
      }))
      .filter(
        (line: StockLine) =>
          Number.isInteger(line.productId) && line.productId > 0,
      );

    if (lines.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items = await checkStockForLines(lines);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("CHECK CART STOCK ERROR:", error);
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 },
    );
  }
}
