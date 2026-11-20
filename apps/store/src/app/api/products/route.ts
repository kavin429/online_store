import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(48, Math.max(1, Number(searchParams.get("limit") || 12)));
    const skip = (page - 1) * limit;

    const q = (searchParams.get("q") || searchParams.get("search") || "").trim();

    const categoryId = Number(
      searchParams.get("categoryId") || searchParams.get("category") || 0
    );

    const vendorId = Number(
      searchParams.get("vendorId") || searchParams.get("storeId") || 0
    );

    const sort = searchParams.get("sort") || "newest";
    const orderBy =
      sort === "price_asc"
        ? { sellingPrice: "asc" as const }
        : sort === "price_desc"
          ? { sellingPrice: "desc" as const }
          : sort === "name_asc"
            ? { name: "asc" as const }
            : { createdAt: "desc" as const };

    // Products with no stock anywhere stay hidden from the storefront until
    // they are restocked (product-level or variant-level stock).
    const inStockOnly = {
      OR: [
        { stock: { gt: 0 } },
        { variants: { some: { stock: { gt: 0 } } } },
      ],
    };

    const searchFilter = q
      ? {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { category: { name: { contains: q } } },
            { vendor: { name: { contains: q } } },
            { vendor: { vendorSettings: { is: { storeName: { contains: q } } } } },
          ],
        }
      : null;

    const where = {
      AND: [
        inStockOnly,
        ...(searchFilter ? [searchFilter] : []),
        ...(Number.isFinite(categoryId) && categoryId > 0
          ? [{ categoryId }]
          : []),
        ...(Number.isFinite(vendorId) && vendorId > 0 ? [{ vendorId }] : []),
      ],
    };

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,

      orderBy,

      include: {
        category: true,
        subcategory: true,
        vendor: {
          select: {
            id: true,
            name: true,
            vendorSettings: { select: { storeName: true } },
          },
        },
        images: true,
        variants: {
          include: {
            values: {
              include: {
                variantValue: {
                  include: { variantType: true },
                },
              },
            },
          },
        },
      },
    });

    // format images
    const formattedProducts = products.map((product) => ({
      ...product,

      images: product.images.map((img) => ({
        id: img.id,
        url: `data:image/jpeg;base64,${Buffer.from(img.data).toString(
          "base64"
        )}`,
      })),

      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        priceOverride: variant.priceOverride,
        stock: variant.stock,
        image: variant.image
          ? `data:image/jpeg;base64,${Buffer.from(variant.image).toString(
              "base64"
            )}`
          : null,
        // flatten values into { typeName: valueName } pairs, e.g. { Color: "Red", Size: "L" }
        attributes: variant.values.reduce((acc, v) => {
          acc[v.variantValue.variantType.name] = v.variantValue.name;
          return acc;
        }, {} as Record<string, string>),
      })),
    }));

    const total = await prisma.product.count({ where });

    return NextResponse.json({
      data: formattedProducts,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("FETCH PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}