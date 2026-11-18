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
        // Category/subcategory images are binary; only the fields used by the
        // edit and detail screens are needed here.
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
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
  initialPriceAdjustment?: number | string;
  stock?: number | string;
  initialStock?: number | string;
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
    const subcategoryIdRaw = formData.get("subcategoryId");
    const subcategoryId =
      subcategoryIdRaw === null
        ? undefined
        : String(subcategoryIdRaw).trim() !== ""
          ? Number(subcategoryIdRaw)
          : null;
    const featured = formData.get("featured") === "true";
    const costPrice = parseFloat((formData.get("costPrice") as string) || "0");
    const sellingPrice = parseFloat((formData.get("sellingPrice") as string) || "0");
    const discountPercent = formData.get("discountPercent")
      ? parseFloat(formData.get("discountPercent") as string)
      : null;

    const options: Record<string, OptionEntry[]> = JSON.parse(
      (formData.get("options") as string) || "{}",
    );

    // Which variant types are still selected in Step 1. When provided, options
    // belonging to an unchecked type are ignored so removing a variant type
    // actually removes it from the saved product.
    let selectedVariantTypeIds: number[] | null = null;
    const variantTypeIdsRaw = formData.get("variantTypeIds");
    if (typeof variantTypeIdsRaw === "string" && variantTypeIdsRaw.trim() !== "") {
      try {
        const parsed = JSON.parse(variantTypeIdsRaw);
        if (Array.isArray(parsed)) {
          selectedVariantTypeIds = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));
        }
      } catch {
        // Ignore malformed payloads and keep the previous behaviour.
      }
    }

    let filteredOptions: Record<string, OptionEntry[]> = options;
    if (selectedVariantTypeIds) {
      const selectedSlugs = selectedVariantTypeIds.length
        ? new Set(
            (
              await prisma.variantType.findMany({
                where: { id: { in: selectedVariantTypeIds } },
                select: { slug: true },
              })
            ).map((type) => type.slug),
          )
        : new Set<string>();

      filteredOptions = Object.fromEntries(
        Object.entries(options).filter(([slug]) => selectedSlugs.has(slug)),
      );
    }

    const removedImageIdsRaw = formData.get("removedImageIds");
    let removedImageIds: number[] = [];
    if (typeof removedImageIdsRaw === "string" && removedImageIdsRaw.trim() !== "") {
      try {
        const parsed = JSON.parse(removedImageIdsRaw);
        if (Array.isArray(parsed)) {
          removedImageIds = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0);
        }
      } catch {
        // Ignore malformed payloads.
      }
    }

    const imageFiles = formData.getAll("images") as File[];
    const newImageBuffers = await Promise.all(
      imageFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
    );

    const optionImageFiles = formData.getAll("optionImages") as File[];
    const optionImageMap = new Map<string, Buffer>();
    for (const file of optionImageFiles) {
      optionImageMap.set(file.name, Buffer.from(await file.arrayBuffer()));
    }

    const activeTypeKeys = Object.keys(filteredOptions).filter(
      (key) =>
        Array.isArray(filteredOptions[key]) && filteredOptions[key].length > 0,
    );

    await prisma.$transaction(async (tx) => {
      // Update core product fields. subcategoryId is passed as-is so clearing
      // the subcategory (null) is persisted too.
      await tx.product.update({
        where: { id },
        data: {
          name,
          description,
          categoryId,
          ...(subcategoryId !== undefined ? { subcategoryId } : {}),
          featured,
          costPrice,
          sellingPrice,
          discountPercent,
        },
      });

      // Delete product images the user removed in the edit form
      if (removedImageIds.length > 0) {
        await tx.productImage.deleteMany({
          where: { id: { in: removedImageIds }, productId: id },
        });
      }

      // Append any newly uploaded images (existing ones stay)
      if (newImageBuffers.length > 0) {
        await tx.productImage.createMany({
          data: newImageBuffers.map((data) => ({ productId: id, data })),
        });
      }

      // Sync variants instead of deleting/recreating them, so variant IDs and
      // their inventory batches/logs survive normal edits.
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: {
          id: true,
          priceOverride: true,
          stock: true,
          image: true,
          values: { select: { variantValueId: true } },
        },
      });

      const variantKey = (ids: number[]) =>
        [...ids].sort((a, b) => a - b).join("-");

      const existingByKey = new Map<
        string,
        (typeof existingVariants)[number]
      >();
      for (const variant of existingVariants) {
        existingByKey.set(
          variantKey(variant.values.map((v) => v.variantValueId)),
          variant,
        );
      }

      const matchedVariantIds = new Set<number>();
      let totalStock = 0;

      if (activeTypeKeys.length > 0) {
        const valueArrays = activeTypeKeys.map((key) => filteredOptions[key]);
        const combos = cartesian(valueArrays);

        for (const combo of combos) {
          const variantValueIds = combo.map((e) => e.variantValueId);
          const key = variantKey(variantValueIds);
          const existing = existingByKey.get(key);

          // Price overrides are absolute values derived from the base price
          // plus the current per-value adjustments. Recomputing them on every
          // save keeps repeated edits stable and makes base-price edits stick.
          const newPriceSum = combo.reduce(
            (sum, e) => sum + (Number(e.priceAdjustment) || 0),
            0,
          );
          const priceOverride = sellingPrice + newPriceSum;

          const comboStock = Math.min(
            ...combo.map((e) => Number(e.stock) || 0),
          );
          const initialComboStock = Math.min(
            ...combo.map((e) => Number(e.initialStock) || 0),
          );
          const hasInitialStock = combo.every(
            (e) => e.initialStock !== undefined && e.initialStock !== null,
          );
          const stock =
            existing && hasInitialStock && comboStock === initialComboStock
              ? existing.stock
              : comboStock;
          totalStock += stock;

          const imageEntry = combo.find(
            (e) => !!e.image || !!e.existingImageUrl,
          );

          let imageBuffer: Buffer | null = null;
          if (imageEntry?.image) {
            // A new file was uploaded this save
            imageBuffer = optionImageMap.get(imageEntry.image) ?? null;
          } else if (imageEntry?.existingImageUrl) {
            // No new file — keep the existing image by decoding the data URL back to a buffer
            const match = imageEntry.existingImageUrl.match(
              /^data:.+;base64,(.+)$/,
            );
            imageBuffer = match
              ? Buffer.from(match[1], "base64")
              : existing?.image ?? null;
          }

          if (existing) {
            matchedVariantIds.add(existing.id);
            await tx.productVariant.update({
              where: { id: existing.id },
              data: { priceOverride, stock, image: imageBuffer },
            });
          } else {
            await tx.productVariant.create({
              data: {
                sku: `P${id}-${variantValueIds.join("-")}-${Date.now()}`,
                priceOverride,
                stock,
                image: imageBuffer,
                productId: id,
                values: {
                  create: variantValueIds.map((variantValueId) => ({
                    variantValueId,
                  })),
                },
              },
            });
          }
        }
      }

      // Remove variants whose combination no longer exists
      const variantIdsToDelete = existingVariants
        .filter((variant) => !matchedVariantIds.has(variant.id))
        .map((variant) => variant.id);

      if (variantIdsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: variantIdsToDelete } },
        });
      }

      // Update product stock only when variants were actually managed, or when
      // every existing variant was removed. Products without variants keep
      // their stock value.
      if (activeTypeKeys.length > 0) {
        await tx.product.update({ where: { id }, data: { stock: totalStock } });
      } else if (existingVariants.length > 0) {
        await tx.product.update({ where: { id }, data: { stock: 0 } });
      }
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