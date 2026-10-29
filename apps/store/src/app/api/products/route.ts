import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const skip = (page - 1) * limit;

    // Products with no stock anywhere stay hidden from the storefront until
    // they are restocked (product-level or variant-level stock).
    const inStockOnly = {
      OR: [
        { stock: { gt: 0 } },
        { variants: { some: { stock: { gt: 0 } } } },
      ],
    };

    const products = await prisma.product.findMany({
      where: inStockOnly,
      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        category: true,
        subcategory: true,
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

    const total = await prisma.product.count({ where: inStockOnly });

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