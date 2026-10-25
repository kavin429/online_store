import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryIdParam = searchParams.get("categoryId");

    if (!categoryIdParam) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    const categoryId = Number(categoryIdParam);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "categoryId must be a number" }, { status: 400 });
    }

    // ✅ Fetch subcategories with their products and linked variant types
    const subcategories = await prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: { createdAt: "desc" },
      include: {
        products: true,
        variantTypes: { include: { variantType: true } },
      },
    });

    // Map subcategories to include active/pending counts
    const result = subcategories.map((sub) => {
      return {
        id: sub.id,
        name: sub.name,
        description: sub.description,
        commission: sub.commission,
        image: sub.image ? Buffer.from(sub.image).toString("base64") : undefined,
        createdAt: sub.createdAt.toISOString(),
        categoryId: sub.categoryId,
        status: sub.status,
        variantTypeIds: sub.variantTypes.map((v) => v.variantTypeId),
        variantTypes: sub.variantTypes.map((v) => ({
          id: v.variantType.id,
          name: v.variantType.name,
          slug: v.variantType.slug,
        })),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const status = formData.get("status") as "ACTIVE" | "PENDING";
    const description = formData.get("description") as string | null;
    const commissionStr = formData.get("commission") as string | null;
    const categoryIdStr = formData.get("categoryId") as string;
    const variantTypeIdsStr = formData.get("variantTypeIds") as string | null;
    const imageFile = formData.get("image") as File | null;

    const categoryId = Number(categoryIdStr);
    const commission = commissionStr ? Number(commissionStr) : null;
    const variantTypeIds: number[] = variantTypeIdsStr
      ? JSON.parse(variantTypeIdsStr)
      : [];

    if (!name || !status || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const subcategory = await prisma.subCategory.create({
      data: {
        name,
        status,
        description: description || null,
        commission,
        categoryId,
        image: imageFile
          ? Buffer.from(await imageFile.arrayBuffer())
          : null,
        variantTypes: {
          create: variantTypeIds.map((variantTypeId) => ({
            variantType: { connect: { id: variantTypeId } },
          })),
        },
      },
      include: {
        variantTypes: { include: { variantType: true } },
      },
    });

    return NextResponse.json({
      ...subcategory,
      image: subcategory.image
        ? Buffer.from(subcategory.image).toString("base64")
        : undefined,
      variantTypeIds: subcategory.variantTypes.map((v) => v.variantTypeId),
    }, { status: 201 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}