import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((cat) => ({
      ...cat,
      imageUrl: cat.image
        ? `data:image/png;base64,${Buffer.from(cat.image).toString("base64")}`
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("FETCH CATEGORY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}