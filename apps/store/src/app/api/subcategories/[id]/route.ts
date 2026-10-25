import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid subcategory ID" }, { status: 400 });

    // Optional: check if subcategory exists
    const sub = await prisma.subCategory.findUnique({ where: { id } });
    if (!sub) return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });

    // Delete the subcategory
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
    const imageFile = formData.get("image") as File | null;

    if (!name || !status) {
      return NextResponse.json({ error: "Name and status are required" }, { status: 400 });
    }

    const updated = await prisma.subCategory.update({
      where: { id },
      data: {
        name,
        status,
        description: description || null,
        commission: commission !== null ? commission : null,
        image: imageFile ? Buffer.from(await imageFile.arrayBuffer()) : undefined,
      },
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
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}