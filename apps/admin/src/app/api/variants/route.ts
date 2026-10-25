import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { isAdmin } from "@/lib/auth";
// GET /api/variants - list all variant types (id, name, slug)
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const variantTypes = await prisma.variantType.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(variantTypes);
  } catch (err) {
    console.error("Failed to fetch variant types:", err);
    return NextResponse.json(
      { error: "Failed to fetch variant types" },
      { status: 500 },
    );
  }
}

// POST /api/variants - create a new variant type
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.variantType.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A variant type with this slug already exists" },
        { status: 409 },
      );
    }

    const variantType = await prisma.variantType.create({
      data: { name, slug },
    });

    return NextResponse.json(variantType, { status: 201 });
  } catch (err) {
    console.error("Failed to create variant type:", err);
    return NextResponse.json(
      { error: "Failed to create variant type" },
      { status: 500 },
    );
  }
}