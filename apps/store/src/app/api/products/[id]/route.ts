import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: Number(params.id),
      },
      include: {
        images: true,
        category: true,
        variants: {
          include: {
            values: {
              include: {
                variantValue: {
                  include: {
                    variantType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Convert image buffers -> base64
    const images = product.images.map((img) => ({
      id: img.id,
      url: `data:image/jpeg;base64,${Buffer.from(img.data).toString("base64")}`,
    }));

    const variantTypeMap = new Map<number, { id: number; name: string; slug: string; variantvalue: any[] }>();

    for (const variant of product.variants) {
      for (const pvv of variant.values) {
        const vv = pvv.variantValue;
        const vt = vv.variantType;

        if (!variantTypeMap.has(vt.id)) {
          variantTypeMap.set(vt.id, {
            id: vt.id,
            name: vt.name,
            slug: vt.slug,
            variantvalue: [],
          });
        }

        const entry = variantTypeMap.get(vt.id)!;

        if (!entry.variantvalue.some((v) => v.id === vv.id)) {
          entry.variantvalue.push({
            id: vv.id,
            variantTypeId: vv.variantTypeId,
            name: vv.name,
            hexCode: vv.hexCode,
            unit: vv.unit,
          });
        }
      }
    }

    const formattedProduct = {
      ...product,
      images,
      variantTypes: Array.from(variantTypeMap.values()),
    };

    return NextResponse.json({
      data: formattedProduct,
    });
  } catch (error) {
    console.error("FETCH PRODUCT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}