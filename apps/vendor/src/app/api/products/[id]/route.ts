import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        images: true,
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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const formattedProduct = {
      ...product,
      images: product.images.map((img) => ({
        id: img.id,
        url: `data:image/jpeg;base64,${Buffer.from(img.data).toString("base64")}`,
      })),
      variantTypeIds: Array.from(
        new Set(
          product.variants.flatMap((variant) =>
            variant.values.map((v) => v.variantValue.variantType.id)
          )
        )
      ),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        priceOverride: variant.priceOverride,
        stock: variant.stock,
        image: variant.image
          ? `data:image/jpeg;base64,${Buffer.from(variant.image).toString("base64")}`
          : null,
        attributes: variant.values.reduce((acc, v) => {
          const typeSlug = v.variantValue.variantType.slug;
          acc[typeSlug] = {
            id: v.variantValue.id,
            name: v.variantValue.name,
            hexCode: v.variantValue.hexCode,
            unit: v.variantValue.unit,
            variantTypeId: v.variantValue.variantType.id, // <-- add this too, useful elsewhere
          };
          return acc;
        }, {} as Record<string, { id: number; name: string; hexCode: string | null; unit: string | null; variantTypeId: number }>),
      })),
    };

    return NextResponse.json({ data: formattedProduct });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




/* =========================
   PATCH PRODUCT
========================= */
type OptionEntry = {
  variantValueId: number;
  priceAdjustment?: number | string;
  stock?: number | string;
  image?: string | null;
  existingImageUrl?: string | null;
};

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]],
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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

    const options: Record<string, OptionEntry[]> = JSON.parse(
      (formData.get("options") as string) || "{}",
    );

    const imageFiles = formData.getAll("images") as File[];
    const newImageBuffers = await Promise.all(
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

    await prisma.$transaction(async (tx) => {
      // Update core product fields
      await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          categoryId,
          subcategoryId: subcategoryId ?? undefined,
          featured,
          costPrice,
          sellingPrice,
          discountPercent,
        },
      });

      // Append any newly uploaded images (existing ones stay)
      if (newImageBuffers.length > 0) {
        await tx.productImage.createMany({
          data: newImageBuffers.map((data) => ({ productId: id, data })),
        });
      }

      // Rebuild variants: delete all existing, recreate from options
      await tx.productVariant.deleteMany({ where: { productId: id } });

      let totalStock = 0;

      if (activeTypeKeys.length > 0) {
        const valueArrays = activeTypeKeys.map((key) => options[key]);
        const combos = cartesian(valueArrays);

        for (const combo of combos) {
          const variantValueIds = combo.map((e) => e.variantValueId);
          const priceOverride =
            sellingPrice +
            combo.reduce((sum, e) => sum + (Number(e.priceAdjustment) || 0), 0);
          const comboStock = Math.min(...combo.map((e) => Number(e.stock) || 0));
          totalStock += comboStock;

          const imageEntry = combo.find((e) => !!e.image || !!e.existingImageUrl);

          let imageBuffer: Buffer | null = null;
          if (imageEntry?.image) {
            // A new file was uploaded this save
            imageBuffer = optionImageMap.get(imageEntry.image) ?? null;
          } else if (imageEntry?.existingImageUrl) {
            // No new file — keep the existing image by decoding the data URL back to a buffer
            const match = imageEntry.existingImageUrl.match(/^data:.+;base64,(.+)$/);
            if (match) {
              imageBuffer = Buffer.from(match[1], "base64");
            }
          }

          await tx.productVariant.create({
            data: {
              sku: `P${id}-${variantValueIds.join("-")}-${Date.now()}`,
              priceOverride,
              stock: comboStock,
              image: imageBuffer,
              productId: id,
              values: {
                create: variantValueIds.map((variantValueId) => ({ variantValueId })),
              },
            },
          });
        }
      }

      await tx.product.update({
        where: { id },
        data: { stock: totalStock },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH ERROR:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* =========================
   DELETE PRODUCT
========================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}