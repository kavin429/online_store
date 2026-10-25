import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { isAdmin } from "@/lib/auth";
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;

    // Convert uploaded image to Buffer
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const category = await prisma.category.create({
      data: {
        name,
        image: imageBuffer ?? undefined,
      },
    });

    // Convert image back to base64 so frontend can display it
    const formattedCategory = {
      ...category,
      imageUrl: category.image
        ? `data:image/png;base64,${Buffer.from(category.image).toString(
            "base64"
          )}`
        : null,
    };

    return NextResponse.json(formattedCategory);

  } catch (error: any) {
    console.error("CREATE CATEGORY ERROR:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { status: "PENDING" }, // only active categories
      include: {
        subcategories: { where: { status: "ACTIVE" } }, // only active subcategories
      },
      orderBy: { name: "asc" },
    });

    // Convert image bytes to base64 for frontend display
    const formatted = categories.map(cat => ({
      ...cat,
      imageUrl: cat.image
        ? `data:image/png;base64,${Buffer.from(cat.image).toString("base64")}`
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("FETCH CATEGORIES ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}