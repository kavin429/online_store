import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const toImageUrl = (image: Uint8Array | Buffer | null) =>
  image ? `data:image/png;base64,${Buffer.from(image).toString("base64")}` : null;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const name = (formData.get("name") as string | null)?.trim();
    const imageFile = formData.get("image") as File | null;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer | null = null;

    if (imageFile && imageFile.size > 0) {
      imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    }

    const category = await prisma.category.create({
      data: {
        name,
        status: "PENDING",
        image: imageBuffer ?? undefined,
      },
    });

    const { image, ...rest } = category;
    return NextResponse.json({ ...rest, imageUrl: toImageUrl(image) });
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
    // ?status=PENDING (default) | ACTIVE | ALL
    const status = (req.nextUrl.searchParams.get("status") || "PENDING").toUpperCase();

    const categories = await prisma.category.findMany({
      where: status === "ALL" ? undefined : { status: status as any },
      include: { subcategories: true },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map(({ image, ...cat }) => ({
      ...cat,
      imageUrl: toImageUrl(image),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("FETCH CATEGORIES ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}