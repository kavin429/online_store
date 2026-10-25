import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OptionEntry = {
  variantValueId: number;
  name?: string;
  hexCode?: string | null;
  priceAdjustment?: number | string;
  stock?: number | string;
  image?: string | null;
};

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((comboSoFar) => curr.map((item) => [...comboSoFar, item])),
    [[]],
  );
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const categoryId = Number(formData.get("categoryId"));
    const subcategoryIdRaw = formData.get("subcategoryId") as string;
    const subcategoryId = subcategoryIdRaw ? Number(subcategoryIdRaw) : null;

    const featured = formData.get("featured") === "true";

    const costPrice = parseFloat((formData.get("costPrice") as string) || "0");
    const sellingPrice = parseFloat((formData.get("sellingPrice") as string) || "0");
    const discountPercent = formData.get("discountPercent")
      ? parseFloat(formData.get("discountPercent") as string)
      : null;

    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!name || !categoryId) {
      return NextResponse.json({ error: "Name and category required" }, { status: 400 });
    }

    const options: Record<string, OptionEntry[]> = JSON.parse(
      (formData.get("options") as string) || "{}",
    );
    const imageFiles = formData.getAll("images") as File[];
    const imageBuffers = await Promise.all(
      imageFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
    );
    const optionImageFiles = formData.getAll("optionImages") as File[];
    const optionImageMap = new Map<string, Buffer>();
    for (const file of optionImageFiles) {
      optionImageMap.set(file.name, Buffer.from(await file.arrayBuffer()));
    }

    const activeTypeKeys = Object.keys(options).filter(
      (key) => Array.isArray(options[key]) && options[key].length > 0,
    );

    let totalStock = 0;

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          categoryId,
          subcategoryId: subcategoryId ?? undefined,
          featured,
          vendorId: vendorId ?? undefined,
          costPrice,
          sellingPrice,
          discountPercent,
          images: {
            create: imageBuffers.map((buffer) => ({ data: buffer })),
          },
        },
      });
      if (activeTypeKeys.length > 0) {
        const valueArrays = activeTypeKeys.map((key) => options[key]);
        const combos = cartesian(valueArrays);

        for (const combo of combos) {
          const variantValueIds = combo.map((entry) => entry.variantValueId);

          const priceAdjustmentSum = combo.reduce(
            (sum, entry) => sum + (Number(entry.priceAdjustment) || 0),
            0,
          );
          const priceOverride = sellingPrice + priceAdjustmentSum;
          const stockValues = combo.map((entry) => Number(entry.stock) || 0);
          const comboStock = stockValues.length > 0 ? Math.min(...stockValues) : 0;
          totalStock += comboStock;

          const imageEntry = combo.find((entry) => !!entry.image);
          const imageBuffer = imageEntry?.image
            ? optionImageMap.get(imageEntry.image)
            : undefined;
          await tx.productVariant.create({
            data: {
              sku: `P${product.id}-${variantValueIds.join("-")}`,
              priceOverride,
              stock: comboStock,
              image: imageBuffer ?? null,
              productId: product.id,
              values: {
                create: variantValueIds.map((variantValueId) => ({ variantValueId })),
              },
            },
          });
        }
        await tx.product.update({
          where: { id: product.id },
          data: { stock: totalStock },
        });
      }

      return product;
    });

    const full = await prisma.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        images: true,
        variants: { include: { values: { include: { variantValue: true } } } },
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// ─────────────────────────────
// GET PRODUCTS
// ─────────────────────────────
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
        category: true,
        vendor: true,
        images: true,
        variants: { include: { values: { include: { variantValue: true } } } },
      },
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      images: product.images.map((img) => ({
        id: img.id,
        url: `data:image/jpeg;base64,${Buffer.from(img.data).toString("base64")}`,
      })),
    }));

    return NextResponse.json({ data: formattedProducts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
