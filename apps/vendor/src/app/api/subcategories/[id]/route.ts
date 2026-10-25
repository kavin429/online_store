import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid subcategory ID" }, { status: 400 });

    // Optional: check if subcategory exists
    const sub = await prisma.subCategory.findUnique({ where: { id } });
    if (!sub) return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });

    // Delete the subcategory (variantTypes link rows cascade via onDelete: Cascade)
    await prisma.subCategory.delete({ where: { id } });

    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid subcategory ID" }, { status: 400 });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const status = formData.get("status") as "ACTIVE" | "PENDING";
    const description = formData.get("description") as string | null;
    const commissionStr = formData.get("commission") as string | null;
    const commission = commissionStr ? Number(commissionStr) : null;
    const variantTypeIdsStr = formData.get("variantTypeIds") as string | null;
    const imageFile = formData.get("image") as File | null;

    if (!name || !status) {
      return NextResponse.json({ error: "Name and status are required" }, { status: 400 });
    }

    const variantTypeIds: number[] | null = variantTypeIdsStr
      ? JSON.parse(variantTypeIdsStr)
      : null;

    // Use a transaction so the variant-type links stay in sync with the update.
    const updated = await prisma.$transaction(async (tx) => {
      if (variantTypeIds !== null) {
        await tx.subCategoryVariantType.deleteMany({
          where: { subcategoryId: id },
        });
      }

      return tx.subCategory.update({
        where: { id },
        data: {
          name,
          status,
          description: description || null,
          commission: commission !== null ? commission : null,
          image: imageFile ? Buffer.from(await imageFile.arrayBuffer()) : undefined,
          ...(variantTypeIds !== null
            ? {
                variantTypes: {
                  create: variantTypeIds.map((variantTypeId) => ({
                    variantType: { connect: { id: variantTypeId } },
                  })),
                },
              }
            : {}),
        },
        include: {
          variantTypes: { include: { variantType: true } },
        },
      });
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      description: updated.description,
      commission: updated.commission,
      image: updated.image ? Buffer.from(updated.image).toString("base64") : undefined,
      categoryId: updated.categoryId,
      createdAt: updated.createdAt.toISOString(),
      variantTypeIds: updated.variantTypes.map((v) => v.variantTypeId),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}