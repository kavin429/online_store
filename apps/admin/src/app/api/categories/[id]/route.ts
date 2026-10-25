import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { isAdmin } from "@/lib/auth";
/* =========================
   UPDATE CATEGORY
========================= */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const image = formData.get("image") as File | null;

    let imageBytes: Buffer | undefined;

    // Convert image to buffer only if new image selected
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      imageBytes = Buffer.from(bytes);
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(imageBytes && { image: imageBytes }),
      },
    });

    return NextResponse.json(updatedCategory);

  } catch (error: any) {
    console.error("UPDATE ERROR:", error);

    // Duplicate name error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Category not found or update failed" },
      { status: 500 }
    );
  }
}


/* =========================
   DELETE CATEGORY
========================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
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